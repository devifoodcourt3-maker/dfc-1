import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Clock, CheckCircle, XCircle, ChefHat, Package, Truck, Bike, X, Map } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PrintStatusBadge from './PrintStatusBadge';
import LocationMapModal from './LocationMapModal';
import useOrdersStore from '../../store/ordersStore';
import useRidersStore from '../../store/ridersStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ACTION_BUTTONS = {
  pending: [
    { label: 'Confirm Order', status: 'confirmed', icon: CheckCircle, className: 'btn-success flex-1' },
    { label: 'Cancel',        status: 'cancelled', icon: XCircle,     className: 'btn-danger' },
  ],
  confirmed: [
    { label: 'Start Preparing', status: 'preparing', icon: ChefHat, className: 'btn-primary flex-1' },
    { label: 'Cancel',          status: 'cancelled', icon: XCircle,  className: 'btn-danger' },
  ],
  preparing: [
    { label: 'Mark Ready', status: 'ready', icon: Package, className: 'btn-primary flex-1' },
  ],
  ready: [
    { label: 'Cancel Order', status: 'cancelled', icon: XCircle, className: 'btn-danger flex-1',
      confirmMessage: 'This order is marked Ready and may already be assigned to a delivery boy. Cancelling will notify the customer and the rider. Continue?' },
  ],
  out_for_delivery: [
    { label: 'Cancel Order', status: 'cancelled', icon: XCircle, className: 'btn-danger flex-1',
      confirmMessage: 'This order is already Out for Delivery with a rider. Cancelling now will notify the customer and the rider mid-delivery. Continue?' },
  ],
  delivered: [],
  cancelled: [],
};

