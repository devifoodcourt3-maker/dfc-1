const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const config = require('./config');
const buildKotReceipt = require('./formatReceipt');
const { withRetry } = require('./retry');

const execFileAsync = promisify(execFile);
const RAW_PRINT_SCRIPT = path.join(__dirname, '..', 'scripts', 'print-raw.ps1');

const isNetworkInterface = (iface) => iface.startsWith('tcp://');
// Accepts both `printer:<Name>` and a bare `<Name>` for a Windows-installed printer.
const windowsPrinterName = (iface) => iface.replace(/^printer:/i, '');

const createPrinter = (printerConfig) =>
  new ThermalPrinter({
    type: PrinterTypes[printerConfig.type] || PrinterTypes.EPSON,
    // node-thermal-printer requires an interface value to construct, but for
    // a Windows-installed printer we only use this instance to build the
    // ESC/POS buffer (see sendToWindowsPrinter) — this value is never
    // connected to. Only a `tcp://` network printer uses it directly below.
    interface: isNetworkInterface(printerConfig.interface) ? printerConfig.interface : 'buffer',
    width: printerConfig.charWidth,
    // Falls back to the codepage node-thermal-printer's own docs recommend
    // (PC437_USA) if config.js's default was ever bypassed or a typo'd
    // value slipped through — without a valid characterSet, iconv-lite
    // throws "Encoding not recognized: 'undefined'" on the first non-ASCII
    // character (accented names, curly quotes, etc.) in a receipt.
    characterSet: CharacterSet[printerConfig.characterSet] || CharacterSet.PC437_USA,
    removeSpecialCharacters: false,
    options: { timeout: 5000 },
  });

/**
 * Sends a raw ESC/POS buffer to a printer already installed in Windows (by
 * name) via the OS print spooler — no native Node module required. Shells
 * out to scripts/print-raw.ps1, which calls the Win32 winspool API directly.
 */
async function sendToWindowsPrinter(printerName, buffer) {
  const tempFile = path.join(os.tmpdir(), `dfc-kot-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  await fs.writeFile(tempFile, buffer);
  try {
    await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', RAW_PRINT_SCRIPT,
      '-PrinterName', printerName,
      '-FilePath', tempFile,
    ]);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

async function printOnce(order, printerConfig) {
  const printer = createPrinter(printerConfig);
  printer.clear();
  buildKotReceipt(printer, order, { restaurantName: config.restaurantName, timezone: config.timezone });

  if (isNetworkInterface(printerConfig.interface)) {
    const connected = await printer.isPrinterConnected().catch(() => false);
    if (!connected) {
      throw new Error(`Printer "${printerConfig.name}" not reachable at "${printerConfig.interface}"`);
    }
    await printer.execute();
  } else {
    await sendToWindowsPrinter(windowsPrinterName(printerConfig.interface), printer.getBuffer());
  }
}

/** Prints one KOT to a single printer, retrying per PRINT_RETRY_ATTEMPTS/PRINT_RETRY_DELAYS_MS before giving up. */
async function printToOne(order, printerConfig) {
  return withRetry(() => printOnce(order, printerConfig), {
    attempts: config.printRetryAttempts,
    delays: config.printRetryDelaysMs,
    onAttemptFailed: (err, attempt) =>
      console.warn(`[print:${printerConfig.name}] Attempt ${attempt}/${config.printRetryAttempts} failed for ${order.orderId}: ${err.message}`),
  });
}

/**
 * Prints one KOT to every configured printer at once. Each printer gets its
 * own independent retry loop via Promise.allSettled, so a failure on one
 * printer (after exhausting its retries) never stops the others from being
 * attempted or from succeeding.
 */
async function printKOT(order) {
  const results = await Promise.allSettled(
    config.printers.map((printerConfig) => printToOne(order, printerConfig))
  );

  const failures = [];
  results.forEach((result, i) => {
    const printerConfig = config.printers[i];
    if (result.status === 'fulfilled') {
      console.log(`[print:${printerConfig.name}] KOT printed for ${order.orderId}`);
    } else {
      console.error(`[print:${printerConfig.name}] KOT failed for ${order.orderId} after all retries: ${result.reason.message}`);
      failures.push(`${printerConfig.name}: ${result.reason.message}`);
    }
  });

  if (failures.length > 0) {
    throw new Error(`Printing failed on ${failures.length}/${config.printers.length} printer(s) — ${failures.join('; ')}`);
  }
}

module.exports = { printKOT };
