const Settings = require('../models/Settings');
const Restaurant = require('../models/Restaurant');
const Offer = require('../models/Offer');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { deleteImage } = require('../config/cloudinary');
const { emitSettingsUpdate } = require('../config/socket');

// ─── Public: Get Settings ─────────────────────────────────────────────────────

exports.getPublicSettings = catchAsync(async (req, res, next) => {
  const restaurantId = req.params.restaurantId;

  const [settings, restaurant] = await Promise.all([
    Settings.findOne({ restaurantId }),
    Restaurant.findById(restaurantId).select('-ownerEmail -__v'),
  ]);

  if (!restaurant) return next(new AppError('Restaurant not found', 404));

  res.status(200).json({
    success: true,
    data: { restaurant, settings },
  });
});

// ─── Dashboard: Get Settings ──────────────────────────────────────────────────

exports.getSettings = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;

  let settings = await Settings.findOne({ restaurantId });
  if (!settings) {
    settings = await Settings.create({ restaurantId });
  }

  const restaurant = await Restaurant.findById(restaurantId);

  res.status(200).json({
    success: true,
    data: { restaurant, settings },
  });
});

// ─── Dashboard: Update Settings ───────────────────────────────────────────────

exports.updateSettings = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;
  const {
    deliveryCharge, freeDeliveryAbove, minOrderValue,
    isOpen, openingHours, deliveryAreas,
    taxPercent, estimatedDeliveryMins, socialLinks,
  } = req.body;

  const updateData = {};
  if (deliveryCharge !== undefined) updateData.deliveryCharge = parseFloat(deliveryCharge);
  if (freeDeliveryAbove !== undefined) updateData.freeDeliveryAbove = parseFloat(freeDeliveryAbove);
  if (minOrderValue !== undefined) updateData.minOrderValue = parseFloat(minOrderValue);
  if (isOpen !== undefined) updateData.isOpen = isOpen;
  if (openingHours !== undefined) updateData.openingHours = openingHours;
  if (deliveryAreas !== undefined) updateData.deliveryAreas = deliveryAreas;
  if (taxPercent !== undefined) updateData.taxPercent = parseFloat(taxPercent);
  if (estimatedDeliveryMins !== undefined) updateData.estimatedDeliveryMins = parseInt(estimatedDeliveryMins);
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

  const settings = await Settings.findOneAndUpdate(
    { restaurantId },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );

  emitSettingsUpdate(restaurantId);

  res.status(200).json({
    success: true,
    message: 'Settings updated',
    data: { settings },
  });
});

// ─── Dashboard: Update Restaurant Profile ─────────────────────────────────────

exports.updateRestaurant = catchAsync(async (req, res, next) => {
  const { name, phone, email, address, tagline } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (email) updateData.email = email;
  if (address) updateData.address = address;
  if (tagline) updateData.tagline = tagline;

  if (req.file) {
    const current = await Restaurant.findById(req.restaurant._id);
    if (current?.logoCloudinaryId) await deleteImage(current.logoCloudinaryId);
    updateData.logoUrl = req.file.path;
    updateData.logoCloudinaryId = req.file.filename;
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.restaurant._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  emitSettingsUpdate(req.restaurant._id);

  res.status(200).json({
    success: true,
    message: 'Restaurant profile updated',
    data: { restaurant },
  });
});

// ─── Dashboard: Toggle Open/Closed ────────────────────────────────────────────

exports.toggleOpen = catchAsync(async (req, res, next) => {
  const restaurantId = req.restaurant._id;

  const settings = await Settings.findOne({ restaurantId });
  if (!settings) return next(new AppError('Settings not found', 404));

  settings.isOpen = !settings.isOpen;
  await settings.save();

  emitSettingsUpdate(restaurantId);

  res.status(200).json({
    success: true,
    message: `Restaurant is now ${settings.isOpen ? 'OPEN' : 'CLOSED'}`,
    data: { isOpen: settings.isOpen },
  });
});

// ─── Dashboard: Manage Delivery Areas ────────────────────────────────────────

exports.updateDeliveryAreas = catchAsync(async (req, res, next) => {
  const { areas } = req.body; // array of { name, isActive, extraCharge }

  const settings = await Settings.findOneAndUpdate(
    { restaurantId: req.restaurant._id },
    { $set: { deliveryAreas: areas } },
    { new: true, upsert: true }
  );

  emitSettingsUpdate(req.restaurant._id);

  res.status(200).json({
    success: true,
    message: 'Delivery areas updated',
    data: { deliveryAreas: settings.deliveryAreas },
  });
});

// ─── Dashboard: Update Promo Image ────────────────────────────────────────────

exports.updatePromoImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image uploaded', 400));
  }

  const restaurantId = req.restaurant._id;
  const settings = await Settings.findOne({ restaurantId });
  if (!settings) return next(new AppError('Settings not found', 404));

  if (settings.promoImageCloudinaryId) {
    await deleteImage(settings.promoImageCloudinaryId);
  }

  settings.promoImageUrl = req.file.path;
  settings.promoImageCloudinaryId = req.file.filename;
  await settings.save();

  emitSettingsUpdate(restaurantId);

  res.status(200).json({
    success: true,
    message: 'Promo popup image updated',
    data: { settings },
  });
});

