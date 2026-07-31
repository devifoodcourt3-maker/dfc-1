import { useState, useEffect, useRef } from 'react';
import SEO from '../components/shared/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, Clock, ChefHat, Package, Truck, XCircle,
  Phone, History, ChevronRight, AlertCircle, Bike,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { trackOrder, getOrderHistory } from '../services/api';
import { isUnseenCancellation, markOrderStatusSeen } from '../utils/orderNotifications';
import { playCancelAlert } from '../utils/cancelAlert';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import cloudinaryAssets from '../cloudinary-assets.json';

const menuDoodleBg = cloudinaryAssets['menu-doodle-bg.png'];
const floatingVeggies = cloudinaryAssets['floating-veggies.png'];

// ── Canvas-based Black Background Remover ────────────────────────────────────
const TransparentImage = ({ src, alt, className, style, threshold = 22 }) => {
  const [processedSrc, setProcessedSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const brightness = Math.max(r, g, b);

          if (brightness < threshold) {
            data[i + 3] = 0; // Make transparent
          } else if (brightness < threshold + 12) {
            const factor = (brightness - threshold) / 12;
            data[i + 3] = Math.round(factor * 255);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setProcessedSrc(canvas.toDataURL());
      } catch (err) {
        console.error('Failed to remove background dynamically:', err);
      }
    };
  }, [src, threshold]);

  return <img src={processedSrc || src} alt={alt} className={className} style={style} />;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const STATUS_STEPS = [
  { status: 'pending', icon: Clock, label: 'Order Received', desc: 'We got your order!' },
  { status: 'confirmed', icon: CheckCircle, label: 'Confirmed', desc: 'Restaurant confirmed your order' },
  { status: 'preparing', icon: ChefHat, label: 'Preparing', desc: 'Your food is being prepared' },
  { status: 'ready', icon: Package, label: 'Ready for Pickup', desc: 'Food is ready, handing to delivery' },
  { status: 'out_for_delivery', icon: Bike, label: 'Out for Delivery', desc: 'Your rider is on the way' },
  { status: 'delivered', icon: Truck, label: 'Delivered', desc: 'Enjoy your meal! 🎉' },
];

