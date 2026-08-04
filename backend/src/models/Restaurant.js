const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    ownerEmail: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true },
    address: { type: String, trim: true },
    logoUrl: { type: String },
    logoCloudinaryId: { type: String },
    tagline: { type: String },
    isActive: { type: Boolean, default: true },
    // Future multi-tenant: each restaurant is self-contained
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    // Shared secret the local KOT print agent presents (x-print-agent-key header)
    // to authenticate itself — it has no admin login of its own, so it can't use a JWT.
    printAgentKey: { type: String, select: false },
  },
  { timestamps: true }
);

restaurantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

restaurantSchema.pre('save', function (next) {
  if (!this.printAgentKey) {
    this.printAgentKey = crypto.randomBytes(24).toString('hex');
  }
  next();
});

restaurantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

restaurantSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
