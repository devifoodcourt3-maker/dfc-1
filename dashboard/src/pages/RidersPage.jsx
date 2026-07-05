import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Bike, Phone, Mail, ToggleLeft, ToggleRight, Package, Clock } from 'lucide-react';
import useRidersStore from '../store/ridersStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../services/api';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available: {
    label: 'Available',
    dot: 'bg-green-500',
    ping: 'bg-green-400',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  on_delivery: {
    label: 'On Delivery',
    dot: 'bg-orange-500',
    ping: 'bg-orange-400',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-red-500',
    ping: null,
    badge: 'bg-red-50 text-red-600 border-red-200',
  },
};

/** Derive status from the rider object (works on initial page load before any socket event). */
const getRiderStatus = (rider) => {
  // Prefer the live socket-updated field if already set
  if (rider.riderStatus) return rider.riderStatus;
  if (!rider.isActive) return 'offline';
  if (rider.activeOrders > 0) return 'on_delivery';
  return 'available';
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badge}`}
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {cfg.ping && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.ping} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
        </span>
        {cfg.label}
      </motion.span>
    </AnimatePresence>
  );
};

// ── Active Order Mini-Info ────────────────────────────────────────────────────
const ActiveOrderInfo = ({ activeOrder }) => {
  if (!activeOrder) return null;
  const assignedTime = activeOrder.assignedAt
    ? format(new Date(activeOrder.assignedAt), 'h:mm a')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 space-y-0.5"
    >
      <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
        <Package size={11} /> Current Order
      </p>
      <p className="text-xs font-mono font-bold text-orange-800">{activeOrder.orderId}</p>
      {assignedTime && (
        <p className="text-[11px] text-orange-600 flex items-center gap-1">
          <Clock size={10} /> Assigned at {assignedTime}
        </p>
      )}
    </motion.div>
  );
};

// ── Delete button with tooltip ────────────────────────────────────────────────
const DeleteButton = ({ rider, onRemove, disabled }) => {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && onRemove(rider)}
        onMouseEnter={() => disabled && setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={`p-2 rounded-lg transition-colors ${
          disabled
            ? 'text-ink-200 cursor-not-allowed'
            : 'hover:bg-red-50 text-ink-400 hover:text-red-600'
        }`}
      >
        <Trash2 size={15} />
      </button>
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-52 bg-ink-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl z-10 pointer-events-none"
          >
            This rider is already delivering another order.
            <span className="absolute bottom-[-4px] right-3 w-2 h-2 bg-ink-900 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', phone: '', email: '', password: '', vehicleNumber: '' };

const RidersPage = () => {
  const { riders, isLoading, fetchRiders, addRider, updateRider, removeRider } = useRidersStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchRiders(); }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.password) {
      toast.error('Name, phone, email and password are required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.post('/dashboard/riders', form);
      addRider(res.data.data.rider);
      toast.success('Delivery boy added');
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add delivery boy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (rider) => {
    try {
      const res = await api.patch(`/dashboard/riders/${rider._id}/toggle`);
      updateRider(rider._id, res.data.data.rider);
      toast.success(res.data.data.rider.isActive ? 'Rider activated' : 'Rider deactivated');
    } catch {
      toast.error('Failed to update rider');
    }
  };

  const handleRemove = async (rider) => {
    if (!confirm(`Remove "${rider.name}"? Any orders currently with them will be unassigned.`)) return;
    try {
      await api.delete(`/dashboard/riders/${rider._id}`);
      removeRider(rider._id);
      toast.success('Delivery boy removed');
    } catch {
      toast.error('Failed to remove delivery boy');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Delivery Boys</h1>
          <p className="text-ink-500 text-sm mt-1">{riders.length} rider{riders.length !== 1 ? 's' : ''} on your team</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={17} /> Add Delivery Boy
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card p-8 text-center text-ink-500">Loading delivery boys...</div>
      ) : riders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center card">
          <Bike size={40} className="text-ink-300 mb-3" />
          <p className="text-ink-600 font-medium">No delivery boys yet</p>
          <p className="text-ink-400 text-sm mt-1 mb-4">Add your first rider to start assigning orders</p>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Delivery Boy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {riders.map((rider) => {
              const status = getRiderStatus(rider);
              const isOnDelivery = status === 'on_delivery';

              return (
                <motion.div
                  key={rider._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`card p-5 space-y-3 relative ${!rider.isActive ? 'opacity-50' : ''}`}
                >
                  {/* ── Status badge — top-right corner ── */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={status} />
                  </div>

                  {/* ── Rider identity (same layout as before) ── */}
                  <div className="flex items-start justify-between gap-3 pr-24">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bike size={20} className="text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink-900 text-sm truncate">{rider.name}</p>
                        <p className="text-xs text-ink-500">{rider.vehicleNumber || 'No vehicle number'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggle(rider)} className="flex-shrink-0 transition-colors" title="Active / Inactive">
                      {rider.isActive
                        ? <ToggleRight size={26} className="text-green-500" />
                        : <ToggleLeft size={26} className="text-ink-300" />}
                    </button>
                  </div>

                  {/* ── Contact info ── */}
                  <div className="space-y-1.5 text-sm">
                    <a href={`tel:${rider.phone}`} className="flex items-center gap-2 text-ink-600 hover:text-brand-600 transition-colors">
                      <Phone size={13} /> {rider.phone}
                    </a>
                    <p className="flex items-center gap-2 text-ink-600 truncate">
                      <Mail size={13} className="flex-shrink-0" /> <span className="truncate">{rider.email}</span>
                    </p>
                  </div>

                  {/* ── Active order info — slides in when on delivery ── */}
                  <AnimatePresence>
                    {isOnDelivery && rider.activeOrder && (
                      <ActiveOrderInfo key="order-info" activeOrder={rider.activeOrder} />
                    )}
                  </AnimatePresence>

                  {/* ── Footer row ── */}
                  <div className="flex items-center justify-between pt-2 border-t border-ink-900/[0.07]">
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <Package size={13} />
                      <span>{rider.activeOrders > 0
                        ? <span className="text-brand-600 font-semibold">{rider.activeOrders} active order{rider.activeOrders > 1 ? 's' : ''}</span>
                        : 'No active orders'}</span>
                    </div>
                    <DeleteButton rider={rider} onRemove={handleRemove} disabled={isOnDelivery} />
                  </div>
                  <p className="text-xs text-ink-400">{rider.totalDeliveries || 0} total deliveries</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-ink-900/[0.08] rounded-2xl w-full max-w-md shadow-soft-lg">
            <div className="flex items-center justify-between p-6 border-b border-ink-900/[0.06]">
              <h2 className="text-lg font-bold text-ink-900">Add Delivery Boy</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
                <X size={18} className="text-ink-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ravi Kumar" className="input" required autoFocus />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210" className="input" required />
              </div>
              <div>
                <label className="label">Email (used to log in) *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="rider@dfcrestaurant.com" className="input" required />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters" className="input" required minLength={6} />
              </div>
              <div>
                <label className="label">Vehicle Number <span className="text-ink-400 text-xs">optional</span></label>
                <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                  placeholder="AP 39 XX 1234" className="input" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-ink-900/[0.06]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Adding...' : 'Add Delivery Boy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidersPage;
