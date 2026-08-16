const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const menuController = require('../controllers/menuController');
const reportController = require('../controllers/reportController');
const settingsController = require('../controllers/settingsController');
const riderController = require('../controllers/riderController');
const printController = require('../controllers/printController');
const { protect, protectRider, protectPrintAgent } = require('../middleware/authMiddleware');
const {
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
  reportPrintResultValidation,
} = require('../middleware/validate');
const { upload } = require('../config/cloudinary');

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', loginValidation, authController.login);
router.get('/auth/me', protect, authController.getMe);
router.get('/auth/verify', protect, authController.verifyToken);

// ── Auth: Delivery Rider ───────────────────────────────────────────────────────
router.post('/auth/rider/login', riderLoginValidation, authController.riderLogin);
router.get('/auth/rider/me', protectRider, authController.getRiderMe);

// ── Public: Menu ─────────────────────────────────────────────────────────────
router.get('/restaurants/:restaurantId/menu', menuController.getMenu);
router.get('/restaurants/:restaurantId/menu/categories', menuController.getCategories);

// ── Public: Orders ────────────────────────────────────────────────────────────
router.post('/restaurants/:restaurantId/orders', placeOrderValidation, orderController.placeOrder);
router.get('/orders/track', trackOrderValidation, orderController.trackOrder);
router.get('/orders/history', orderHistoryValidation, orderController.getOrderHistory);

// ── Public: Settings & Offers ─────────────────────────────────────────────────
router.get('/restaurants/:restaurantId/settings', settingsController.getPublicSettings);
router.get('/restaurants/:restaurantId/offers', settingsController.getPublicOffers);
router.post('/restaurants/:restaurantId/coupons/validate', applyCouponValidation, settingsController.validateCoupon);

// ── Dashboard: Orders ─────────────────────────────────────────────────────────
router.get('/dashboard/orders', protect, orderController.getOrders);
router.delete('/dashboard/orders/clear', protect, orderController.clearOrders);
router.get('/dashboard/orders/unacknowledged', protect, orderController.getUnacknowledgedCount);
router.get('/dashboard/orders/:id', protect, orderController.getOrder);
router.patch('/dashboard/orders/:id/status', protect, updateStatusValidation, orderController.updateOrderStatus);
router.patch('/dashboard/orders/:id/acknowledge', protect, orderController.acknowledgeOrder);
router.patch('/dashboard/orders/:id/assign', protect, assignOrderValidation, riderController.assignOrder);
router.patch('/dashboard/orders/:id/unassign', protect, riderController.unassignOrder);

// ── Dashboard: Menu ────────────────────────────────────────────────────────────
router.get('/dashboard/menu', protect, menuController.getAllItems);
router.post('/dashboard/menu', protect, upload.single('image'), menuItemValidation, menuController.addItem);
router.put('/dashboard/menu/:id', protect, upload.single('image'), menuController.updateItem);
router.patch('/dashboard/menu/:id/toggle', protect, menuController.toggleAvailability);
router.delete('/dashboard/menu/:id', protect, menuController.deleteItem);

// ── Dashboard: Reports ─────────────────────────────────────────────────────────
router.get('/dashboard/reports/summary', protect, reportController.getSummary);
router.get('/dashboard/reports/revenue-chart', protect, reportController.getRevenueChart);

// ── Dashboard: Settings ────────────────────────────────────────────────────────
router.get('/dashboard/settings', protect, settingsController.getSettings);
router.put('/dashboard/settings', protect, settingsValidation, settingsController.updateSettings);
router.patch('/dashboard/settings/toggle-open', protect, settingsController.toggleOpen);
router.put('/dashboard/restaurant', protect, upload.single('logo'), settingsController.updateRestaurant);
router.put('/dashboard/settings/delivery-areas', protect, settingsController.updateDeliveryAreas);
router.put('/dashboard/settings/promo-image', protect, upload.single('promoImage'), settingsController.updatePromoImage);

// ── Dashboard: Offers ──────────────────────────────────────────────────────────
router.get('/dashboard/offers', protect, settingsController.getOffers);
router.post('/dashboard/offers', protect, settingsController.createOffer);
router.put('/dashboard/offers/:id', protect, settingsController.updateOffer);
router.delete('/dashboard/offers/:id', protect, settingsController.deleteOffer);

// ── Dashboard: KOT Printing ────────────────────────────────────────────────────
router.get('/dashboard/print/agent-key', protect, printController.getPrintAgentKey);
router.post('/dashboard/print/agent-key/regenerate', protect, printController.regeneratePrintAgentKey);
router.post('/dashboard/orders/:id/print/retry', protect, printController.retryPrint);

// ── Print Agent: local KOT bridge (authenticated via x-print-agent-key) ───────
router.get('/print-agent/jobs', protectPrintAgent, printController.getPendingPrintJobs);
router.post('/print-agent/jobs/:orderId/result', protectPrintAgent, reportPrintResultValidation, printController.reportPrintResult);

// ── Dashboard: Delivery Boys (admin only: add / remove / list) ────────────────
router.get('/dashboard/riders', protect, riderController.getRiders);
router.post('/dashboard/riders', protect, addRiderValidation, riderController.addRider);
router.patch('/dashboard/riders/:id/toggle', protect, riderController.toggleRiderActive);
router.delete('/dashboard/riders/:id', protect, riderController.removeRider);

// ── Rider App: My Orders ───────────────────────────────────────────────────────
router.get('/rider/orders', protectRider, orderController.getMyOrders);
router.patch('/rider/orders/:id/start', protectRider, orderController.startDelivery);
router.patch('/rider/orders/:id/finish', protectRider, orderController.finishOrder);

module.exports = router;
