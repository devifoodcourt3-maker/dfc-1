const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');
const DeliveryBoy = require('../models/DeliveryBoy');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  const restaurant = await Restaurant.findById(decoded.id);
  if (!restaurant) {
    return next(new AppError('The account belonging to this token no longer exists.', 401));
  }

  if (!restaurant.isActive) {
    return next(new AppError('This restaurant account has been deactivated.', 403));
  }

  req.restaurant = restaurant;
  next();
});

// ── Delivery rider auth ───────────────────────────────────────────────────────
const protectRider = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  if (decoded.role !== 'rider') {
    return next(new AppError('Invalid token for this resource.', 401));
  }

  const rider = await DeliveryBoy.findById(decoded.id);
  if (!rider) {
    return next(new AppError('The account belonging to this token no longer exists.', 401));
  }

  if (!rider.isActive) {
    return next(new AppError('Your account has been deactivated. Contact the restaurant admin.', 403));
  }

  req.rider = rider;
  next();
});

// ── Local KOT print agent auth ────────────────────────────────────────────────
// The print agent runs unattended on a machine at the restaurant, so it can't
// hold a user JWT — it authenticates with a long-lived per-restaurant key instead.
const protectPrintAgent = catchAsync(async (req, res, next) => {
  const key = req.headers['x-print-agent-key'];
  if (!key) {
    return next(new AppError('Missing print agent key', 401));
  }

  const restaurant = await Restaurant.findOne({ printAgentKey: key }).select('+printAgentKey');
  if (!restaurant) {
    return next(new AppError('Invalid print agent key', 401));
  }

  if (!restaurant.isActive) {
    return next(new AppError('This restaurant account has been deactivated.', 403));
  }

  req.restaurant = restaurant;
  next();
});

module.exports = { protect, protectRider, protectPrintAgent };
