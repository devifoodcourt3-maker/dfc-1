import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Tag, X, ArrowLeft, MapPin, MapPinned, Phone, User, Bike, AlertCircle } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { placeOrder, validateCoupon } from '../services/api';
import useSettingsStore from '../store/settingsStore';
import LocationPicker from '../components/shared/LocationPicker';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const sub = subtotal();

  const [form, setForm] = useState({ name: '', phone: '', address: '', landmark: '', notes: '' });
  const [area, setArea] = useState('');
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [placed, setPlaced] = useState(null);
  const { settings } = useSettingsStore();

  const isOpen = settings?.isOpen ?? true;
  const baseCharge = settings?.deliveryCharge ?? 40;
  const freeAbove  = settings?.freeDeliveryAbove ?? 0;
  const autoFreeDelivery = freeAbove > 0 && sub >= freeAbove;
  const activeAreas = settings?.deliveryAreas?.filter((a) => a.isActive) ?? [];
  const areaExtraCharge = activeAreas.find((a) => a.name === area)?.extraCharge || 0;
  const DELIVERY = (coupon?.freeDelivery || autoFreeDelivery) ? 0 : baseCharge + areaExtraCharge;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, sub - discount + DELIVERY);

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const data = await validateCoupon(couponInput, sub);
      setCoupon({ ...data, code: couponInput.toUpperCase() });
      toast.success(`Coupon applied! You saved ₹${data.discount || 0}${data.freeDelivery ? ' + free delivery' : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleLocationConfirm = (loc) => {
    setPinnedLocation(loc);
    setShowMapPicker(false);
    if (loc.address && !form.address.trim()) setForm((f) => ({ ...f, address: loc.address }));
    toast.success('Location pinned on map 📍');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) { toast.error('Please enter a valid 10-digit phone number'); return; }

    if (!pinnedLocation) {
      toast.error('📍 Please pin your delivery location on the map');
      setShowMapPicker(true);
      return;
    }

    if (activeAreas.length > 0 && !area) {
      toast.error('Please select your delivery area');
      return;
    }

    setIsPlacing(true);
    try {
      const payload = {
        customer: { ...form, area, ...(pinnedLocation ? { location: { lat: pinnedLocation.lat, lng: pinnedLocation.lng } } : {}) },
        items: items.map(({ _id, quantity }) => ({ menuItemId: _id, quantity })),
        couponCode: coupon?.code,
      };
      const data = await placeOrder(payload);
      const order = data.order;
      localStorage.setItem('dfc_last_order', JSON.stringify({ orderId: order.orderId, phone: form.phone }));
      clearCart();
      setPlaced(order);

      if (data.removedItems?.length > 0) {
        toast.error(
          `${data.removedItems.join(', ')} ${data.removedItems.length > 1 ? 'are' : 'is'} no longer available and ${data.removedItems.length > 1 ? 'were' : 'was'} removed from your order.`,
          { duration: 7000 }
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  // Order success screen
  if (placed) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-cream-50">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(21,128,61,0.1)' }}>
            <CheckCircle size={40} style={{ color: '#15803d' }} />
          </motion.div>

          <h2 className="font-display text-3xl tracking-wide text-ink-900 mb-2">Order Placed!</h2>
          <p className="text-ink-600 mb-6">Your food is on its way 🎉</p>

          <div className="card-premium p-6 mb-6 text-left space-y-3">
            <div className="text-center border-b border-ink-900/[0.06] pb-4 mb-4">
              <p className="text-ink-500 text-sm">Order ID</p>
              <p className="font-mono font-bold text-xl tracking-wider" style={{ color: '#b91c1c' }}>{placed.orderId}</p>
              <p className="text-ink-400 text-xs mt-1">Save this for tracking</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Total Paid</span><span className="text-ink-900 font-semibold">₹{placed.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Payment</span><span className="text-ink-900">Cash on Delivery</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Est. Delivery</span><span className="text-ink-900">30-45 mins</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/track')} className="btn-primary flex-1 justify-center">Track Order</button>
            <button onClick={() => navigate('/menu')} className="btn-outline flex-1 justify-center">Order More</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4 text-center bg-cream-50">
        <div>
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="font-display text-2xl tracking-wide text-ink-900 mb-2">Cart is empty</h2>
          <p className="text-ink-500 mb-6">Add some items before checking out</p>
          <button onClick={() => navigate('/menu')} className="btn-primary">Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 bg-cream-50">
      <div className="max-w-5xl mx-auto pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-ink-500 hover:text-ink-900 mb-8 transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="section-heading text-3xl mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <div className="card-premium p-6 space-y-4">
              <h3 className="font-bold text-ink-900 flex items-center gap-2"><User size={17} style={{ color: '#b91c1c' }} /> Delivery Details</h3>

              <div>
                <label className="block text-sm text-ink-600 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name" className="input-field" required />
              </div>

               <div>
                <label className="block text-sm text-ink-600 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-sm flex items-center gap-1 pointer-events-none">
                    <Phone size={13} /> +91
                  </span>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit mobile number" className="input-field pl-20"
                    type="tel" maxLength={10} pattern="[6-9][0-9]{9}" required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-ink-600 mb-1.5">Delivery Address *</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="House No., Street, Area..." className="input-field resize-none" rows={3} required />
              </div>

              {activeAreas.length > 0 && (
                <div>
                  <label className="block text-sm text-ink-600 mb-1.5">Delivery Area *</label>
                  <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field" required>
                    <option value="" disabled>Select your area</option>
                    {activeAreas.map((a) => (
                      <option key={a._id || a.name} value={a.name}>
                        {a.name}{a.extraCharge > 0 ? ` (+₹${a.extraCharge} delivery)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pin exact location on map — REQUIRED */}
              {pinnedLocation ? (
                <button type="button" onClick={() => setShowMapPicker(true)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors"
                  style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.3)' }}>
                  <MapPinned size={17} className="flex-shrink-0" style={{ color: '#15803d' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#15803d' }}>Location pinned on map ✓</p>
                    <p className="text-ink-500 text-xs truncate">Tap to adjust the pin</p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  {/* Outer glow ring */}
                  <span className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: 'linear-gradient(135deg,#e2131c,#f7780e)' }} />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="relative w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-transform active:scale-[0.98] hover:scale-[1.01]"
                    style={{
                      background: 'linear-gradient(135deg, #e2131c 0%, #f7780e 100%)',
                      boxShadow: '0 4px 24px rgba(226,19,28,0.35), 0 1px 4px rgba(0,0,0,0.12)',
                    }}>
                    {/* Bouncing pin icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center" style={{ animation: 'bounce 1.2s infinite' }}>
                      <MapPinned size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm leading-tight">📍 Tap to pin your delivery location</p>
                      <p className="text-white/75 text-xs mt-0.5">Required — helps your rider find you faster</p>
                    </div>
                    {/* Arrow indicator */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-0.5 opacity-80" style={{ animation: 'bounce 1s infinite' }}>
                      <span className="text-white text-lg leading-none">›</span>
                    </div>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm text-ink-600 mb-1.5">Landmark <span className="text-ink-400">(optional)</span></label>
                <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  placeholder="Near park, opposite school..." className="input-field" />
              </div>

              <div>
                <label className="block text-sm text-ink-600 mb-1.5">Additional Notes <span className="text-ink-400">(optional)</span></label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Extra spicy? No onions? Let us know..." className="input-field resize-none" rows={2} />
              </div>
            </div>

            {/* Coupon */}
            <div className="card-premium p-6 space-y-3">
              <h3 className="font-bold text-ink-900 flex items-center gap-2"><Tag size={17} style={{ color: '#d97706' }} /> Coupon Code</h3>
              {coupon ? (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3.5" style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.3)' }}>
                  <CheckCircle size={16} style={{ color: '#15803d' }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: '#15803d' }}>{coupon.code} applied!</p>
                    <p className="text-ink-500 text-xs">
                      {coupon.discount > 0 ? `Saved ₹${coupon.discount}` : ''}
                      {coupon.freeDelivery ? ' + Free delivery' : ''}
                    </p>
                  </div>
                  <button onClick={() => setCoupon(null)} className="text-ink-400 hover:text-red-500">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCoupon(); } }}
                    placeholder="Enter coupon code" className="input-field flex-1" />
                  <button type="button" onClick={handleCoupon} disabled={isValidatingCoupon}
                    className="btn-outline px-6 rounded-xl border border-ink-900/10 whitespace-nowrap text-sm h-[48px] flex items-center justify-center">
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Closed banner OR Place Order button */}
            {!isOpen ? (
              <div className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'rgba(185,28,28,0.06)', border: '1.5px solid rgba(185,28,28,0.25)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(185,28,28,0.1)' }}>
                  <AlertCircle size={22} style={{ color: '#b91c1c' }} />
                </div>
                <div>
                  <p className="font-bold text-ink-900">Restaurant is Currently Closed</p>
                  <p className="text-ink-500 text-sm mt-0.5">We're not accepting orders right now. Please check back soon!</p>
                </div>
              </div>
            ) : (
              <button type="submit" disabled={isPlacing} className="btn-primary w-full justify-center text-base py-4">
                {isPlacing ? 'Placing order...' : `Place Order — ₹${total}`}
              </button>
            )}
            <p className="text-center text-ink-400 text-xs">Cash on Delivery · No payment needed now</p>
          </form>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="card-premium p-6 space-y-4 sticky top-24">
              <h3 className="font-bold text-ink-900">Order Summary</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-ink-900 text-sm font-medium truncate">{item.name}</p>
                      <p className="text-ink-500 text-xs">×{item.quantity}</p>
                    </div>
                    <span className="text-ink-900 text-sm font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-ink-900/[0.06] pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span><span className="text-ink-900">₹{sub}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between" style={{ color: '#15803d' }}>
                    <span>Coupon discount</span><span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-600">
                  <span className="flex items-center gap-1.5"><Bike size={13} /> Delivery{area ? ` (${area})` : ''}</span>
                  <span style={coupon?.freeDelivery ? { color: '#15803d' } : {}} className={!coupon?.freeDelivery ? 'text-ink-900' : ''}>
                    {coupon?.freeDelivery ? 'FREE' : `₹${DELIVERY}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base text-ink-900 pt-2 border-t border-ink-900/[0.06]">
                  <span>Total</span><span style={{ color: '#b91c1c' }}>₹{total}</span>
                </div>
              </div>

              <div className="bg-cream-100 rounded-xl p-3 text-xs text-ink-600 flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#d97706' }} />
                Cash on Delivery. Please keep exact change ready.
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMapPicker && (
        <LocationPicker
          initial={pinnedLocation ? [pinnedLocation.lat, pinnedLocation.lng] : null}
          onConfirm={handleLocationConfirm}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
