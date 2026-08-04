const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const config = require('./config');
const buildKotReceipt = require('./formatReceipt');
const { withRetry } = require('./retry');

const execFileAsync = promisify(execFile);
const RAW_PRINT_SCRIPT = path.join(__dirname, '..', 'scripts', 'print-raw.ps1');

const isNetworkPrinter = config.printerInterface.startsWith('tcp://');
// Accepts both `printer:<Name>` and a bare `<Name>` for a Windows-installed printer.
const windowsPrinterName = config.printerInterface.replace(/^printer:/i, '');

const createPrinter = () =>
  new ThermalPrinter({
    type: PrinterTypes[config.printerType] || PrinterTypes.EPSON,
    // node-thermal-printer requires an interface value to construct, but for
    // a Windows-installed printer we only use this instance to build the
    // ESC/POS buffer (see sendToWindowsPrinter) — this value is never
    // connected to. Only a `tcp://` network printer uses it directly below.
    interface: isNetworkPrinter ? config.printerInterface : 'buffer',
    width: config.printerCharWidth,
    removeSpecialCharacters: false,
    options: { timeout: 5000 },
  });

/**
 * Sends a raw ESC/POS buffer to a printer already installed in Windows (by
 * name) via the OS print spooler — no native Node module required. Shells
 * out to scripts/print-raw.ps1, which calls the Win32 winspool API directly.
 */
async function sendToWindowsPrinter(buffer) {
  const tempFile = path.join(os.tmpdir(), `dfc-kot-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  await fs.writeFile(tempFile, buffer);
  try {
    await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', RAW_PRINT_SCRIPT,
      '-PrinterName', windowsPrinterName,
      '-FilePath', tempFile,
    ]);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

async function printOnce(order) {
  const printer = createPrinter();
  printer.clear();
  buildKotReceipt(printer, order, { restaurantName: config.restaurantName, timezone: config.timezone });

  if (isNetworkPrinter) {
    const connected = await printer.isPrinterConnected().catch(() => false);
    if (!connected) {
      throw new Error(`Printer not reachable at "${config.printerInterface}"`);
    }
    await printer.execute();
  } else {
    await sendToWindowsPrinter(printer.getBuffer());
  }
}

/** Prints one KOT, retrying per PRINT_RETRY_ATTEMPTS/PRINT_RETRY_DELAYS_MS before giving up. */
async function printKOT(order) {
  return withRetry(() => printOnce(order), {
    attempts: config.printRetryAttempts,
    delays: config.printRetryDelaysMs,
    onAttemptFailed: (err, attempt) =>
      console.warn(`[print] Attempt ${attempt}/${config.printRetryAttempts} failed for ${order.orderId}: ${err.message}`),
  });
}

module.exports = { printKOT };
