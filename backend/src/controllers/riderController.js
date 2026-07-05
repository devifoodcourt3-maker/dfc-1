const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { emitOrderAssigned, emitOrderStatusUpdate, emitRiderStatusUpdate } = require('../config/socket');

// ─── Admin: List delivery boys ────────────────────────────────────────────────

exports.getRiders = catchAsync(async (req, res, next) => {
  const riders = await DeliveryBoy.find({ restaurantId: req.restaurant._id }).sort({ createdAt: -1 });

  // Active order count per rider, for a quick "busy" indicator on the admin list
  const activeCounts = await Order.aggregate([
    {
      $match: {
        restaurantId: req.restaurant._id,
        assignedRider: { $ne: null },
        status: { $in: ['ready', 'out_for_delivery'] },
      },
    },
    { $group: { _id: '$assignedRider', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  activeCounts.forEach((c) => (countMap[c._id.toString()] = c.count));

  // For riders who are busy, fetch the most recent active order so the
  // dashboard card can immediately show order ID + assigned time on page load.
  const busyRiderIds = Object.keys(countMap);
  const activeOrderMap = {};
  if (busyRiderIds.length > 0) {
    const activeOrders = await Order.find({
      assignedRider: { $in: busyRiderIds },
      status: { $in: ['ready', 'out_for_delivery'] },
    })
      .select('assignedRider orderId assignedAt status')
      .sort({ assignedAt: -1 });
    activeOrders.forEach((o) => {
      const key = o.assignedRider.toString();
      if (!activeOrderMap[key]) {
        activeOrderMap[key] = { orderId: o.orderId, assignedAt: o.assignedAt, status: o.status };
      }
    });
  }

  const ridersWithLoad = riders.map((r) => ({
    ...r.toJSON(),
    activeOrders: countMap[r._id.toString()] || 0,
    activeOrder: activeOrderMap[r._id.toString()] || null,
  }));

  res.status(200).json({ success: true, data: { riders: ridersWithLoad } });
});

// ─── Admin: Add a delivery boy ────────────────────────────────────────────────

exports.addRider = catchAsync(async (req, res, next) => {
  const { name, phone, email, password, vehicleNumber } = req.body;

  const existing = await DeliveryBoy.findOne({
    restaurantId: req.restaurant._id,
    email: email.toLowerCase(),
  });
  if (existing) {
    return next(new AppError('A delivery boy with this email already exists', 400));
  }

  const rider = await DeliveryBoy.create({
    restaurantId: req.restaurant._id,
    name,
    phone,
    email: email.toLowerCase(),
    password,
    vehicleNumber,
  });

  res.status(201).json({ success: true, message: 'Delivery boy added', data: { rider } });
});

// ─── Admin: Toggle active/inactive ────────────────────────────────────────────

exports.toggleRiderActive = catchAsync(async (req, res, next) => {
  const rider = await DeliveryBoy.findOne({ _id: req.params.id, restaurantId: req.restaurant._id });
  if (!rider) return next(new AppError('Delivery boy not found', 404));

  rider.isActive = !rider.isActive;
  await rider.save();

  res.status(200).json({ success: true, data: { rider } });
});

// ─── Admin: Remove a delivery boy ─────────────────────────────────────────────

exports.removeRider = catchAsync(async (req, res, next) => {
  const rider = await DeliveryBoy.findOne({ _id: req.params.id, restaurantId: req.restaurant._id });
  if (!rider) return next(new AppError('Delivery boy not found', 404));

  // Unassign any orders currently out with this rider so they don't get stranded
  await Order.updateMany(
    { assignedRider: rider._id, status: { $in: ['ready', 'out_for_delivery'] } },
    { $set: { assignedRider: null, riderName: '', status: 'ready' } }
  );

  await rider.deleteOne();

  res.status(200).json({ success: true, message: 'Delivery boy removed' });
});

// ─── Admin: Assign an order to a rider ────────────────────────────────────────

exports.assignOrder = catchAsync(async (req, res, next) => {
  const { riderId } = req.body;
  const restaurantId = req.restaurant._id;

  const order = await Order.findOne({ _id: req.params.id, restaurantId });
  if (!order) return next(new AppError('Order not found', 404));

  if (!['ready', 'out_for_delivery'].includes(order.status)) {
    return next(new AppError('Order must be marked ready before assigning a rider', 400));
  }

  const rider = await DeliveryBoy.findOne({ _id: riderId, restaurantId, isActive: true });
  if (!rider) return next(new AppError('Delivery boy not found or inactive', 404));

  order.assignedRider = rider._id;
  order.riderName = rider.name;
  order.assignedAt = new Date();
  await order.save();
  // Populate so both the live socket payload and the API response carry
  // rider name/phone/vehicle — the customer-facing tracking page needs this.
  await order.populate('assignedRider', 'name phone vehicleNumber');

  emitOrderAssigned(rider._id.toString(), order.toJSON());
  emitOrderStatusUpdate(restaurantId.toString(), order.orderId, order.status, order.toJSON());

  // Notify the dashboard that this rider is now On Delivery
  emitRiderStatusUpdate(restaurantId.toString(), rider._id.toString(), 'on_delivery', {
    orderId: order.orderId,
    assignedAt: order.assignedAt,
    status: order.status,
  });

  res.status(200).json({
    success: true,
    message: `Order assigned to ${rider.name}`,
    data: { order },
  });
});

// ─── Admin: Unassign an order ─────────────────────────────────────────────────

exports.unassignOrder = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;

  const order = await Order.findOne({ _id: req.params.id, restaurantId });
  if (!order) return next(new AppError('Order not found', 404));

  const prevRiderId = order.assignedRider?.toString();

  order.assignedRider = null;
  order.riderName = '';
  if (order.status === 'out_for_delivery') order.status = 'ready';
  await order.save();

  emitOrderStatusUpdate(restaurantId.toString(), order.orderId, order.status, order.toJSON());

  // Check if this rider still has other active orders; if not, mark Available
  if (prevRiderId) {
    const remaining = await Order.countDocuments({
      assignedRider: prevRiderId,
      status: { $in: ['ready', 'out_for_delivery'] },
    });
    const riderStatus = remaining > 0 ? 'on_delivery' : 'available';
    emitRiderStatusUpdate(restaurantId.toString(), prevRiderId, riderStatus, null);
  }

  res.status(200).json({ success: true, data: { order } });
});
