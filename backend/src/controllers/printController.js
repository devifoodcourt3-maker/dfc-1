const crypto = require('crypto');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { emitPrintKOT, emitPrintStatusUpdate } = require('../config/socket');

// ─── Print Agent: Get Pending Print Jobs ──────────────────────────────────────
// Catch-up mechanism: the agent calls this on startup and on every socket
// reconnect, so a KOT that was pushed via socket while the agent was offline
// (printer disconnected, PC restarted, network blip) still gets printed instead
// of silently disappearing. Only 'pending' jobs are returned — 'failed' jobs
// wait for an explicit admin retry (see retryPrint) to avoid looping forever
// on a ticket the printer keeps rejecting.

exports.getPendingPrintJobs = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;

  const orders = await Order.find({
    restaurantId,
    'kot.status': 'pending',
  }).sort({ 'kot.requestedAt': 1 });

  res.status(200).json({
    success: true,
    data: { orders },
  });
});

// ─── Print Agent: Report Print Result ─────────────────────────────────────────
// Called by the agent after it has exhausted its own local retry attempts
// (see print-agent/src/printerClient.js) for a single job.

exports.reportPrintResult = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;
  const { orderId } = req.params;
  const { success, error } = req.body;

  const order = await Order.findOne({ _id: orderId, restaurantId });
  if (!order) return next(new AppError('Order not found', 404));

  if (success) {
    order.kot.status = 'printed';
    order.kot.printedAt = new Date();
    order.kot.lastError = '';
  } else {
    order.kot.status = 'failed';
    order.kot.attempts += 1;
    order.kot.lastError = (error || 'Unknown printer error').slice(0, 500);
  }
  await order.save();

  emitPrintStatusUpdate(restaurantId.toString(), order.orderId, order.kot);

  res.status(200).json({ success: true, data: { kot: order.kot } });
});

// ─── Dashboard: Retry Print ────────────────────────────────────────────────────
// Admin-triggered re-print for an order whose KOT failed (printer offline, out
// of paper, etc). Resets the job to 'pending' and pushes it back to the agent.

exports.retryPrint = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;

  const order = await Order.findOne({ _id: req.params.id, restaurantId });
  if (!order) return next(new AppError('Order not found', 404));

  order.kot.status = 'pending';
  order.kot.requestedAt = new Date();
  order.kot.lastError = '';
  await order.save();

  emitPrintStatusUpdate(restaurantId.toString(), order.orderId, order.kot);
  emitPrintKOT(restaurantId.toString(), order.toJSON());

  res.status(200).json({
    success: true,
    message: 'Reprint requested',
    data: { kot: order.kot },
  });
});

// ─── Dashboard: Get Print Agent Key ───────────────────────────────────────────
// Admin pastes this + the restaurant ID into the local print agent's .env to
// authenticate it (see print-agent/.env.example).

exports.getPrintAgentKey = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.restaurant._id).select('+printAgentKey');

  // Restaurants created before this feature existed won't have a key yet —
  // the generator normally runs in Restaurant's pre('save') hook, which only
  // fires on save, not on read. Provision one lazily here instead.
  if (!restaurant.printAgentKey) {
    restaurant.printAgentKey = crypto.randomBytes(24).toString('hex');
    await restaurant.save();
  }

  res.status(200).json({
    success: true,
    data: { restaurantId: restaurant._id, printAgentKey: restaurant.printAgentKey },
  });
});

// ─── Dashboard: Regenerate Print Agent Key ────────────────────────────────────
// Invalidates the old key (e.g. if it leaked or the agent PC was replaced).

exports.regeneratePrintAgentKey = catchAsync(async (req, res, next) => {
  const printAgentKey = crypto.randomBytes(24).toString('hex');

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant._id,
    { printAgentKey },
    { new: true, runValidators: false }
  ).select('+printAgentKey');

  res.status(200).json({
    success: true,
    message: 'Print agent key regenerated. Update it in the print agent .env and restart the agent.',
    data: { restaurantId: restaurant._id, printAgentKey: restaurant.printAgentKey },
  });
});
