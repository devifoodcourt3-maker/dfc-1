# DFC Restaurant Platform

A complete, production-ready restaurant ordering platform with a customer website, restaurant dashboard, delivery rider app, and real-time backend.

---

## Project Structure

```
dfc-restaurant/
├── backend/               # Node.js + Express + Socket.IO (deploy on Render)
├── customer-website/      # React + Vite + Tailwind (deploy on Cloudflare Pages)
├── dashboard/             # React + Vite + Tailwind — restaurant admin (deploy on Cloudflare Pages)
└── rider/                 # React + Vite + Tailwind — mobile-first delivery boy app (deploy on Cloudflare Pages)
```

---

## Order & Delivery Flow


```
pending → confirmed → preparing → ready → out_for_delivery → delivered
                                     ↑              ↑
                              admin assigns    rider taps
                              a delivery boy   "Start Delivery",
                              (Dashboard)      then "Finish Order"
                                               (Rider App)
```

- **Admin (Dashboard)** moves orders through `pending → confirmed → preparing → ready`, manages the
  delivery boy roster (add / activate-deactivate / remove) on the **Delivery Boys** page, and assigns
  a `ready` order to one of them.
- **Delivery Boy (Rider App)** only sees orders assigned to them. They tap **Start Delivery** (pickup)
  and, once the customer has the order, **Finish Order** to mark it `delivered`. They cannot see the
  menu, reports, or other restaurant settings — login is restricted to their own assigned orders.

---

## Map Pinning (free — OpenStreetMap, no API key)

All three frontends use **Leaflet + OpenStreetMap** for maps and the free **Nominatim** service for
address search/lookup. No Google Maps API key, no billing account, no usage quota to manage.

- **Customer Website (Checkout)** — a "Pin exact location on map" button opens a map the customer can
  tap, drag, search an address on, or use "locate me" (GPS) to drop a precise pin. The coordinates are
  saved on the order alongside the typed address.
- **Dashboard (Admin)** — if an order has a pinned location, a "View pinned location on map" link
  appears under the customer's address, opening a read-only map with an "Open in Maps" button for
  turn-by-turn directions.
- **Rider App (Delivery Boy)** — each assigned order has a collapsible "Show map · follow address"
  panel showing the destination pin and the rider's own live GPS position (refreshed while the map is
  open) with a line connecting them. The **Navigate** button deep-links to Google Maps directions using
  the precise coordinates when available (falling back to the typed address for older orders).

> Orders placed before this feature, or where the customer skips the map, simply have no
> `customer.location` — everything still works using the typed address as before.

---

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas URI, Cloudinary credentials, JWT secret

# Seed the database (creates the restaurant account ONCE — see note below)
npm run seed
# → Copy the Restaurant ID printed at the end

npm run dev
# → API running at http://localhost:5000
```

> **About `npm run seed`:** it only creates your restaurant login the *first* time it runs.
> On every later run (e.g. after restarting the server) it detects the existing restaurant
> and does nothing — it never deletes orders, menu items, offers, or delivery boys. Your order
> history and everything else persists across restarts as long as `MONGODB_URI` points to the
> same database. It also does **not** insert any demo menu items or offers — your menu starts
> empty; add real items from **Dashboard → Menu** and any coupons from **Dashboard → Settings**.

### 2. Customer Website Setup

```bash
cd customer-website
npm install

cp .env.example .env
# Set VITE_RESTAURANT_ID to the ID from seed output

npm run dev
# → http://localhost:5173
```

### 3. Dashboard Setup

```bash
cd dashboard
npm install

cp .env.example .env
# Set VITE_RESTAURANT_ID to the ID from seed output

npm run dev
# → http://localhost:5174
```

From the Dashboard, go to **Delivery Boys** in the sidebar to add your first rider (name, phone,
email, password). That email/password is what they'll use to log into the Rider App below.

### 4. Rider App Setup

```bash
cd rider
npm install

cp .env.example .env
# VITE_API_URL / VITE_SOCKET_URL default to localhost:5000 — no restaurant ID needed,
# the rider's login token already scopes them to their restaurant.

npm run dev
# → http://localhost:5175
```

Open this on a phone (or shrink your browser window) — it's built mobile-first with a bottom
tab bar for **Active orders / History / Profile**.

---

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens (use a long random string) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs |
| `PORT` | Server port (default: 5000) |

### Frontend `.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Backend Socket.IO URL |
| `VITE_RESTAURANT_ID` | Restaurant MongoDB ObjectId from seed |

---

## Production Deployment

### Backend → Render.com

1. Push backend folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node src/app.js`
5. Add all environment variables in Render dashboard
6. Deploy — Render gives you a URL like `https://dfc-api.onrender.com`

### Customer Website → Cloudflare Pages

1. Push customer-website to GitHub
2. Create a new project on Cloudflare Pages
3. Set **Build Command**: `npm run build`
4. Set **Build Output**: `dist`
5. Set environment variables (VITE_API_URL = your Render URL)
6. Deploy

