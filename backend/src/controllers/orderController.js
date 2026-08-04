const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Settings = require('../models/Settings');
const Offer = require('../models/Offer');
const DeliveryBoy = require('../models/DeliveryBoy');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const generateOrderId = require('../utils/generateOrderId');
const { emitNewOrder, emitOrderStatusUpdate, emitOrderAcknowledged, emitRiderStatusUpdate } = require('../config/socket');

// ─── Public: Place Order ──────────────────────────────────────────────────────

exports.placeOrder = catchAsync(async (req, res, next) => {
  const restaurantId = req.params.restaurantId;
  const { customer, items, couponCode } = req.body;

  // ── Block orders when restaurant is closed ─────────────────────────────────
  const restaurantSettings = await Settings.findOne({ restaurantId });
  if (restaurantSettings && restaurantSettings.isOpen === false) {
    return next(new AppError('Restaurant is currently closed. Please try again later.', 503));
  }

  // Validate and enrich items from DB — fetch ALL requested items (including
  // any that have since gone unavailable) so we can tell the customer exactly
  // what got dropped, instead of silently shrinking their order.
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurantId,
  });

  if (menuItems.length === 0) {
    return next(new AppError('No valid items found', 400));
  }

  const menuMap = {};
  menuItems.forEach((m) => (menuMap[m._id.toString()] = m));

  const enrichedItems = [];
  const removedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const menuItem = menuMap[item.menuItemId];
    if (!menuItem || !menuItem.isAvailable) {
      if (menuItem) removedItems.push(menuItem.name);
      continue; // skip items that no longer exist or just went out of stock
    }
    const qty = parseInt(item.quantity, 10);
    const itemTotal = menuItem.price * qty;
    subtotal += itemTotal;
    enrichedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
      imageUrl: menuItem.imageUrl,
      isVeg: menuItem.isVeg,
    });
  }

  if (enrichedItems.length === 0) {
    return next(new AppError('All selected items are currently unavailable', 400));
  }

  // Get delivery charge from settings, plus any extra charge for the customer's selected area
  const settings = await Settings.findOne({ restaurantId });
  let deliveryCharge = settings?.deliveryCharge ?? 40;

  const selectedArea = customer?.area
    ? settings?.deliveryAreas?.find(
        (a) => a.isActive && a.name.toLowerCase() === customer.area.trim().toLowerCase()
      )
    : null;
  if (selectedArea) deliveryCharge += selectedArea.extraCharge || 0;

  if (settings?.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove) {
    deliveryCharge = 0;
  }

  // Apply coupon
  let discount = 0;
  let validCoupon = null;
  if (couponCode) {
    validCoupon = await Offer.findOne({
      restaurantId,
      code: couponCode.toUpperCase(),
      isActive: true,
      $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
    });

    if (validCoupon && subtotal >= (validCoupon.minOrderValue || 0)) {
      if (validCoupon.discountType === 'percent') {
        discount = Math.round((subtotal * validCoupon.discountValue) / 100);
        if (validCoupon.maxDiscount) discount = Math.min(discount, validCoupon.maxDiscount);
      } else if (validCoupon.discountType === 'flat') {
        discount = validCoupon.discountValue;
      } else if (validCoupon.discountType === 'free_delivery') {
        deliveryCharge = 0;
      }
      // Increment usage count
      await Offer.findByIdAndUpdate(validCoupon._id, { $inc: { usageCount: 1 } });
    }
  }

  const total = Math.max(0, subtotal - discount + deliveryCharge);

  // Generate unique order ID (retry on collision)
  let orderId;
  let attempts = 0;
  do {
    orderId = generateOrderId();
    const existing = await Order.findOne({ orderId });
    if (!existing) break;
    attempts++;
  } while (attempts < 5);

  const order = await Order.create({
    orderId,
    restaurantId,
    customer,
    items: enrichedItems,
    subtotal,
    deliveryCharge,
    discount,
    total,
    couponCode: validCoupon ? couponCode.toUpperCase() : undefined,
    statusHistory: [{ status: 'pending' }],
  });

  // Emit real-time event to dashboard
  emitNewOrder(restaurantId, order.toJSON());

  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    data: { order, removedItems },
  });
});

