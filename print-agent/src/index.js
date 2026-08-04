const config = require('./config');
const { connectSocket } = require('./socketClient');
const { fetchPendingJobs, reportPrintResult } = require('./apiClient');
const { printKOT } = require('./printerClient');

// Guards against printing the same order twice if it arrives via both the
// live socket push and the catch-up poll at nearly the same moment.
const inFlight = new Set();

async function handleJob(order) {
  const id = order._id;
  if (inFlight.has(id)) return;
  inFlight.add(id);

  console.log(`[print] Printing KOT for ${order.orderId}...`);
  try {
    await printKOT(order);
    console.log(`[print] KOT printed for ${order.orderId}`);
    await reportPrintResult(id, true);
  } catch (err) {
    console.error(`[print] KOT failed for ${order.orderId} after all retries: ${err.message}`);
    try {
      await reportPrintResult(id, false, err.message);
    } catch (reportErr) {
      console.error(`[print] Also failed to report the failure to the backend: ${reportErr.message}`);
    }
  } finally {
    inFlight.delete(id);
  }
}

async function pollPendingJobs() {
  try {
    const orders = await fetchPendingJobs();
    orders.forEach(handleJob);
  } catch (err) {
    console.error(`[poll] Failed to fetch pending print jobs: ${err.message}`);
  }
}

console.log(`DFC KOT Print Agent starting for restaurant ${config.restaurantId}`);

connectSocket(
  (order) => handleJob(order),
  () => pollPendingJobs() // catch up on anything confirmed while we were offline
);

pollPendingJobs(); // initial catch-up on startup
setInterval(pollPendingJobs, config.pollIntervalMs); // safety net beyond the socket push

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
