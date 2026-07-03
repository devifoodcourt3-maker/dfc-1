import { useRef, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import { triggerFlyToCart } from '../../utils/flyToCart';
import toast from 'react-hot-toast';

const SPICE_ICONS = { hot: '🌶️', 'extra-hot': '🌶️🌶️', medium: '🌶', mild: '' };

const MenuCard = ({ item, cartRef }) => {
  const imgRef = useRef(null);
  const [isAdding, setIsAdding] = useState(false);
  const { items, addItem, updateQty } = useCartStore();
  const cartItem = items.find((i) => i._id === item._id);
  const qty = cartItem?.quantity || 0;
  const soldOut = item.isAvailable === false;

  const handleAdd = () => {
    if (isAdding || soldOut) return;
    setIsAdding(true);
    triggerFlyToCart(imgRef.current, cartRef?.current, () => setIsAdding(false));
    addItem(item);
    toast.success(`${item.name} added!`, {
      duration: 1500, icon: '✓',
      style: { background: '#1a1816', color: '#fff', border: '1px solid rgba(217,119,6,0.3)', fontSize: '14px' },
    });
  };

  const discount = item.mrp && item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-2xl overflow-hidden flex flex-col card-hover bg-white border shadow-soft
        ${soldOut ? 'opacity-75' : ''}`}
      style={{ borderColor: 'rgba(255, 90, 0, 0.12)', willChange: 'transform' }}
      whileHover={soldOut ? {} : { boxShadow: '0 12px 32px rgba(255,90,0,0.18)', borderColor: 'rgba(255,90,0,0.45)' }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
        {item.imageUrl ? (
          <img ref={imgRef} src={item.imageUrl} alt={item.name} loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-600
              ${soldOut ? 'grayscale-[60%]' : 'group-hover:scale-105'}`} />
        ) : (
          <div ref={imgRef} className="w-full h-full flex items-center justify-center text-5xl bg-cream-100">
            🍽️
          </div>
        )}

        {/* Sold Out overlay */}
        {soldOut && (
          <div className="absolute inset-0 bg-ink-900/35 flex items-center justify-center">
            <span className="bg-white text-ink-900 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-soft-lg -rotate-6">
              Sold Out
            </span>
          </div>
        )}

        {/* Veg/Non-veg dot */}
        <div className="absolute top-2.5 left-2.5">
          <div className="w-5 h-5 rounded border-2 flex items-center justify-center bg-white/95 shadow-sm"
            style={{ borderColor: item.isVeg ? '#16a34a' : '#dc2626' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.isVeg ? '#16a34a' : '#dc2626' }} />
          </div>
        </div>

        {/* Right badges */}
        {!soldOut && (
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
            {item.isBestSeller && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #ff5a00, #fb842f)' }}>⭐ Best</span>
            )}
            {discount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #ea580c, #ec474a)' }}>{discount}% OFF</span>
            )}
          </div>
        )}

        {!soldOut && SPICE_ICONS[item.spiceLevel] && (
          <div className="absolute bottom-2.5 left-2.5 text-sm bg-[#161413]/90 rounded-full px-1.5 py-0.5 shadow-sm">{SPICE_ICONS[item.spiceLevel]}</div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-ink-900 text-xs sm:text-sm leading-snug mb-1 line-clamp-1">{item.name}</h3>
        {item.description && (
          <p className="text-ink-500 text-[10px] sm:text-xs leading-relaxed line-clamp-2 mb-2">{item.description}</p>
        )}
        {!soldOut && item.prepTimeMinutes && (
          <p className="text-ink-400 text-[10px] sm:text-xs mb-2">⏱ {item.prepTimeMinutes} min</p>
        )}
        {soldOut && (
          <p className="text-red-500 text-[10px] sm:text-xs font-semibold mb-2">Unavailable</p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className={`font-bold text-sm sm:text-base ${soldOut ? 'text-ink-400' : 'text-ink-900'}`}>₹{item.price}</span>
            {item.mrp && item.mrp > item.price && (
              <span className="text-ink-400 text-[10px] sm:text-xs line-through ml-1.5 sm:ml-2">₹{item.mrp}</span>
            )}
          </div>

          {soldOut ? (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-ink-100 text-ink-400 cursor-not-allowed">
              Sold Out
            </span>
          ) : qty === 0 ? (
            <button onClick={handleAdd} disabled={isAdding}
              className="flex items-center gap-1 text-xs sm:text-sm font-bold px-4 py-2.5 sm:px-4 sm:py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-60 text-white"
              style={{ background: 'linear-gradient(135deg, #ff5a00, #ea580c)', boxShadow: '0 4px 14px rgba(255,90,0,0.25)' }}>
              <Plus size={13} /> Add
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full p-1 bg-cream-200 border border-white/10">
              <button onClick={() => updateQty(item._id, qty - 1)}
                className="w-9 h-9 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all text-ink-700 hover:bg-white"
                aria-label="Decrease Quantity">
                <Minus size={12} />
              </button>
              <span className="text-ink-900 font-bold text-xs sm:text-sm w-5 sm:w-4 text-center">{qty}</span>
              <button onClick={handleAdd}
                className="w-9 h-9 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all text-white active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ff5a00, #ea580c)' }}
                aria-label="Increase Quantity">
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MenuCard;
