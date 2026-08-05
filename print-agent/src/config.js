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

// Display name for logging — strips the `printer:` prefix so a Windows
// printer configured as `printer:bill` logs simply as "bill".
const displayName = (iface) => iface.replace(/^printer:/i, '');

/**
 * Reads PRINTER_1_INTERFACE, PRINTER_2_INTERFACE, ... (each with optional
 * PRINTER_n_NAME/PRINTER_n_TYPE/PRINTER_n_CHAR_WIDTH overrides) so any number
 * of printers can be configured. Falls back to the original single-printer
 * PRINTER_INTERFACE/PRINTER_TYPE/PRINTER_CHAR_WIDTH vars when no PRINTER_n_*
 * vars are set, so existing single-printer .env files keep working unchanged.
 */
const parsePrinters = () => {
  const printers = [];
  let i = 1;
  while (process.env[`PRINTER_${i}_INTERFACE`]) {
    const iface = process.env[`PRINTER_${i}_INTERFACE`];
    printers.push({
      name: process.env[`PRINTER_${i}_NAME`] || displayName(iface),
      interface: iface,
      type: process.env[`PRINTER_${i}_TYPE`] || process.env.PRINTER_TYPE || 'EPSON',
      charWidth: parseInt(process.env[`PRINTER_${i}_CHAR_WIDTH`] || process.env.PRINTER_CHAR_WIDTH || '42', 10),
    });
    i++;
  }

  if (printers.length === 0) {
    const iface = required('PRINTER_INTERFACE');
    printers.push({
      name: displayName(iface),
      interface: iface,
      type: process.env.PRINTER_TYPE || 'EPSON',
      charWidth: parseInt(process.env.PRINTER_CHAR_WIDTH || '42', 10),
    });
  }

  return printers;
};

module.exports = {
  backendUrl,
  socketUrl: (process.env.SOCKET_URL || backendUrl).replace(/\/$/, ''),
  restaurantId: required('RESTAURANT_ID'),
  printAgentKey: required('PRINT_AGENT_KEY'),

  restaurantName: process.env.RESTAURANT_NAME || 'Restaurant',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  printers: parsePrinters(),

  printRetryAttempts: parseInt(process.env.PRINT_RETRY_ATTEMPTS || '3', 10),
  printRetryDelaysMs: (process.env.PRINT_RETRY_DELAYS_MS || '1000,3000,5000')
    .split(',')
    .map((n) => parseInt(n.trim(), 10)),

  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '60000', 10),
};
