import { useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import StickyOrderButton from './components/shared/StickyOrderButton';
import PromoModal from './components/shared/PromoModal';
import useNotificationStore from './store/notificationStore';
import useSettingsStore from './store/settingsStore';

import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import OffersPage from './pages/OffersPage';
import TrackOrderPage from './pages/TrackOrderPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';

// Fast, GPU-accelerated page transition variants for 60fps smooth navigation
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
  },
};

// Wrap each page in the animated container
const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="smooth-scroll-page"
    style={{ willChange: 'opacity, transform' }}
  >
    {children}
  </motion.div>
);

// Scroll smoothly to top on page navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// Inner layout — AnimatePresence popLayout for zero-delay instant switching
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/menu"     element={<PageWrapper><MenuPage /></PageWrapper>} />
        <Route path="/offers"   element={<PageWrapper><OffersPage /></PageWrapper>} />
        <Route path="/track"    element={<PageWrapper><TrackOrderPage /></PageWrapper>} />
        <Route path="/contact"  element={<PageWrapper><ContactPage /></PageWrapper>} />
        <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />
        {/* Catch-all */}
        <Route path="*"         element={<PageWrapper><HomePage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const Layout = () => {
  const cartIconRef = useRef(null);
  const checkForUpdates = useNotificationStore((s) => s.checkForUpdates);
  const loadSettings = useSettingsStore((s) => s.load);

  // Expose cart icon ref globally for fly-to-cart
  useEffect(() => {
    const cartEl = document.querySelector('[data-cart-icon]');
    if (cartEl) cartIconRef.current = cartEl;
  }, []);

  // Load settings once — store will poll every 60s so admin changes auto-reflect
  useEffect(() => { loadSettings(); }, []);

  // Check once on load whether the customer has an unseen order cancellation
  useEffect(() => { checkForUpdates(); }, []);

  return (
    <>
      <ScrollToTop />
      <Navbar cartRef={cartIconRef} />
      <CartDrawer />
      <StickyOrderButton />
      <PromoModal />

      <main style={{ contain: 'layout' }}>
        <AnimatedRoutes />
      </main>

      <Footer />

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1a1816',
            color: '#fffdfb',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#d97706', secondary: '#fff' } },
          duration: 2500,
        }}
      />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