const HISTORY_BADGE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-purple-50 text-purple-700 border-purple-200',
  ready: 'bg-green-50 text-green-700 border-green-200',
  out_for_delivery: 'bg-brand-50 text-brand-700 border-brand-200',
  delivered: 'bg-ink-100 text-ink-600 border-ink-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const TrackOrderPage = () => {
  const saved = JSON.parse(localStorage.getItem('dfc_last_order') || 'null');
  const [orderId, setOrderId] = useState(saved?.orderId || '');
  const [phone, setPhone] = useState(saved?.phone || '');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(null);
  const isNewlyAssignedRef = useRef(false);

  // Order history list (all past orders for this phone number)
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const dismissOrder = useNotificationStore((s) => s.dismissOrder);

  // Shared by both the search form and clicking a history item.
  const trackSpecificOrder = async (id, ph) => {
    if (!id || !ph) { toast.error('Enter Order ID and phone number'); return; }
    setIsLoading(true);
    try {
      const data = await trackOrder({ orderId: id.toUpperCase(), phone: ph });
      setOrder(data.order);
      markOrderStatusSeen(data.order.orderId, data.order.status);
      dismissOrder(data.order.orderId);

      socketRef.current?.disconnect();
      const s = io(SOCKET_URL);
      s.emit('track-order', id.toUpperCase());
      s.on('status-update', ({ orderId: oid, status, order: updatedOrder }) => {
        if (oid !== id.toUpperCase()) return;
        setOrder((prev) => {
          const wasAssigned = !!prev?.assignedRider;
          const nowAssigned = !!updatedOrder?.assignedRider;
          isNewlyAssignedRef.current = !wasAssigned && nowAssigned;
          return updatedOrder ? updatedOrder : (prev ? { ...prev, status } : prev);
        });
        markOrderStatusSeen(oid, status);
        dismissOrder(oid);
        // Reflect the live update in the history list too, if it's showing
        setHistory((prev) => prev.map((o) => (o.orderId === oid ? { ...o, status, assignedRider: updatedOrder?.assignedRider ?? o.assignedRider } : o)));

        if (status === 'cancelled') {
          playCancelAlert();
          toast.error(`Order ${oid} was cancelled by the restaurant`, { icon: '⚠️', duration: 6000 });
        } else if (isNewlyAssignedRef.current) {
          toast.success(`${updatedOrder.assignedRider.name} will deliver your order!`, { icon: '🛵', duration: 4000 });
        } else {
          toast.success(`Order status: ${status.replace(/_/g, ' ').toUpperCase()}`, { icon: '🔔' });
        }
      });
      socketRef.current = s;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = (e) => {
    e?.preventDefault();
    trackSpecificOrder(orderId, phone);
  };

  const fetchHistory = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length !== 10) return;
    setIsHistoryLoading(true);
    try {
      const data = await getOrderHistory(phoneNumber);
      setHistory(data.orders || []);

      // Surface a toast + alert sound for any cancellations the customer hasn't seen yet
      const newlyCancelled = (data.orders || []).filter(isUnseenCancellation);
      if (newlyCancelled.length > 0) {
        playCancelAlert();
        toast.error(
          newlyCancelled.length === 1
            ? `Order ${newlyCancelled[0].orderId} was cancelled`
            : `${newlyCancelled.length} of your orders were cancelled`,
          { icon: '⚠️', duration: 6000 }
        );
      }
    } catch {
      // silent — history is a secondary, best-effort feature
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const openHistoryOrder = (historyOrder) => {
    const ph = phone || saved?.phone || '';
    setOrderId(historyOrder.orderId);
    setPhone(ph);
    document.getElementById('track-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    trackSpecificOrder(historyOrder.orderId, ph);
  };

  useEffect(() => {
    if (saved?.orderId && saved?.phone) trackSpecificOrder(saved.orderId, saved.phone);
    if (saved?.phone) fetchHistory(saved.phone);
    return () => socketRef.current?.disconnect();
  }, []);

  const currentStepIndex = order?.status === 'cancelled'
    ? -1
    : STATUS_STEPS.findIndex((s) => s.status === order?.status);

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${menuDoodleBg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '750px',
        backgroundColor: '#0c0a09'
      }}>
      <SEO
        title="Track Your Order | DFC (Devi Food Court) Tagarapuvalasa"
        description="Live track your food order from DFC (Devi Food Court) — DFC Restaurant. Get real-time status updates from kitchen to your doorstep in 30-45 minutes."
        keywords="DFC order tracking, track DFC restaurant order, Devi Food Court order status, DFC live tracking, best restaurant in tagarapuvalasa"
        canonical="https://dfcthagarapuvalasa.in/track"
      />

      {/* Dark overlay to blend background doodles seamlessly (lighter to make doodles more visible) */}
      <div className="absolute inset-0 bg-black/42 pointer-events-none" />

      {/* Ambient orange glow blobs behind header and content — hidden on phone view to prevent text interference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        {/* Top-left corner warm orange focus spot */}
        <div className="absolute w-[900px] h-[900px] top-[-300px] left-[-350px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.36) 0%, rgba(255,90,0,0.08) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />

        {/* Top-right corner warm orange focus spot */}
        <div className="absolute w-[900px] h-[900px] top-[-300px] right-[-350px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.36) 0%, rgba(255,90,0,0.08) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />
      </div>

      {/* Scattered background veggies/ingredients with transparent background */}


      <div className="max-w-2xl mx-auto pt-12">
        <div className="text-center mb-10">
          <h1 className="section-heading text-4xl mb-3">Track <span className="gradient-text">Order</span></h1>
          <p className="section-sub mx-auto text-center">Enter your Order ID and phone number</p>
        </div>

        {/* Search form */}
        <form id="track-form" onSubmit={handleTrack} className="card-premium p-6 space-y-4 mb-8">
          <div>
            <label className="block text-sm text-ink-600 mb-1.5">Order ID</label>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="DFC-20240115-4827" className="input-field font-mono" />
          </div>
          <div>
            <label className="block text-sm text-ink-600 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input value={phone}
                onChange={(e) => { setPhone(e.target.value); if (e.target.value.length === 10) fetchHistory(e.target.value); }}
                placeholder="10-digit number" className="input-field pl-10" type="tel" maxLength={10} />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3.5">
            <Search size={17} /> {isLoading ? 'Searching...' : 'Track Order'}
          </button>
        </form>

        {/* Order status */}
        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mb-10">

            {/* Order info card */}
            <div className="card-premium p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-ink-500 text-sm">Order ID</p>
                  <p className="font-mono font-bold text-xl" style={{ color: '#b91c1c' }}>{order.orderId}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border
                  ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                    order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-orange-50 text-brand-700 border-orange-200 animate-pulse'}`}>
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-ink-500 text-xs">Customer</p>
                  <p className="text-ink-900 font-medium">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-ink-500 text-xs">Total</p>
                  <p className="text-ink-900 font-bold">₹{order.total}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-ink-500 text-xs mb-1">Items</p>
                  <p className="text-ink-700 text-sm">
                    {order.items.map((i) => `${i.name} ×${i.quantity}`).join(' · ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery partner details — shown once admin assigns a rider */}
            {order.assignedRider && order.status !== 'cancelled' && (
              <div className="card-premium p-5 flex items-center gap-4"
                style={{ borderColor: 'rgba(21,128,61,0.25)', background: 'rgba(21,128,61,0.03)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(21,128,61,0.12)' }}>
                  <Bike size={22} style={{ color: '#15803d' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-500">
                    {order.status === 'out_for_delivery' ? 'Your delivery partner is on the way' : 'Delivery partner assigned'}
                  </p>
                  <p className="font-bold text-ink-900 truncate">{order.assignedRider.name}</p>
                  {order.assignedRider.vehicleNumber && (
                    <p className="text-xs text-ink-500">{order.assignedRider.vehicleNumber}</p>
                  )}
                </div>
                {order.assignedRider.phone && (
                  <a href={`tel:${order.assignedRider.phone}`}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}>
                    <Phone size={14} /> Call
                  </a>
                )}
              </div>
            )}

            {/* Status timeline */}
            {order.status === 'cancelled' ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <XCircle size={40} className="text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-semibold text-lg">Order Cancelled</p>
                <p className="text-ink-500 text-sm mt-2">This order was cancelled by the restaurant. Contact us for assistance.</p>
              </div>
            ) : (
              <div className="card-premium p-6">
                <h3 className="font-bold text-ink-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#d97706' }} />
                  Live Order Status
                </h3>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const done = i <= currentStepIndex;
                    const active = i === currentStepIndex;
                    const isLast = i === STATUS_STEPS.length - 1;

                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                            ${done ? 'border-transparent' : 'bg-cream-100 border-ink-900/[0.08]'}`}
                            style={done ? { background: 'linear-gradient(135deg, #b91c1c, #d97706)', boxShadow: active ? '0 0 0 4px rgba(217,119,6,0.15)' : '' } : {}}>
                            <Icon size={15} className={done ? 'text-white' : 'text-ink-400'} />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 flex-1 my-1 min-h-[24px] rounded-full transition-all"
                              style={{ background: done && i < currentStepIndex ? '#d97706' : 'rgba(26,24,22,0.08)' }} />
                          )}
                        </div>
                        <div className="pb-6 pt-1.5 min-w-0">
                          <p className={`font-semibold text-sm ${done ? 'text-ink-900' : 'text-ink-400'}`}>
                            {step.label}
                            {active && <span className="ml-2 text-xs animate-pulse" style={{ color: '#d97706' }}>● Live</span>}
                          </p>
                          <p className={`text-xs mt-0.5 ${done ? 'text-ink-600' : 'text-ink-300'}`}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Order History */}
        {(history.length > 0 || isHistoryLoading) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-ink-500" />
              <h2 className="font-bold text-ink-900 text-lg">Your Order History</h2>
            </div>

            {isHistoryLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="card-premium p-4 h-20 animate-pulse bg-cream-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence>
                  {history.map((h) => {
                    const unseenCancel = isUnseenCancellation(h);
                    return (
                      <motion.button
                        key={h.orderId}
                        layout
                        onClick={() => openHistoryOrder(h)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`w-full text-left card-premium p-4 flex items-center gap-3 transition-all hover:shadow-soft-lg
                          ${unseenCancel ? 'ring-1 ring-red-300 border-red-200' : ''}`}
                      >
                        {unseenCancel && (
                          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono font-bold text-ink-900 text-sm">{h.orderId}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${HISTORY_BADGE[h.status] || HISTORY_BADGE.pending}`}>
                              {h.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {unseenCancel && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                                <AlertCircle size={11} /> New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-500">
                            {format(new Date(h.createdAt), 'MMM d, h:mm a')} · ₹{h.total} · {h.items.length} item{h.items.length > 1 ? 's' : ''}
                          </p>
                          {h.assignedRider?.name && (
                            <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                              <Bike size={11} style={{ color: '#15803d' }} /> {h.assignedRider.name}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-ink-300 flex-shrink-0" />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
