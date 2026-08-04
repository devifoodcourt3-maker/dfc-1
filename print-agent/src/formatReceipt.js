const PAYMENT_LABELS = { cod: 'Cash on Delivery' };
const ORDER_TYPE_LABELS = { delivery: 'DELIVERY', takeaway: 'TAKEAWAY' };

const formatDateTime = (isoString, timezone) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));

/**
 * Writes a full KOT to the given node-thermal-printer instance. Pure formatting —
 * the caller (printerClient) owns connecting, executing and error handling.
 */
function buildKotReceipt(printer, order, { restaurantName, timezone }) {
  const isTakeaway = order.orderType === 'takeaway';

  printer.alignCenter();
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.println(restaurantName);
  printer.bold(false);
  printer.setTextNormal();
  printer.println('KITCHEN ORDER TICKET');
  printer.drawLine();

  printer.alignLeft();
  printer.bold(true);
  printer.println(`Order: ${order.orderId}`);
  printer.bold(false);
  printer.println(`Date/Time: ${formatDateTime(order.createdAt, timezone)}`);
  printer.println(`Order Type: ${ORDER_TYPE_LABELS[order.orderType] || order.orderType}`);
  printer.println(`Payment: ${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}`);
  printer.drawLine();

  printer.println(`Customer: ${order.customer?.name || '-'}`);
  printer.println(`Phone: ${order.customer?.phone || '-'}`);
  if (!isTakeaway) {
    const addressParts = [order.customer?.address, order.customer?.landmark, order.customer?.area].filter(Boolean);
    printer.println(`Address: ${addressParts.join(', ') || '-'}`);
  }
  printer.drawLine();

  printer.bold(true);
  printer.println('ITEMS');
  printer.bold(false);
  (order.items || []).forEach((item) => {
    printer.leftRight(`${item.quantity} x ${item.name}`, `Rs.${item.price * item.quantity}`);
    if (item.note) {
      printer.println(`   Note: ${item.note}`);
    }
  });
  printer.drawLine();

  printer.leftRight('Subtotal', `Rs.${order.subtotal}`);
  if (order.deliveryCharge > 0) printer.leftRight('Delivery Charge', `Rs.${order.deliveryCharge}`);
  if (order.discount > 0) {
    printer.leftRight(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `-Rs.${order.discount}`);
  }
  printer.bold(true);
  printer.setTextDoubleHeight();
  printer.leftRight('GRAND TOTAL', `Rs.${order.total}`);
  printer.setTextNormal();
  printer.bold(false);

  if (order.customer?.notes) {
    printer.drawLine();
    printer.bold(true);
    printer.println('SPECIAL INSTRUCTIONS');
    printer.bold(false);
    printer.println(order.customer.notes);
  }

  printer.drawLine();
  printer.alignCenter();
  printer.println(`Confirmed: ${formatDateTime(new Date().toISOString(), timezone)}`);
  printer.cut();
}

module.exports = buildKotReceipt;
