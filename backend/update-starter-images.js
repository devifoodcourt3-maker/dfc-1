/**
 * Migration: Update starter image URLs with the new locally-hosted images.
 * Run: node update-starter-images.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

// Map each starter sub-type to the new image
const UPDATES = [
  // Veg Chinese starters
  {
    filter: {
      category: 'Starters',
      isVeg: true,
      name: { $in: [
        'Veg Manchurian', 'Gobi Manchurian', 'Chilli Gobi',
        'Paneer Manchurian', 'Paneer Dry Roast', 'Paneer 65', 'Chilli Paneer',
        'Paneer Majestic', 'Dragon Paneer',
        'Mushroom Manchurian', 'Mushroom 65', 'Chilli Mushroom',
        'Crispy Corn', 'Baby Corn Manchurian', 'Baby Corn 65',
        'Chilli Baby Corn', 'Baby Corn Majestic',
      ]},
    },
    imageUrl: '/starter-veg.png',
    label: 'Veg Chinese starters',
  },
  // Fried veg starters
  {
    filter: {
      category: 'Starters',
      isVeg: true,
      name: { $in: [
        'French Fries (Salt)', 'French Fries (Masala)', 'French Fries (Peri Peri)',
        'Crispy Baby Corn Strips', 'Paneer Popcorn',
      ]},
    },
    imageUrl: '/starter-fried.png',
    label: 'Fried veg starters',
  },
  // Chicken starters
  {
    filter: {
      category: 'Starters',
      isVeg: false,
      name: { $in: [
        'Egg Pakoda', 'Egg Manchurian', 'Egg 65', 'Egg Chilli',
        'Capsicum Chicken', 'Chicken Manchurian', 'Chilli Chicken',
        'Chicken Boneless Pakoda', 'Schezwan Chicken', 'Butter Garlic Chicken',
        'Dragon Chicken', 'Chicken Majestic', 'Chicken 555',
        'Chicken Lollipop Wet', 'Chicken Lollipop Dry',
        'Chicken Tikka Chilli', 'Ginger Chicken (Wet/Dry)',
        'Lemon Chicken', 'Honey Chicken',
      ]},
    },
    imageUrl: '/starter-chicken.png',
    label: 'Chicken starters',
  },
  // Chicken 65 special
  {
    filter: { category: 'Starters', name: 'Chicken 65' },
    imageUrl: '/chicken-65.png',
    label: 'Chicken 65 (special)',
  },
  // Fried chicken starters
  {
    filter: {
      category: 'Starters',
      isVeg: false,
      name: { $in: [
        'Hot & Crispy Chicken Piece (2 pcs)', 'Fried Chicken Popcorn (Small)',
        'Fried Chicken Popcorn (Large)', 'Fried Chicken Wings (6 pcs)',
        'Fried Chicken Lollipops (6 pcs)', 'Fried Prawn Popcorn (13 pcs)',
        'Fried Crispy Fish', 'DFC Chicken & Fries Bucket',
      ]},
    },
    imageUrl: '/starter-fried.png',
    label: 'Fried non-veg starters',
  },
  // Seafood starters
  {
    filter: {
      category: 'Starters',
      isVeg: false,
      name: { $in: [
        'Prawns Manchurian', 'Prawns 65', 'Chilli Prawns', 'Loose Prawns',
        'Butter Garlic Prawns', 'Prawns Fry',
        'Fish Manchurian', 'Apollo Fish', 'Chilli Fish', 'Ginger Fish',
      ]},
    },
    imageUrl: '/starter-seafood.png',
    label: 'Seafood starters',
  },
];

const run = async () => {
  await connectDB();

  for (const { filter, imageUrl, label } of UPDATES) {
    const result = await MenuItem.updateMany(filter, { $set: { imageUrl } });
    console.log(`  ✔  ${label}: updated ${result.modifiedCount} items → ${imageUrl}`);
  }

  console.log('\n🎉 All starter images updated!');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