// ─── Public: Track Order ──────────────────────────────────────────────────────

exports.trackOrder = catchAsync(async (req, res, next) => {
  const { orderId, phone } = req.query;

  const order = await Order.findOne({
    orderId: orderId.toUpperCase(),
    'customer.phone': phone,
  })
    .select('-isAcknowledged -restaurantId')
    .populate('assignedRider', 'name phone vehicleNumber');

  if (!order) {
    return next(new AppError('Order not found. Please check your Order ID and phone number.', 404));
  }

  res.status(200).json({
    success: true,
    data: { order },
  });
});

// ─── Public: Order History by phone (all past orders for this customer) ──────

exports.getOrderHistory = catchAsync(async (req, res, next) => {
  const { phone } = req.query;

  const orders = await Order.find({ 'customer.phone': phone })
    .select('-isAcknowledged -restaurantId')
    .populate('assignedRider', 'name phone vehicleNumber')
    .sort({ createdAt: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    data: { orders },
  });
});

// ─── Dashboard: Get All Orders ────────────────────────────────────────────────

exports.getOrders = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;
  const { status, date, page = 1, limit = 50 } = req.query;

  const filter = { restaurantId };
  if (status && status !== 'all') filter.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

// ─── Dashboard: Clear Orders ──────────────────────────────────────────────────
// Deletes orders matching the same status/date filters as getOrders above.
// Omitting both filters clears every order for the restaurant.

exports.clearOrders = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;
  const { status, date } = req.query;

  const filter = { restaurantId };
  if (status && status !== 'all') filter.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  const result = await Order.deleteMany(filter);

  res.status(200).json({
    success: true,
    data: { deletedCount: result.deletedCount },
  });
});

// ─── Dashboard: Get Single Order ─────────────────────────────────────────────

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurantId: req.restaurant._id,
  });

  if (!order) return next(new AppError('Order not found', 404));

  res.status(200).json({ success: true, data: { order } });
});

// ─── Dashboard: Update Order Status ──────────────────────────────────────────

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const restaurantId = req.restaurant._id;

  const order = await Order.findOne({ _id: req.params.id, restaurantId });
  if (!order) return next(new AppError('Order not found', 404));

  // Prevent backwards status changes
  const flow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
  if (
    status !== 'cancelled' &&
    flow.indexOf(status) < flow.indexOf(order.status) &&
    order.status !== 'cancelled'
  ) {
    return next(new AppError(`Cannot change status from ${order.status} to ${status}`, 400));
  }

  order.status = status;
  await order.save();

  // Auto-acknowledge on confirm or cancel
  if (!order.isAcknowledged && ['confirmed', 'cancelled'].includes(status)) {
    order.isAcknowledged = true;
    order.acknowledgedAt = new Date();
    await order.save();
    emitOrderAcknowledged(restaurantId.toString(), order._id.toString());
  }

  await order.populate('assignedRider', 'name phone vehicleNumber');
  emitOrderStatusUpdate(restaurantId.toString(), order.orderId, status, order.toJSON());

  // When an order is cancelled and had an assigned rider, check if that rider
  // still has other active deliveries; if not, flip them back to Available.
  if (status === 'cancelled' && order.assignedRider) {
    const riderId = typeof order.assignedRider === 'object'
      ? order.assignedRider._id.toString()
      : order.assignedRider.toString();
    const remaining = await Order.countDocuments({
      assignedRider: riderId,
      status: { $in: ['ready', 'out_for_delivery'] },
    });
    const riderStatus = remaining > 0 ? 'on_delivery' : 'available';
    emitRiderStatusUpdate(restaurantId.toString(), riderId, riderStatus, null);
  }

  res.status(200).json({
    success: true,
    message: `Order ${status}`,
    data: { order },
  });
});

