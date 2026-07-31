import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import useNotificationStore from '../../store/notificationStore';
import cloudinaryAssets from '../../cloudinary-assets.json';

const dfcLogo = cloudinaryAssets['dfc-logo.png'];

const NAV_LINKS = [
  { to: '/',        label: 'Home' },
  { to: '/menu',    label: 'Menu' },
  { to: '/offers',  label: 'Offers' },
  { to: '/track',   label: 'Track Order' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, openCart } = useCartStore();
  const unseenCancelledOrders = useNotificationStore((s) => s.unseenCancelledOrders);
  const hasNotification = unseenCancelledOrders.length > 0;
  const location = useLocation();
  const count = totalItems();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open to prevent double scroll/clash
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-white/90 backdrop-blur-lg border-b border-ink-900/[0.06] shadow-soft' : 'bg-white/40 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo — official DFC mark */}
          <Link to="/" className="flex items-center gap-2.5 group select-none">
            <img src={dfcLogo} alt="DFC — Devi Food Court" className="w-9 h-9 object-contain drop-shadow-sm" />
            <span className="font-display text-lg tracking-wider text-black font-bold uppercase hidden sm:inline nav-brand">
              Devi Food Court
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150
                  ${isActive ? 'bg-brand-50' : 'text-stone-700 hover:text-black hover:bg-black/[0.05]'}`
                }
                style={({ isActive }) => isActive ? { color: '#ff5a00' } : {}}>
                {label}
                {to === '/track' && hasNotification && (
                  <span className="absolute top-1 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Cart + mobile trigger with safe 44x44px touch targets */}
          <div className="flex items-center gap-3">
            <button onClick={openCart}
              className="relative w-11 h-11 rounded-full bg-stone-900 hover:bg-black text-white transition-all border border-stone-700/80 shadow-md flex items-center justify-center"
              aria-label="Shopping Cart">
              <ShoppingCart size={19} className="text-white" />
              {count > 0 && (
                <motion.span key={count}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center animate-cart-bounce"
                  style={{ background: 'linear-gradient(135deg, #ff5a00, #ea580c)' }}>
                  {count > 9 ? '9+' : count}
                </motion.span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-11 h-11 rounded-full bg-stone-900 hover:bg-black text-white transition-all border border-stone-700/80 shadow-md flex items-center justify-center"
              aria-label="Toggle Menu">
              {mobileOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#161413] border-b border-white/10 shadow-soft-lg md:hidden">
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) =>
                    `relative block px-4 py-3 rounded-xl text-base font-semibold transition-all
                    ${isActive ? 'bg-brand-500/15 font-bold' : 'hover:bg-white/10'}`
                  }
                  style={({ isActive }) => isActive ? { color: '#ff5a00' } : { color: '#ffffff' }}>
                  <span className="flex items-center gap-2" style={{ color: 'inherit' }}>
                    {label}
                    {to === '/track' && hasNotification && (
                      <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unseenCancelledOrders.length}
                      </span>
                    )}
                  </span>
                </NavLink>
              ))}
              <div className="pt-2 pb-1">
                <button onClick={openCart} className="btn-primary w-full justify-center">
                  <ShoppingCart size={18} /> View Cart {count > 0 && `(${count})`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
