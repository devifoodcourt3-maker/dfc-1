const path = require('path');

// Resolve .env relative to this file, not process.cwd() — when running as a
// Windows Service the working directory isn't guaranteed to be this folder.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name} (see .env.example)`);
  return value;
};

const backendUrl = required('BACKEND_URL').replace(/\/$/, '');

module.exports = {
  backendUrl,
  socketUrl: (process.env.SOCKET_URL || backendUrl).replace(/\/$/, ''),
  restaurantId: required('RESTAURANT_ID'),
  printAgentKey: required('PRINT_AGENT_KEY'),

  restaurantName: process.env.RESTAURANT_NAME || 'Restaurant',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  printerInterface: required('PRINTER_INTERFACE'),
  printerType: process.env.PRINTER_TYPE || 'EPSON',
  printerCharWidth: parseInt(process.env.PRINTER_CHAR_WIDTH || '42', 10),

  printRetryAttempts: parseInt(process.env.PRINT_RETRY_ATTEMPTS || '3', 10),
  printRetryDelaysMs: (process.env.PRINT_RETRY_DELAYS_MS || '1000,3000,5000')
    .split(',')
    .map((n) => parseInt(n.trim(), 10)),

  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '60000', 10),
};
