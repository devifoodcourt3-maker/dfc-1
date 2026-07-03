import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import useSettingsStore from '../../store/settingsStore';

const CartDrawer = () => {
  const { items, isCartOpen, closeCart, updateQty, removeItem, subtotal } = useCartStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  const total = subtotal();
  const baseCharge = settings?.deliveryCharge ?? 40;
  const freeAbove = settings?.freeDeliveryAbove ?? 0;
  const autoFreeDelivery = freeAbove > 0 && total >= freeAbove;
  const DELIVERY = (total > 0 && !autoFreeDelivery) ? baseCharge : 0;

  const goCheckout = () => { closeCart(); navigate('/checkout'); };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-ink-900/[0.06] z-50 flex flex-col shadow-soft-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-900/[0.06]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={22} style={{ color: '#d97706' }} />
                <h2 className="font-bold text-ink-900 text-lg">Your Cart</h2>
                {items.length > 0 && (
                  <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #b91c1c, #d97706)' }}>
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-ink-900/[0.05] rounded-full transition-colors text-ink-500 hover:text-ink-900">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="text-6xl mb-5">🛒</div>
                  <p className="text-ink-700 font-semibold">Your cart is empty</p>
                  <p className="text-ink-500 text-sm mt-2">Add some delicious items from our menu</p>
                  <button onClick={closeCart} className="mt-6 btn-primary text-sm px-5 py-2.5">
                    Browse Menu
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div key={item._id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-4 bg-cream-100 rounded-xl p-3 border border-ink-900/[0.04]"
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-2xl flex-shrink-0 border border-ink-900/[0.06]">🍽️</div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink-900 text-sm truncate">{item.name}</p>
                        <p className="font-bold text-sm mt-0.5" style={{ color: '#b91c1c' }}>₹{item.price * item.quantity}</p>
                        <p className="text-ink-500 text-xs">₹{item.price} each</p>
                      </div>

                      <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-ink-900/[0.06]">
                        <button onClick={() => updateQty(item._id, item.quantity - 1)}
                          className="w-9 h-9 sm:w-7 sm:h-7 rounded-full hover:bg-red-50 text-ink-500 hover:text-red-600 flex items-center justify-center transition-all"
                          aria-label="Decrease Quantity">
                          {item.quantity === 1 ? <Trash2 size={13} className="text-red-500" /> : <Minus size={13} />}
                        </button>
                        <span className="text-ink-900 font-bold text-sm w-7 sm:w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item._id, item.quantity + 1)}
                          className="w-9 h-9 sm:w-7 sm:h-7 rounded-full hover:bg-orange-50 text-ink-500 hover:text-brand-600 flex items-center justify-center transition-all"
                          aria-label="Increase Quantity">
                          <Plus size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Summary + Checkout */}
            {items.length > 0 && (
              <div className="border-t border-ink-900/[0.06] px-6 py-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span><span className="text-ink-900 font-medium">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Delivery charge</span>
                    <span className="text-ink-900 font-medium">₹{DELIVERY}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-ink-900 pt-2 border-t border-ink-900/[0.06]">
                    <span>Total</span><span style={{ color: '#b91c1c' }}>₹{total + DELIVERY}</span>
                  </div>
                </div>
                <button onClick={goCheckout} className="btn-primary w-full justify-center text-base py-3.5">
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
