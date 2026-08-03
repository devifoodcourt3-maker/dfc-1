const { validationResult, body, param, query } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('. ');
    return next(new AppError(messages, 400));
  }
  next();
};

// Auth validators
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Order validators
const placeOrderValidation = [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('customer.phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  body('customer.address').trim().notEmpty().withMessage('Delivery address is required'),
  body('customer.area').optional({ checkFalsy: true }).trim(),
  body('customer.location.lat').notEmpty().withMessage('Please pin your location on the map').isFloat({ min: -90, max: 90 }).withMessage('Invalid map latitude'),
  body('customer.location.lng').notEmpty().withMessage('Please pin your location on the map').isFloat({ min: -180, max: 180 }).withMessage('Invalid map longitude'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItemId').notEmpty().withMessage('Item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  validate,
];

const trackOrderValidation = [
  query('orderId').notEmpty().withMessage('Order ID is required'),
  query('phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid phone number required'),
  validate,
];

const orderHistoryValidation = [
  query('phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid phone number required'),
  validate,
];

const updateStatusValidation = [
  body('status')
    .isIn(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid status value'),
  validate,
];

// Rider validators
const riderLoginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const addRiderValidation = [
  body('name').trim().notEmpty().withMessage('Delivery boy name is required'),
  body('phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const assignOrderValidation = [
  body('riderId').notEmpty().withMessage('riderId is required'),
  validate,
];

// Menu validators
const menuItemValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  validate,
];

// Settings validators
const settingsValidation = [
  body('deliveryCharge').optional().isFloat({ min: 0 }).withMessage('Delivery charge must be positive'),
  body('minOrderValue').optional().isFloat({ min: 0 }).withMessage('Minimum order value must be positive'),
  validate,
];

// Coupon validation
const applyCouponValidation = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal required'),
  validate,
];

module.exports = {
  validate,
  loginValidation,
  placeOrderValidation,
  trackOrderValidation,
  orderHistoryValidation,
  updateStatusValidation,
  menuItemValidation,
  settingsValidation,
  applyCouponValidation,
  riderLoginValidation,
  addRiderValidation,
  assignOrderValidation,
};