### Dashboard → Cloudflare Pages

Same steps as customer website, using the dashboard folder.

---

## API Reference

### Public Endpoints (no auth)

| Method | Route | Description |
|---|---|---|
| GET | `/api/restaurants/:id/menu` | Get menu items |
| POST | `/api/restaurants/:id/orders` | Place an order (`customer.location: {lat,lng}` optional — set by the map picker) |
| GET | `/api/orders/track?orderId=&phone=` | Track order |
| GET | `/api/restaurants/:id/offers` | Get active offers |
| GET | `/api/restaurants/:id/settings` | Get restaurant info |
| POST | `/api/restaurants/:id/coupons/validate` | Validate coupon |

### Dashboard Endpoints (Bearer JWT required)

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard/orders` | Get all orders |
| PATCH | `/api/dashboard/orders/:id/status` | Update order status |
| PATCH | `/api/dashboard/orders/:id/acknowledge` | Silence notification |
| PATCH | `/api/dashboard/orders/:id/assign` | Assign a `ready` order to a delivery boy (`{ riderId }`) |
| PATCH | `/api/dashboard/orders/:id/unassign` | Remove the rider from an order |
| GET | `/api/dashboard/menu` | Get all menu items |
| POST | `/api/dashboard/menu` | Add menu item |
| PUT | `/api/dashboard/menu/:id` | Update item |
| DELETE | `/api/dashboard/menu/:id` | Delete item |
| GET | `/api/dashboard/reports/summary` | Reports |
| GET | `/api/dashboard/settings` | Get settings |
| PUT | `/api/dashboard/settings` | Update settings |
| GET | `/api/dashboard/riders` | List delivery boys (with active order count) |
| POST | `/api/dashboard/riders` | Add a delivery boy (`{ name, phone, email, password, vehicleNumber }`) |
| PATCH | `/api/dashboard/riders/:id/toggle` | Activate / deactivate a delivery boy |
| DELETE | `/api/dashboard/riders/:id` | Remove a delivery boy (unassigns their active orders) |

### Rider App Endpoints (Bearer JWT required — rider token)

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/rider/login` | Delivery boy login (`{ email, password }`) |
| GET | `/api/auth/rider/me` | Get logged-in rider's profile |
| GET | `/api/rider/orders?view=active\|history` | Orders assigned to this rider |
| PATCH | `/api/rider/orders/:id/start` | Mark a `ready` order as `out_for_delivery` (picked up) |
| PATCH | `/api/rider/orders/:id/finish` | Mark order `delivered` ("Finish Order" button) |

---

## Socket.IO Events

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `new-order` | `order` | New order placed — triggers alert loop |
| `order-status-update` | `{orderId, status, order}` | Status changed — sent to dashboard, customer tracking room, and the assigned rider's room |
| `order-acknowledged` | `{orderId}` | Alert silenced |
| `order-assigned` | `order` | A new order was assigned to this rider (Rider App alert) |
| `status-update` | `{orderId, status}` | Customer tracking update |

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join-restaurant` | `restaurantId` | Dashboard joins restaurant room |
| `join-rider` | `riderId` | Rider App joins its personal room for live assignments |
| `track-order` | `orderId` | Customer joins order tracking room |

---

## Default Login (after seed)

| Field | Value |
|---|---|
| Email | `admin@dfcrestaurant.com` |
| Password | `Admin@1234` |

**Change this immediately in production.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Customer UI | React 18, Vite, Tailwind CSS, Framer Motion, Zustand |
| Dashboard UI | React 18, Vite, Tailwind CSS, Recharts, Zustand |
| Rider App UI | React 18, Vite, Tailwind CSS (mobile-first), Framer Motion, Zustand |
| Maps | Leaflet + OpenStreetMap tiles, Nominatim geocoding (all free, no API key) |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB Atlas |
| Images | Cloudinary (auto WebP conversion) |
| Auth | JWT + bcrypt (separate restaurant-admin and delivery-rider tokens) |
| Hosting | Cloudflare Pages (frontends) + Render (backend) |

---

## Future Multi-Restaurant Support

The database schema is already multi-tenant ready:
- Every document has a `restaurantId` field
- All queries are scoped by `restaurantId`
- Adding a new restaurant = create a new `Restaurant` document + seed settings
- To enable multi-restaurant SaaS: add a restaurant selector in auth, route all queries by JWT restaurant ID

---

## Notification System

When a new order arrives on the dashboard:
1. **Sound** — Web Audio API alert plays every 4 seconds
2. **Tab title** — Flashes between "🔔 NEW ORDER!" and "DFC Dashboard"
3. **Browser notification** — Popup appears (if permission granted)
4. **Badge** — Red pulsing count on the Orders nav item
5. **Card highlight** — Order card glows with orange ring

The alert loop stops **only** when staff clicks **Confirm Order** or **Cancel Order**.
This ensures no order is missed even when the dashboard is in a background tab.
