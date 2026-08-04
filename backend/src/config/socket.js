const { Server } = require('socket.io');
const Restaurant = require('../models/Restaurant');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Dashboard joins restaurant room
    socket.on('join-restaurant', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`Dashboard joined room: restaurant:${restaurantId}`);
    });

    // Delivery rider joins their personal room
    socket.on('join-rider', (riderId) => {
      socket.join(`rider:${riderId}`);
      console.log(`Rider joined room: rider:${riderId}`);
    });

    // Local KOT print agent joins its restaurant's printer room. Authenticated
    // with the same per-restaurant key used for the REST fallback (protectPrintAgent)
    // so a stray socket client can't eavesdrop on another restaurant's orders.
    socket.on('join-printer', async ({ restaurantId, printAgentKey } = {}, ack) => {
      try {
        const restaurant = await Restaurant.findOne({
          _id: restaurantId,
          printAgentKey,
        }).select('+printAgentKey');

        if (!restaurant) {
          console.warn(`Print agent auth failed for restaurant ${restaurantId}`);
          if (typeof ack === 'function') ack({ success: false, message: 'Invalid restaurantId or print agent key' });
          return;
        }

        socket.join(`printer:${restaurantId}`);
        console.log(`Print agent joined room: printer:${restaurantId}`);
        if (typeof ack === 'function') ack({ success: true });
      } catch (err) {
        if (typeof ack === 'function') ack({ success: false, message: 'Server error during print agent auth' });
      }
    });

    // Customer joins order tracking room
    socket.on('track-order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Customer tracking order: ${orderId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

/**
 * Emit new order to all dashboard clients for the restaurant
 */
const emitNewOrder = (restaurantId, order) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit('new-order', order);
};

/**
 * Emit order status update to dashboard and customer tracking
 */
const emitOrderStatusUpdate = (restaurantId, orderId, status, order) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit('order-status-update', { orderId, status, order });
  // Include the full order (rider name/phone/vehicle etc.) so a customer's open
  // tracking page can show delivery partner details the moment they're assigned,
  // without needing to re-search.
  io.to(`order:${orderId}`).emit('status-update', { orderId, status, order });

  // assignedRider may be a raw ObjectId or a populated rider object depending
  // on the caller — normalize to a plain id string for room targeting.
  const riderRoomId = order?.assignedRider && typeof order.assignedRider === 'object'
    ? order.assignedRider._id
    : order?.assignedRider;
  if (riderRoomId) {
    io.to(`rider:${riderRoomId}`).emit('order-status-update', { orderId, status, order });
  }
};

/**
 * Emit notification acknowledged (alert silenced)
 */
const emitOrderAcknowledged = (restaurantId, orderId) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit('order-acknowledged', { orderId });
};

/**
 * Emit a new order assignment to a specific rider
 */
const emitOrderAssigned = (riderId, order) => {
  if (!io) return;
  io.to(`rider:${riderId}`).emit('order-assigned', order);
};

/**
 * Emit settings update to all connected clients for the restaurant
 */
const emitSettingsUpdate = (restaurantId) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit('settings-updated', { restaurantId });
};

/**
 * Emit rider availability status change to the restaurant dashboard.
 * status: 'available' | 'on_delivery' | 'offline'
 * activeOrder: { orderId, assignedAt } or null
 */
const emitRiderStatusUpdate = (restaurantId, riderId, status, activeOrder = null) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit('rider-status-update', { riderId, status, activeOrder });
};

/**
 * Push a KOT print job to the local print agent(s) listening for this restaurant.
 * Sent to a dedicated `printer:*` room (separate from the dashboard's `restaurant:*`
 * room) so print agents only ever receive print jobs, never unrelated dashboard events.
 */
const emitPrintKOT = (restaurantId, order) => {
  if (!io) return;
  io.to(`printer:${restaurantId}`).emit('print-kot', order);
};

/**
 * Notify dashboard clients of a KOT print status change (printing/printed/failed)
 * so the OrderCard can show a live indicator and, on failure, a Retry Print button.
 */
const emitPrintStatusUpdate = (restaurantId, orderId, kot) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit('kot-print-status', { orderId, kot });
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = {
  initSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitOrderAcknowledged,
  emitOrderAssigned,
  emitSettingsUpdate,
  emitRiderStatusUpdate,
  emitPrintKOT,
  emitPrintStatusUpdate,
  getIO,
};