// ─── Offers ───────────────────────────────────────────────────────────────────

exports.getPublicOffers = catchAsync(async (req, res, next) => {
  const restaurantId = req.params.restaurantId;

  const offers = await Offer.find({
    restaurantId,
    isActive: true,
    $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
  }).sort({ sortOrder: 1, createdAt: -1 });

  res.status(200).json({ success: true, data: { offers } });
});

exports.getOffers = catchAsync(async (req, res, next) => {
  const offers = await Offer.find({ restaurantId: req.restaurant._id })
    .sort({ sortOrder: 1, createdAt: -1 });

  res.status(200).json({ success: true, data: { offers } });
});

exports.createOffer = catchAsync(async (req, res, next) => {
  const offer = await Offer.create({ ...req.body, restaurantId: req.restaurant._id });
  res.status(201).json({ success: true, message: 'Offer created', data: { offer } });
});

exports.updateOffer = catchAsync(async (req, res, next) => {
  const offer = await Offer.findOneAndUpdate(
    { _id: req.params.id, restaurantId: req.restaurant._id },
    { $set: req.body },
    { new: true }
  );
  if (!offer) return next(new AppError('Offer not found', 404));
  res.status(200).json({ success: true, message: 'Offer updated', data: { offer } });
});

exports.deleteOffer = catchAsync(async (req, res, next) => {
  const offer = await Offer.findOneAndDelete({
    _id: req.params.id,
    restaurantId: req.restaurant._id,
  });
  if (!offer) return next(new AppError('Offer not found', 404));
  res.status(200).json({ success: true, message: 'Offer deleted' });
});

exports.validateCoupon = catchAsync(async (req, res, next) => {
  const { code, subtotal } = req.body;
  const restaurantId = req.params.restaurantId;

  const offer = await Offer.findOne({
    restaurantId,
    code: code.toUpperCase(),
    isActive: true,
    $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
  });

  if (!offer) return next(new AppError('Invalid or expired coupon code', 400));

  const orderSubtotal = parseFloat(subtotal);
  if (orderSubtotal < (offer.minOrderValue || 0)) {
    return next(new AppError(`Minimum order value ₹${offer.minOrderValue} required for this coupon`, 400));
  }

  let discount = 0;
  let freeDelivery = false;

  if (offer.discountType === 'percent') {
    discount = Math.round((orderSubtotal * offer.discountValue) / 100);
    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
  } else if (offer.discountType === 'flat') {
    discount = offer.discountValue;
  } else if (offer.discountType === 'free_delivery') {
    freeDelivery = true;
  }

  res.status(200).json({
    success: true,
    message: 'Coupon applied!',
    data: { offer, discount, freeDelivery },
  });
});