const OrderCard = ({ order, isNew = false }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [expanded, setExpanded] = useState(isNew);
  const [showAssign, setShowAssign] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [isRetryingPrint, setIsRetryingPrint] = useState(false);
  const { updateStatus, assignRider, unassignRider, retryPrint } = useOrdersStore();
  const { riders, fetchRiders } = useRidersStore();

  const needsRider = ['ready', 'out_for_delivery'].includes(order.status);

  useEffect(() => {
    if (showAssign && riders.length === 0) fetchRiders();
  }, [showAssign]);

  const handleAction = async (status) => {
    setIsUpdating(true);
    const result = await updateStatus(order._id, status);
    setIsUpdating(false);

    if (result.success) {
      const labels = { confirmed: '✅ Order confirmed', cancelled: '❌ Order cancelled',
                       preparing: '👨‍🍳 Preparing started', ready: '📦 Order ready' };
      toast.success(labels[status] || `Status: ${status}`);
    } else {
      toast.error(result.message || 'Update failed');
    }
  };

  const handleActionClick = (status, confirmMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    handleAction(status);
  };

  const handleAssign = async () => {
    if (!selectedRiderId) return;
    setIsUpdating(true);
    const result = await assignRider(order._id, selectedRiderId);
    setIsUpdating(false);
    if (result.success) {
      toast.success(result.message || 'Rider assigned');
      setShowAssign(false);
      setSelectedRiderId('');
    } else {
      toast.error(result.message || 'Assignment failed');
    }
  };

  const handleRetryPrint = async () => {
    setIsRetryingPrint(true);
    const result = await retryPrint(order._id);
    setIsRetryingPrint(false);
    if (result.success) toast.success('Reprint requested');
    else toast.error(result.message || 'Retry failed');
  };

  const handleUnassign = async () => {
    setIsUpdating(true);
    const result = await unassignRider(order._id);
    setIsUpdating(false);
    if (result.success) toast.success('Rider unassigned');
    else toast.error(result.message || 'Failed to unassign');
  };

  const actions = ACTION_BUTTONS[order.status] || [];
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  const isUnacknowledged = order.status === 'pending' && !order.isAcknowledged;
  const activeRiders = riders.filter((r) => r.isActive);
  const hasLocation = order.customer?.location?.lat != null && order.customer?.location?.lng != null;

  // Derive live status for each rider (mirrors RidersPage logic)
  const getRiderStatus = (r) => {
    if (r.riderStatus) return r.riderStatus;
    if (!r.isActive) return 'offline';
    if (r.activeOrders > 0) return 'on_delivery';
    return 'available';
  };

  const RIDER_STATUS_LABEL = { available: '🟢', on_delivery: '🟠 Busy', offline: '🔴 Offline' };

  return (
    <>
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`card p-5 space-y-4 transition-all ${
        isUnacknowledged ? 'border-brand-300 shadow-lg shadow-brand-500/10 ring-1 ring-brand-200' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isUnacknowledged && (
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-ink-900 font-mono text-sm">{order.orderId}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> {timeAgo}
            </p>
            <div className="mt-1.5">
              <PrintStatusBadge kot={order.kot} onRetry={handleRetryPrint} isRetrying={isRetryingPrint} />
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-ink-900">₹{order.total}</p>
          <p className="text-xs text-ink-400">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-cream-100 rounded-lg p-3 space-y-1.5">
        <p className="font-semibold text-ink-900 text-sm">{order.customer.name}</p>
        <a href={`tel:${order.customer.phone}`}
          className="flex items-center gap-2 text-sm text-ink-600 hover:text-brand-600 transition-colors">
          <Phone size={13} /> {order.customer.phone}
        </a>
        <p className="flex items-start gap-2 text-sm text-ink-600">
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            {order.customer.address}{order.customer.landmark ? ` · ${order.customer.landmark}` : ''}
            {order.customer.area ? <span className="font-medium text-ink-900"> · {order.customer.area}</span> : ''}
          </span>
        </p>
        {hasLocation && (
          <button onClick={() => setShowMap(true)}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors font-medium">
            <Map size={12} /> View pinned location on map
          </button>
        )}
        {order.customer.notes && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
            📝 {order.customer.notes}
          </p>
        )}
      </div>

      {/* Items */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left text-xs text-ink-400 hover:text-ink-700 transition-colors mb-2 flex items-center gap-1"
        >
          {expanded ? '▾' : '▸'} Order items
        </button>

        {expanded && (
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-ink-700 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-ink-400 text-xs">×{item.quantity}</span>
                  <span className="text-ink-900 font-medium">₹{item.price * item.quantity}</span>
                </div>
              </div>
            ))}

            <div className="border-t border-ink-900/[0.07] pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs text-ink-400">
                <span>Subtotal</span><span>₹{order.subtotal}</span>
              </div>
              {order.deliveryCharge > 0 && (
                <div className="flex justify-between text-xs text-ink-400">
                  <span>Delivery</span><span>₹{order.deliveryCharge}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Discount ({order.couponCode})</span><span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-ink-900 pt-1">
                <span>Total</span><span>₹{order.total}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rider assignment section (ready / out_for_delivery) */}
      {needsRider && (
        <div className="bg-cream-100 rounded-lg p-3 space-y-2">
          {order.assignedRider ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bike size={15} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ink-900 font-medium truncate">{order.riderName}</p>
                  <p className="text-xs text-ink-400">
                    {order.status === 'out_for_delivery' ? 'On the way' : 'Assigned · awaiting pickup'}
                  </p>
                </div>
              </div>
              {order.status === 'ready' && (
                <button onClick={handleUnassign} disabled={isUpdating}
                  className="text-xs text-ink-400 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-50">
                  Unassign
                </button>
              )}
            </div>
          ) : showAssign ? (
            <div className="flex items-center gap-2">
              <select value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)}
                className="input text-sm flex-1">
                <option value="">Select delivery boy...</option>
                {activeRiders.map((r) => {
                  const rStatus = getRiderStatus(r);
                  const unavailable = rStatus !== 'available';
                  return (
                    <option key={r._id} value={r._id} disabled={unavailable}
                      style={unavailable ? { color: '#9ca3af' } : {}}>
                      {RIDER_STATUS_LABEL[rStatus] || '🟢'} {r.name}
                      {rStatus === 'on_delivery' ? ' — On Delivery' : ''}
                      {rStatus === 'offline' ? ' — Offline' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="relative flex-shrink-0" title={
                selectedRiderId && getRiderStatus(activeRiders.find(r => r._id === selectedRiderId) || {}) !== 'available'
                  ? 'This rider is already delivering another order.'
                  : undefined
              }>
                <button onClick={handleAssign}
                  disabled={isUpdating || !selectedRiderId || (
                    selectedRiderId && getRiderStatus(activeRiders.find(r => r._id === selectedRiderId) || {}) !== 'available'
                  )}
                  className="btn-primary text-sm py-2.5 px-3 disabled:opacity-50">
                  Assign
                </button>
              </div>
              <button onClick={() => setShowAssign(false)} className="p-2.5 hover:bg-cream-200 rounded-lg text-ink-500">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAssign(true)}
              className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg font-semibold
                bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-all">
              <Bike size={15} /> Assign Delivery Boy
            </button>
          )}
          {activeRiders.length === 0 && showAssign && (
            <p className="text-xs text-ink-400">No active delivery boys. Add one from the Delivery Boys page.</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex gap-2 pt-1">
          {actions.map(({ label, status, icon: Icon, className, confirmMessage }) => (
            <button
              key={status}
              onClick={() => handleActionClick(status, confirmMessage)}
              disabled={isUpdating}
              className={`${className} flex items-center justify-center gap-2 text-sm py-2.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 font-semibold`}
            >
              <Icon size={15} />
              {isUpdating ? '...' : label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
    {showMap && hasLocation && (
      <LocationMapModal order={order} onClose={() => setShowMap(false)} />
    )}
    </>
  );
};

export default OrderCard;
