const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    isVeg: { type: Boolean },
    // Per-item kitchen note, e.g. "no onions" — shown on the KOT under the item line
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const KOT_PRINT_STATUSES = ['not_required', 'pending', 'printing', 'printed', 'failed'];

// Tracks the automatic kitchen-ticket print triggered when an order is confirmed.
// A separate sub-document (rather than top-level fields) keeps all print bookkeeping
// grouped, and lets the print agent / dashboard reason about it as one unit.
const kotPrintSchema = new mongoose.Schema(
  {
    status: { type: String, enum: KOT_PRINT_STATUSES, default: 'not_required' },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: '' },
    requestedAt: { type: Date },
    printedAt: { type: Date },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      area: { type: String, trim: true, default: '' },
      landmark: { type: String, trim: true, default: '' },
      notes: { type: String, trim: true, default: '' },
      // Optional pinned map location (free OpenStreetMap/Leaflet picker on the customer site)
      location: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
      },
    },
    items: { type: [orderItemSchema], required: true },
    orderType: { type: String, enum: ['delivery', 'takeaway'], default: 'delivery' },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, uppercase: true },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
    // Kitchen order ticket — auto-printed on confirm, see printController + config/socket
    kot: { type: kotPrintSchema, default: () => ({}) },
    // Notification state: alert loops until acknowledged
    isAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    // Delivery rider assignment
    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryBoy',
      default: null,
      index: true,
    },
    riderName: { type: String, default: '' },
    assignedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, 'kot.status': 1 });
orderSchema.index({ assignedRider: 1, status: 1 });

// Pre-save: push status change to history
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.KOT_PRINT_STATUSES = KOT_PRINT_STATUSES;
