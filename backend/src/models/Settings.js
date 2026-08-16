const mongoose = require('mongoose');

const deliveryAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    extraCharge: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const openingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    open: { type: String, default: '10:00' },
    close: { type: String, default: '22:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
    },
    deliveryCharge: { type: Number, default: 40 },
    freeDeliveryAbove: { type: Number, default: 0 }, // 0 = never free
    minOrderValue: { type: Number, default: 100 },
    isOpen: { type: Boolean, default: true },
    openingHours: {
      type: [openingHoursSchema],
      default: [
        { day: 'monday', open: '10:00', close: '22:00' },
        { day: 'tuesday', open: '10:00', close: '22:00' },
        { day: 'wednesday', open: '10:00', close: '22:00' },
        { day: 'thursday', open: '10:00', close: '22:00' },
        { day: 'friday', open: '10:00', close: '22:00' },
        { day: 'saturday', open: '10:00', close: '23:00' },
        { day: 'sunday', open: '10:00', close: '23:00' },
      ],
    },
    deliveryAreas: {
      type: [deliveryAreaSchema],
      default: [
        { name: 'Tagarapuvalasa', isActive: true },
        { name: 'Chittivalasa', isActive: true },
        { name: 'Sangivalasa', isActive: true },
        { name: 'Bheemunipatnam', isActive: true },
        { name: 'Anandapuram', isActive: true },
        { name: 'Junction Area', isActive: true },
      ],
    },
    socialLinks: {
      instagram: String,
      facebook: String,
      whatsapp: String,
    },
    taxPercent: { type: Number, default: 0 },
    estimatedDeliveryMins: { type: Number, default: 45 },
    promoImageUrl: { type: String },
    promoImageCloudinaryId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
