import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PhoneCall } from 'lucide-react';
import useSettingsStore from '../../store/settingsStore';

const PromoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { restaurant } = useSettingsStore();

  // Primary restaurant phone number (defaults to poster number 9032628395)
  const phoneDisplay = restaurant?.phone || '9032628395';
  // Strip spaces, dashes, and extra formatting for valid tel: URI protocol
  const telURI = `tel:${phoneDisplay.replace(/[^0-9+]/g, '')}`;

  useEffect(() => {
    // Show popup on open if not dismissed in current session
    const isDismissed = sessionStorage.getItem('dfc_promo_dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('dfc_promo_dismissed', 'true');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 14, stiffness: 300 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/50 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
          >
            {/* Cancel / Close Symbol */}
            <button
              onClick={handleClose}
              aria-label="Close promotion popup"
              className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-black/70 text-white hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20 shadow-lg flex items-center justify-center group cursor-pointer"
            >
              <X size={22} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {/* Poster Image Container - Clicking image opens phone call */}
            <a
              href={telURI}
              title={`Call Restaurant: ${phoneDisplay}`}
              className="relative bg-amber-50/5 overflow-y-auto max-h-[75vh] flex items-center justify-center block cursor-pointer group"
            >
              <img
                src="/promo-popup.jpg"
                alt="Devi Food Court Special Offer Pack - Tap to Call"
                className="w-full h-auto object-contain block select-none group-hover:opacity-95 transition-opacity"
                loading="eager"
              />
            </a>

            {/* Bottom Action Footer */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-zinc-950 via-amber-950/40 to-zinc-950 border-t border-amber-500/20 flex items-center justify-center">
              <a
                href={telURI}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-base shadow-lg shadow-amber-900/50 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer border border-amber-400/30"
              >
                <PhoneCall size={20} className="animate-pulse" />
                <span>Call Restaurant: {phoneDisplay}</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PromoModal;