// ─── Dashboard: Acknowledge Order (silence alert) ─────────────────────────────

exports.acknowledgeOrder = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, restaurantId },
    { isAcknowledged: true, acknowledgedAt: new Date() },
    { new: true }
  );

  if (!order) return next(new AppError('Order not found', 404));

  emitOrderAcknowledged(restaurantId.toString(), order._id.toString());

  res.status(200).json({ success: true, data: { order } });
});

// ─── Dashboard: Get Unacknowledged Count ─────────────────────────────────────

exports.getUnacknowledgedCount = catchAsync(async (req, res, next) => {
  const count = await Order.countDocuments({
    restaurantId: req.restaurant._id,
    isAcknowledged: false,
    status: 'pending',
  });

  res.status(200).json({ success: true, data: { count } });
});

// ─── Rider: Get my assigned orders ────────────────────────────────────────────
// Active = ready/out_for_delivery and assigned to me. History = delivered/cancelled.

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const riderId = req.rider._id;
  const { view = 'active' } = req.query;

  const filter =
    view === 'history'
      ? { assignedRider: riderId, status: { $in: ['delivered', 'cancelled'] } }
      : { assignedRider: riderId, status: { $in: ['ready', 'out_for_delivery'] } };

  const sort = view === 'history' ? { deliveredAt: -1, updatedAt: -1 } : { assignedAt: 1 };
  const limit = view === 'history' ? 30 : 0;

  let query = Order.find(filter).sort(sort);
  if (limit) query = query.limit(limit);

  const orders = await query;

  res.status(200).json({ success: true, data: { orders } });
});

// ─── Rider: Start delivery (picked up from restaurant) ───────────────────────

exports.startDelivery = catchAsync(async (req, res, next) => {
  const riderId = req.rider._id;

  const order = await Order.findOne({ _id: req.params.id, assignedRider: riderId });
  if (!order) return next(new AppError('Order not found or not assigned to you', 404));

  if (order.status !== 'ready') {
    return next(new AppError(`Cannot start delivery from status "${order.status}"`, 400));
  }

  order.status = 'out_for_delivery';
  order.pickedUpAt = new Date();
  await order.save();
  await order.populate('assignedRider', 'name phone vehicleNumber');

  emitOrderStatusUpdate(order.restaurantId.toString(), order.orderId, order.status, order.toJSON());

  res.status(200).json({ success: true, message: 'Delivery started', data: { order } });
});

// ─── Rider: Finish order (delivered to customer) ──────────────────────────────

exports.finishOrder = catchAsync(async (req, res, next) => {
  const riderId = req.rider._id;

  const order = await Order.findOne({ _id: req.params.id, assignedRider: riderId });
  if (!order) return next(new AppError('Order not found or not assigned to you', 404));

  if (!['ready', 'out_for_delivery'].includes(order.status)) {
    return next(new AppError(`Cannot finish an order from status "${order.status}"`, 400));
  }

  order.status = 'delivered';
  order.deliveredAt = new Date();
  await order.save();
  await order.populate('assignedRider', 'name phone vehicleNumber');

  await DeliveryBoy.findByIdAndUpdate(riderId, { $inc: { totalDeliveries: 1 } });

  emitOrderStatusUpdate(order.restaurantId.toString(), order.orderId, order.status, order.toJSON());

  // Rider has finished — check if they still have other active orders
  const remaining = await Order.countDocuments({
    assignedRider: riderId,
    status: { $in: ['ready', 'out_for_delivery'] },
  });
  const riderStatus = remaining > 0 ? 'on_delivery' : 'available';
  emitRiderStatusUpdate(order.restaurantId.toString(), riderId.toString(), riderStatus, null);

  res.status(200).json({ success: true, message: 'Order delivered! 🎉', data: { order } });
});
