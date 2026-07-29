require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Settings = require('../models/Settings');

/**
 * One-time setup script. Safe to re-run on every restart:
 *  - It NEVER deletes existing data (orders, menu, offers, riders, settings).
 *  - It only creates the Restaurant + Settings document the very first time.
 *  - It does NOT insert any demo menu items or offers — add your real menu
 *    from the Dashboard's "Menu" page and your own offers from "Settings".
 */
const init = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const ownerEmail = (process.env.OWNER_EMAIL || 'admin@dfcthagarapuvalasa.in').toLowerCase();

    // Already set up? Leave everything (orders, menu, offers, riders) exactly as it is.
    let restaurant = await Restaurant.findOne({ ownerEmail });

    if (restaurant) {
      console.log('ℹ️  Restaurant already exists — nothing was changed. Your data (orders, menu, offers, delivery boys) is intact.');
      console.log(`Restaurant ID: ${restaurant._id}`);
      console.log(`Login email: ${restaurant.ownerEmail}`);
      console.log('\nSet VITE_RESTAURANT_ID in both frontend .env files to:', restaurant._id.toString());
      process.exit(0);
    }

    // First run only — create the restaurant account.
    restaurant = await Restaurant.create({
      name: process.env.RESTAURANT_NAME || 'DFC Restaurant',
      slug: 'dfc-restaurant',
      ownerEmail,
      password: process.env.OWNER_PASSWORD || 'Admin@1234',
      phone: '+91 98765 43210',
      email: 'hello@dfcthagarapuvalasa.in',
      address: 'Tagarapuvalasa, Visakhapatnam, Andhra Pradesh 531162',
      tagline: 'Authentic flavours, delivered with love',
    });
    console.log(`✅ Restaurant created: ${restaurant.name} (${restaurant._id})`);

    // Required so the storefront has delivery-charge/min-order defaults — contains no menu data.
    await Settings.create({ restaurantId: restaurant._id });
    console.log('✅ Default settings created');

    console.log('\n🎉 Setup complete!');
    console.log(`Restaurant ID: ${restaurant._id}`);
    console.log(`Login email: ${restaurant.ownerEmail}`);
    console.log(`Login password: ${process.env.OWNER_PASSWORD || 'Admin@1234'}`);
    console.log('\nNo demo menu items or offers were created.');
    console.log('  → Add your real menu from Dashboard → Menu');
    console.log('  → Add offers/coupons from Dashboard → Settings → Offers');
    console.log('  → Add delivery boys from Dashboard → Delivery Boys');
    console.log('\nSet VITE_RESTAURANT_ID in both frontend .env files to:', restaurant._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('❌ Setup error:', err);
    process.exit(1);
  }
};

init();
