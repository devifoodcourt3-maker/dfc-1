/**
 * DFC Restaurant — Full Menu Seed Script
 * Run: node seed-menu.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MenuItem  = require('./src/models/MenuItem');
const Restaurant = require('./src/models/Restaurant');

// ── Category image URLs (Unsplash free-to-use food images) ──────────────────
const IMG = {
  vegBiryani:     'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  chickenBiryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
  muttonBiryani:  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
  eggBiryani:     'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&q=80',
  familyPack:     'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
  vegPizza:       'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
  chickenPizza:   'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  burger:         'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  sandwich:       'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  mocktail:       'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  milkshake:      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80',
  vegFriedRice:   'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  chickenFriedRice:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
  soup:           'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  noodles:        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  vegStarter:     '/starter-veg.png',
  chickenStarter: '/starter-chicken.png',
  seafood:        '/starter-seafood.png',
  friedStarter:   '/starter-fried.png',
  tandoori:       'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  rotiNaan:       'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  vegCurry:       'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  chickenCurry:   'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80',
  muttonCurry:    'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=600&q=80',
  seafoodCurry:   'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  dessert:        'https://images.unsplash.com/photo-1559181567-c3190bfbf405?w=600&q=80',
};

// ── Menu data ────────────────────────────────────────────────────────────────
const getMenuItems = (rid) => [

  // ══════════════════════════════════════════════════════
  //  BIRYANI
  // ══════════════════════════════════════════════════════

  // Veg Biryani
  { name: 'SPL Veg Biryani',            price: 220, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'Cashew Biryani',             price: 240, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'Paneer Mix Biryani',         price: 250, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'SPL Paneer Biryani',         price: 260, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'SPL Cashew Paneer Biryani',  price: 270, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'Mushroom Mix Biryani',       price: 250, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'SPL Mushroom Biryani',       price: 260, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },
  { name: 'DFC Mix Veg Biryani',        price: 250, category: 'Biryani', isVeg: true,  imageUrl: IMG.vegBiryani },

  // Chicken Biryani
  { name: 'Hyd SPL Chicken Dum Biryani',  price: 240, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani, isBestSeller: true },
  { name: 'Chicken Fry Piece Biryani',    price: 240, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Joint Biryani (2 pcs)',price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Ghee Roast Biryani',   price: 270, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Boneless Biryani',     price: 280, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Mughlai Biryani',      price: 280, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'DFC SPL Chicken Biryani',      price: 300, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani, isFeatured: true },
  { name: 'Chicken Lollipop Biryani (3 pcs)', price: 300, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Rajadhani SPL Biryani',        price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Butta Biryani',               price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Kalmi Biryani',        price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Tandoori Biryani',     price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Afghani Biryani',      price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Tikka Biryani',        price: 320, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Gongura Chicken Biryani',      price: 310, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani },

  // Mutton / Fish / Egg Biryani
  { name: 'Mutton Biryani (Bone)',      price: 370, category: 'Biryani', isVeg: false, imageUrl: IMG.muttonBiryani, isBestSeller: true },
  { name: 'Mutton Biryani (Boneless)', price: 390, category: 'Biryani', isVeg: false, imageUrl: IMG.muttonBiryani },
  { name: 'Mutton Gongura Biryani',    price: 380, category: 'Biryani', isVeg: false, imageUrl: IMG.muttonBiryani },
  { name: 'Mutton Mughalai Biryani',   price: 390, category: 'Biryani', isVeg: false, imageUrl: IMG.muttonBiryani },
  { name: 'Prawns Biryani',            price: 330, category: 'Biryani', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Fish Biryani',              price: 300, category: 'Biryani', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Egg Biryani',               price: 200, category: 'Biryani', isVeg: false, imageUrl: IMG.eggBiryani },
  { name: 'DFC Potlam Biryani',        price: 420, category: 'Biryani', isVeg: false, imageUrl: IMG.chickenBiryani, isFeatured: true },

  // Family Packs
  { name: 'Chicken Dum Family Pack (4 persons)',     price: 750, category: 'Family Pack', isVeg: false, imageUrl: IMG.familyPack, description: 'Includes: 2 Boiled Eggs, 1 Butter Naan, ½ Chicken Curry, ½ Chicken 65 & Biryani Rice.' },
  { name: 'Chicken Fry Family Pack (4 persons)',     price: 750, category: 'Family Pack', isVeg: false, imageUrl: IMG.familyPack, description: 'Includes: 2 Boiled Eggs, 1 Butter Naan, ½ Chicken Curry, ½ Chicken 65 & Biryani Rice.' },
  { name: 'Chicken Lollipop Family Pack (4 persons)',price: 800, category: 'Family Pack', isVeg: false, imageUrl: IMG.familyPack, description: 'Includes: 2 Boiled Eggs, 1 Butter Naan, ½ Chicken Curry, ½ Chicken 65 & Biryani Rice.' },
  { name: 'Chicken Tandoori Family Pack (4 persons)',price: 850, category: 'Family Pack', isVeg: false, imageUrl: IMG.familyPack, description: 'Includes: 2 Boiled Eggs, 1 Butter Naan, ½ Chicken Curry, ½ Chicken 65 & Biryani Rice.' },

  // Take Away
  { name: 'Chicken Double Pack Biryani (Dum)',  price: 460, category: 'Take Away', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Chicken Double Pack Biryani (Fry)',  price: 460, category: 'Take Away', isVeg: false, imageUrl: IMG.chickenBiryani },
  { name: 'Party Pack Biryani (6 Persons)',     price: 900, category: 'Take Away', isVeg: false, imageUrl: IMG.chickenBiryani },

  // ══════════════════════════════════════════════════════
  //  PIZZAS
  // ══════════════════════════════════════════════════════
  { name: 'Vintage Veg Pizza',             price: 190, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'Cheesy Weezy Pizza',            price: 190, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'Cheesy Corn Pizza',             price: 205, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'Paneer Pizza',                  price: 210, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'Mushroom Pizza',               price: 210, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'Veg Tandoori Pizza',           price: 220, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'DFC Mix Veg Pizza',            price: 240, category: 'Pizza', isVeg: true,  imageUrl: IMG.vegPizza },
  { name: 'Vintage Chicken Pizza',        price: 200, category: 'Pizza', isVeg: false, imageUrl: IMG.chickenPizza },
  { name: 'Chicken Popcorn Pizza',        price: 210, category: 'Pizza', isVeg: false, imageUrl: IMG.chickenPizza },
  { name: 'Chicken Relish Pizza',         price: 210, category: 'Pizza', isVeg: false, imageUrl: IMG.chickenPizza },
  { name: 'Chicken Corn Pizza',           price: 220, category: 'Pizza', isVeg: false, imageUrl: IMG.chickenPizza },
  { name: 'Chicken Tandoori Pizza',       price: 240, category: 'Pizza', isVeg: false, imageUrl: IMG.chickenPizza, isBestSeller: true },
  { name: 'American Cheesy Chicken Pizza',price: 260, category: 'Pizza', isVeg: false, imageUrl: IMG.chickenPizza },

  // ══════════════════════════════════════════════════════
  //  BURGERS
  // ══════════════════════════════════════════════════════
  { name: 'Royal Veg Burger',     price: 100, category: 'Burgers', isVeg: true,  imageUrl: IMG.burger },
  { name: 'Trendy Veg Burger',    price: 110, category: 'Burgers', isVeg: true,  imageUrl: IMG.burger },
  { name: 'Crispy Chicken Burger',price: 110, category: 'Burgers', isVeg: false, imageUrl: IMG.burger, isBestSeller: true },
  { name: 'Royal Chicken Burger', price: 120, category: 'Burgers', isVeg: false, imageUrl: IMG.burger },

  // ══════════════════════════════════════════════════════
  //  SANDWICHES
  // ══════════════════════════════════════════════════════
  { name: 'Veg Grill Sandwich',    price:  80, category: 'Sandwiches', isVeg: true,  imageUrl: IMG.sandwich },
  { name: 'Paneer Sandwich',       price: 110, category: 'Sandwiches', isVeg: true,  imageUrl: IMG.sandwich },
  { name: 'Veg Club Sandwich',     price: 130, category: 'Sandwiches', isVeg: true,  imageUrl: IMG.sandwich },
  { name: 'Chicken Grill Sandwich',price: 100, category: 'Sandwiches', isVeg: false, imageUrl: IMG.sandwich },
  { name: 'Chicken Club Sandwich', price: 140, category: 'Sandwiches', isVeg: false, imageUrl: IMG.sandwich },

  // ══════════════════════════════════════════════════════
  //  MOCKTAILS
  // ══════════════════════════════════════════════════════
  { name: 'Blue Curacao',    price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Water Melon',     price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Black Currant',   price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Green Apple',     price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Virgin Mojito',   price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail, isBestSeller: true },
  { name: 'Kiwi',            price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Litchi',          price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Cranberry',       price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },
  { name: 'Blueberry',       price: 80, category: 'Mocktails', isVeg: true, imageUrl: IMG.mocktail },

  // ══════════════════════════════════════════════════════
  //  MILKSHAKES
  // ══════════════════════════════════════════════════════
  { name: 'Belgium Brownie Milkshake', price: 100, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Pista Milkshake',           price: 100, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Vanilla Milkshake',         price: 100, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Strawberry Milkshake',      price: 100, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Oreo Milkshake',            price: 100, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake, isBestSeller: true },
  { name: 'Chocolate Milkshake',       price: 120, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Butterscotch Milkshake',    price: 100, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Black Currant Milkshake',   price: 110, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Kit-Kat Milkshake',         price: 120, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Dry Fruit Milkshake',       price: 140, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },
  { name: 'Rasmalai Dry Fruit Milkshake', price: 140, category: 'Milkshakes', isVeg: true, imageUrl: IMG.milkshake },

  // ══════════════════════════════════════════════════════
  //  FRIED RICE
  // ══════════════════════════════════════════════════════
  { name: 'Jeera Fried Rice',              price: 180, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Veg Fried Rice',               price: 180, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Sweet Corn Fried Rice',        price: 190, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Schezwan Fried Rice',          price: 190, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Paneer Fried Rice',            price: 210, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Mushroom Fried Rice',          price: 210, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Cashew Fried Rice',            price: 210, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Cashew Paneer Fried Rice',     price: 240, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'DFC SPL Mix Veg Fried Rice',   price: 260, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'SPL Curd Rice',               price: 120, category: 'Fried Rice', isVeg: true,  imageUrl: IMG.vegFriedRice },
  { name: 'Egg Fried Rice',              price: 180, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },
  { name: 'Chicken Fried Rice',          price: 210, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice, isBestSeller: true },
  { name: 'Chicken Schezwan Fried Rice', price: 230, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },
  { name: 'SPL Chicken Fried Rice',      price: 290, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },
  { name: 'Fish Fried Rice',             price: 250, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },
  { name: 'Prawns Fried Rice',           price: 260, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },
  { name: 'SPL Prawns Fried Rice',       price: 300, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },
  { name: 'DFC Mix Non-Veg Fried Rice',  price: 300, category: 'Fried Rice', isVeg: false, imageUrl: IMG.chickenFriedRice },

  // ══════════════════════════════════════════════════════
  //  SOUPS
  // ══════════════════════════════════════════════════════
  { name: 'Veg Sweet Corn Soup',     price: 120, category: 'Soups', isVeg: true,  imageUrl: IMG.soup },
  { name: 'Veg Hot & Sour Soup',     price: 120, category: 'Soups', isVeg: true,  imageUrl: IMG.soup },
  { name: 'Veg Manchow Soup',        price: 130, category: 'Soups', isVeg: true,  imageUrl: IMG.soup },
  { name: 'Chicken Hot & Sour Soup', price: 130, category: 'Soups', isVeg: false, imageUrl: IMG.soup },
  { name: 'Chicken Sweet Corn Soup', price: 130, category: 'Soups', isVeg: false, imageUrl: IMG.soup },
  { name: 'Chicken Manchow Soup',    price: 140, category: 'Soups', isVeg: false, imageUrl: IMG.soup },

  // ══════════════════════════════════════════════════════
  //  NOODLES
  // ══════════════════════════════════════════════════════
  { name: 'Veg Soft Noodles',          price: 110, category: 'Noodles', isVeg: true,  imageUrl: IMG.noodles },
  { name: 'Veg Schezwan Noodles',      price: 130, category: 'Noodles', isVeg: true,  imageUrl: IMG.noodles },
  { name: 'Paneer Noodles',            price: 150, category: 'Noodles', isVeg: true,  imageUrl: IMG.noodles },
  { name: 'Mushroom Noodles',          price: 150, category: 'Noodles', isVeg: true,  imageUrl: IMG.noodles },
  { name: 'Manchurian Noodles',        price: 160, category: 'Noodles', isVeg: true,  imageUrl: IMG.noodles },
  { name: 'Egg Soft Noodles',          price: 130, category: 'Noodles', isVeg: false, imageUrl: IMG.noodles },
  { name: 'Egg Schezwan Noodles',      price: 145, category: 'Noodles', isVeg: false, imageUrl: IMG.noodles },
  { name: 'Chicken Soft Noodles',      price: 160, category: 'Noodles', isVeg: false, imageUrl: IMG.noodles },
  { name: 'Chicken Schezwan Noodles',  price: 170, category: 'Noodles', isVeg: false, imageUrl: IMG.noodles, isBestSeller: true },
  { name: 'DFC SPL Chicken Noodles',   price: 220, category: 'Noodles', isVeg: false, imageUrl: IMG.noodles },

  // ══════════════════════════════════════════════════════
  //  CHINESE VEG STARTERS
  // ══════════════════════════════════════════════════════
  { name: 'Veg Manchurian',        price: 180, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Gobi Manchurian',       price: 180, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter, isBestSeller: true },
  { name: 'Chilli Gobi',          price: 180, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Paneer Manchurian',     price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Paneer Dry Roast',      price: 250, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Paneer 65',            price: 250, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Chilli Paneer',        price: 250, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Paneer Majestic',      price: 270, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Dragon Paneer',        price: 270, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Mushroom Manchurian',  price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Mushroom 65',          price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Chilli Mushroom',      price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Crispy Corn',          price: 220, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Baby Corn Manchurian', price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Baby Corn 65',         price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Chilli Baby Corn',     price: 230, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },
  { name: 'Baby Corn Majestic',   price: 250, category: 'Starters', isVeg: true, imageUrl: IMG.vegStarter },

  // ══════════════════════════════════════════════════════
  //  CHINESE NON-VEG STARTERS
  // ══════════════════════════════════════════════════════
  { name: 'Egg Pakoda',                 price: 185, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Egg Manchurian',            price: 180, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Egg 65',                    price: 180, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Egg Chilli',                price: 190, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Capsicum Chicken',          price: 240, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chicken Manchurian',        price: 230, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chilli Chicken',           price: 230, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter, isBestSeller: true },
  { name: 'Chicken 65',               price: 230, category: 'Starters', isVeg: false, imageUrl: '/chicken-65.png', isBestSeller: true, isFeatured: true },
  { name: 'Chicken Boneless Pakoda',   price: 250, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Schezwan Chicken',          price: 260, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Butter Garlic Chicken',     price: 270, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Dragon Chicken',           price: 280, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chicken Majestic',          price: 280, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chicken 555',              price: 280, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chicken Lollipop Wet',      price: 270, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chicken Lollipop Dry',      price: 250, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Chicken Tikka Chilli',      price: 260, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Ginger Chicken (Wet/Dry)',  price: 260, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Lemon Chicken',             price: 260, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },
  { name: 'Honey Chicken',             price: 260, category: 'Starters', isVeg: false, imageUrl: IMG.chickenStarter },

  // ══════════════════════════════════════════════════════
  //  SEAFOOD STARTERS
  // ══════════════════════════════════════════════════════
  { name: 'Prawns Manchurian',       price: 300, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Prawns 65',              price: 300, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Chilli Prawns',          price: 300, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Loose Prawns',           price: 310, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Butter Garlic Prawns',   price: 310, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Prawns Fry',             price: 270, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Fish Manchurian',        price: 280, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Apollo Fish',            price: 290, category: 'Starters', isVeg: false, imageUrl: IMG.seafood, isBestSeller: true },
  { name: 'Chilli Fish',            price: 290, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },
  { name: 'Ginger Fish',            price: 290, category: 'Starters', isVeg: false, imageUrl: IMG.seafood },

  // ══════════════════════════════════════════════════════
  //  FRIED STARTERS
  // ══════════════════════════════════════════════════════
  { name: 'French Fries (Salt)',                  price:  80, category: 'Starters', isVeg: true,  imageUrl: IMG.friedStarter },
  { name: 'French Fries (Masala)',                price:  90, category: 'Starters', isVeg: true,  imageUrl: IMG.friedStarter },
  { name: 'French Fries (Peri Peri)',             price: 100, category: 'Starters', isVeg: true,  imageUrl: IMG.friedStarter },
  { name: 'Crispy Baby Corn Strips',              price: 150, category: 'Starters', isVeg: true,  imageUrl: IMG.friedStarter },
  { name: 'Paneer Popcorn',                       price: 150, category: 'Starters', isVeg: true,  imageUrl: IMG.friedStarter },
  { name: 'Hot & Crispy Chicken Piece (2 pcs)',   price: 170, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'Fried Chicken Popcorn (Small)',        price: 150, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'Fried Chicken Popcorn (Large)',        price: 220, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'Fried Chicken Wings (6 pcs)',          price: 190, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'Fried Chicken Lollipops (6 pcs)',      price: 220, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'Fried Prawn Popcorn (13 pcs)',         price: 300, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'Fried Crispy Fish',                    price: 230, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter },
  { name: 'DFC Chicken & Fries Bucket',           price: 370, category: 'Starters', isVeg: false, imageUrl: IMG.friedStarter, isFeatured: true },

  // ══════════════════════════════════════════════════════
  //  TANDOORI KABABS
  // ══════════════════════════════════════════════════════
  { name: 'Paneer Tikka',                     price: 290, category: 'Tandoori', isVeg: true,  imageUrl: IMG.tandoori },
  { name: 'Chicken Tikka (8 pcs)',            price: 310, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori, isBestSeller: true },
  { name: 'Chicken Tandoori (Half)',          price: 260, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },
  { name: 'Chicken Tandoori (Full)',          price: 460, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },
  { name: 'Chicken Tangdi Kabab (2 pcs)',     price: 170, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },
  { name: 'Chicken Tangdi Kabab (4 pcs)',     price: 290, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },
  { name: 'Chicken Kalmi Kabab (2 pcs)',      price: 170, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },
  { name: 'Chicken Kalmi Kabab (4 pcs)',      price: 290, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },
  { name: 'Lasooni Fish Tikka',              price: 320, category: 'Tandoori', isVeg: false, imageUrl: IMG.tandoori },

  // ══════════════════════════════════════════════════════
  //  ROTI & NAAN
  // ══════════════════════════════════════════════════════
  { name: 'Roti',               price:  25, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Butter Roti',        price:  35, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Plain Naan',         price:  40, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Butter Naan',        price:  55, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Garlic Naan',        price:  65, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan, isBestSeller: true },
  { name: 'Lacha Parata',       price:  60, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Aloo Parata',        price:  85, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Paneer Parata',      price:  95, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Veg Kulcha',         price:  85, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Aloo Kulcha',        price:  75, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Paneer Kulcha',      price:  95, category: 'Roti&Naan', isVeg: true, imageUrl: IMG.rotiNaan },
  { name: 'Chicken Keema Naan', price: 140, category: 'Roti&Naan', isVeg: false,imageUrl: IMG.rotiNaan },

  // ══════════════════════════════════════════════════════
  //  VEG CURRIES
  // ══════════════════════════════════════════════════════
  { name: 'Aloo Gobi',                price: 200, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Mix Veg Curry',            price: 200, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Veg Sahi Kurma',           price: 210, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Kadai Veg',                price: 220, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Veg Kolhapuri',            price: 220, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Cashew Tomato',            price: 230, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Cashew Masala',            price: 230, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Paneer Curry',             price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Kadai Paneer',             price: 230, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry, isBestSeller: true },
  { name: 'Cashew Paneer',            price: 260, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Methi Paneer Masala',      price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Paneer Butter Masala',     price: 250, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry, isBestSeller: true },
  { name: 'Chef SPL Methi Chaman',    price: 260, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Paneer Sahi Kurma',        price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Paneer Chat Pot',          price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Mushroom Curry',           price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Mushroom Masala',          price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Butter Mushroom',          price: 250, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Mushroom Paneer',          price: 230, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Baby Corn Curry',          price: 230, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Baby Corn Masala',         price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },
  { name: 'Butter Baby Corn',         price: 240, category: 'Curries', isVeg: true, imageUrl: IMG.vegCurry },

  // ══════════════════════════════════════════════════════
  //  NON-VEG CURRIES
  // ══════════════════════════════════════════════════════
  { name: 'Egg Bhurji',                    price: 160, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Egg Curry',                     price: 180, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Cashew Chicken (Bone)',         price: 250, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Cashew Chicken (Boneless)',     price: 270, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Andhra Chicken (Bone)',         price: 250, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Andhra Chicken (Boneless)',     price: 270, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Hyderabad Chicken',            price: 250, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Methi Chicken',               price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Kadai Chicken',               price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry, isBestSeller: true },
  { name: 'DFC SPL Chicken',             price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry, isFeatured: true },
  { name: 'Chicken Kolhapuri',            price: 250, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Chicken Tikka Masala',         price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Afghani Chicken',             price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Butter Chicken',              price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry, isBestSeller: true, isFeatured: true },
  { name: 'Mughlai Chicken',             price: 260, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Chicken Sahi Kurma',          price: 280, category: 'Curries', isVeg: false, imageUrl: IMG.chickenCurry },
  { name: 'Mutton Curry (Bone)',         price: 320, category: 'Curries', isVeg: false, imageUrl: IMG.muttonCurry },
  { name: 'Mutton Curry (Boneless)',     price: 350, category: 'Curries', isVeg: false, imageUrl: IMG.muttonCurry },
  { name: 'Prawns Curry',               price: 300, category: 'Curries', isVeg: false, imageUrl: IMG.seafoodCurry },
  { name: 'Prawns Fry Curry',           price: 300, category: 'Curries', isVeg: false, imageUrl: IMG.seafoodCurry },
  { name: 'Fish Curry',                 price: 280, category: 'Curries', isVeg: false, imageUrl: IMG.seafoodCurry },
  { name: 'Fish Masala',               price: 280, category: 'Curries', isVeg: false, imageUrl: IMG.seafoodCurry },
  { name: 'Fish Fry',                  price: 280, category: 'Curries', isVeg: false, imageUrl: IMG.seafoodCurry },

  // ══════════════════════════════════════════════════════
  //  DESSERTS & BEVERAGES
  // ══════════════════════════════════════════════════════
  { name: 'Rasmalai',                 price:  40, category: 'Desserts', isVeg: true,  imageUrl: IMG.dessert },
  { name: 'DFC SPL Delight',          price: 100, category: 'Desserts', isVeg: true,  imageUrl: IMG.dessert },
  { name: 'Pastry',                   price:  65, category: 'Desserts', isVeg: true,  imageUrl: IMG.dessert, description: '₹60 / ₹70' },
  { name: 'Badam Milk',               price:  40, category: 'Desserts', isVeg: true,  imageUrl: IMG.dessert },
  { name: 'Mayonnaise Sauce (1 Dip)', price:  10, category: 'Desserts', isVeg: true,  imageUrl: IMG.dessert },
  { name: 'Boiled Egg',               price:  15, category: 'Desserts', isVeg: false, imageUrl: IMG.dessert },
  { name: 'Soft Drinks (250 ml)',     price:  20, category: 'Desserts', isVeg: true,  imageUrl: IMG.mocktail },
  { name: 'Soft Drinks (1 L)',        price:  50, category: 'Desserts', isVeg: true,  imageUrl: IMG.mocktail },
  { name: 'Water Bottle (1 L)',       price:  20, category: 'Desserts', isVeg: true,  imageUrl: IMG.dessert, description: '₹20 / ₹25' },

].map(item => ({ ...item, restaurantId: rid, isAvailable: true, spiceLevel: item.isVeg ? 'mild' : 'medium' }));

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const restaurant = await Restaurant.findOne({ ownerEmail: process.env.OWNER_EMAIL });
  if (!restaurant) { console.error('❌ Restaurant not found'); process.exit(1); }
  console.log(`🍴 Restaurant: ${restaurant.name} (${restaurant._id})`);

  // Clear all existing menu items
  const del = await MenuItem.deleteMany({ restaurantId: restaurant._id });
  console.log(`🗑️  Deleted ${del.deletedCount} existing menu items`);

  // Insert new items
  const items = getMenuItems(restaurant._id);
  await MenuItem.insertMany(items);
  console.log(`✅ Inserted ${items.length} menu items across categories:`);

  // Summary
  const cats = [...new Set(items.map(i => i.category))];
  for (const cat of cats) {
    console.log(`   • ${cat}: ${items.filter(i => i.category === cat).length} items`);
  }

  await mongoose.disconnect();
  console.log('🎉 Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
