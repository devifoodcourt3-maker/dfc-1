const { io } = require('socket.io-client');
const config = require('./config');

/**
 * Connects to the backend's realtime channel and joins this restaurant's
 * printer room. onPrintKOT fires for each live job; onCaughtUp fires after
 * every successful (re)join so the caller can poll for anything missed while
 * disconnected.
 */
function connectSocket(onPrintKOT, onCaughtUp) {
  const socket = io(config.socketUrl, {
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
  });

  const joinPrinterRoom = () => {
    socket.emit(
      'join-printer',
      { restaurantId: config.restaurantId, printAgentKey: config.printAgentKey },
      (ack) => {
        if (!ack?.success) {
          console.error(`[socket] Failed to join printer room: ${ack?.message || 'unknown error'}`);
          return;
        }
        console.log('[socket] Connected — listening for confirmed orders');
        onCaughtUp();
      }
    );
  };

  socket.on('connect', joinPrinterRoom);
  socket.on('print-kot', onPrintKOT);
  socket.on('disconnect', (reason) => console.warn(`[socket] Disconnected: ${reason}`));
  socket.on('connect_error', (err) => console.error(`[socket] Connection error: ${err.message}`));

  return socket;
}

module.exports = { connectSocket };
