import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';

const StickyOrderButton = () => {
  const [visible, setVisible] = useState(false);
  const { totalItems, subtotal } = useCartStore();
  const location = useLocation();
  const count = totalItems();
  const sub = subtotal();

  // Hide on checkout/menu pages where cart is always accessible
  const isHidden = ['/checkout'].includes(location.pathname);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (isHidden || count === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-40 md:hidden"
        >
          <Link
            to="/checkout"
            className="flex items-center gap-2 text-white
                       text-xs font-semibold px-4 py-2.5 rounded-full shadow-orange-glow
                       active:scale-95 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #ff5a00 0%, #ea580c 100%)' }}
          >
            <ShoppingBag size={15} />
            <span>{count} {count > 1 ? 'items' : 'item'}</span>
            <span className="w-px h-3.5 bg-white/20" />
            <span>₹{sub}</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyOrderButton;
