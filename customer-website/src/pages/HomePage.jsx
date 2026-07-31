import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/shared/SEO';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Star, Clock, Bike, ShieldCheck,
  Phone, MapPin, ChevronRight, Flame, Sparkles, Navigation,
  Zap, Quote, Award, Utensils, ChefHat, Cookie, Pizza, Soup,
  Gift, Tag, Copy, Check,
} from 'lucide-react';
import { getMenu, getOffers } from '../services/api';
import useSettingsStore from '../store/settingsStore';
import MenuCard from '../components/menu/MenuCard';
import toast from 'react-hot-toast';
import cloudinaryAssets from '../cloudinary-assets.json';
import heroBiryaniNoBg from '../assets/hero-biryani-nobg.jpg';
import popularCategoriesBg from '../assets/popular-categories-bg.jpg';
import catPizza from '../assets/cat-pizza.png';

const dfcLogo = cloudinaryAssets['dfc-logo.png'];
const storefrontPink = cloudinaryAssets['storefront-pink.jpg'];
const storefrontBlue = cloudinaryAssets['storefront-blue.jpg'];
const catChicken = cloudinaryAssets['cat-chicken.png'];
const catBiryani = cloudinaryAssets['cat-biryani.png'];
const catCurries = cloudinaryAssets['cat-curries.png'];
const catTandoori = cloudinaryAssets['cat-tandoori.png'];
const catSweets = cloudinaryAssets['cat-sweets.png'];
const catDrinks = cloudinaryAssets['cat-drinks.png'];
const whyFreshly = cloudinaryAssets['why-freshly-cooked.png'];
const whyDelivery = cloudinaryAssets['why-fast-delivery.png'];
const whyTracking = cloudinaryAssets['why-live-tracking.png'];
const whySafety = cloudinaryAssets['why-food-safety.png'];
const heroBiryani = cloudinaryAssets['hero-biryani.jpg'];
const heroRockyBg = cloudinaryAssets['hero-rocky-bg.png'];
const featuredDishesBg = cloudinaryAssets['featured-dishes-bg.png'];
const menuDoodleBg = cloudinaryAssets['menu-doodle-bg.png'];

// ── Canvas-based Black Background Remover (deferred to idle time) ────────────────
const TransparentImage = ({ src, alt, className, style, threshold = 22 }) => {
  const [processedSrc, setProcessedSrc] = useState(null);

  useEffect(() => {
    if (!src) return;
    // Defer expensive canvas pixel work to idle time so it never blocks paint
    const scheduleWork = (callback) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 100);
      }
    };

    scheduleWork(() => {
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
            const brightness = Math.max(data[i], data[i + 1], data[i + 2]);
            if (brightness < threshold) {
              data[i + 3] = 0;
            } else if (brightness < threshold + 12) {
              data[i + 3] = Math.round(((brightness - threshold) / 12) * 255);
            }
          }
          ctx.putImageData(imgData, 0, 0);
          setProcessedSrc(canvas.toDataURL());
        } catch (err) {
          // Silently keep the original src on CORS errors
          setProcessedSrc(src);
        }
      };
      img.onerror = () => {
        setProcessedSrc(src);
      };
    });
  }, [src, threshold]);

  return (
    <img
      src={processedSrc ?? src}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: processedSrc ? 1 : 0,
        transition: 'opacity 0.25s ease-in-out',
      }}
    />
  );
};

// ── Animated section wrapper ───────────────────────────────────────────────
const Section = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section ref={ref}
      // Opacity-only animation: runs purely on compositor thread, zero layout cost
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
      className={className}
    >{children}</motion.section>
  );
};

// ── Animated counter number ────────────────────────────────────────────────
const Counter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target);
    const step = num / 40;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, num);
      setVal(Number.isInteger(num) ? Math.round(cur) : parseFloat(cur.toFixed(1)));
      if (cur >= num) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ── Letter-by-letter "moving type" headline reveal ─────────────────────────
const TypeReveal = ({ text, className = '', delay = 0 }) => (
  <span className={className} aria-label={text}>
    {text.split('').map((ch, i) => (
      <motion.span key={i} className="inline-block"
        initial={{ opacity: 0, y: 18, rotateX: -40 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: delay + i * 0.045, duration: 0.45, ease: 'easeOut' }}>
        {ch === ' ' ? '\u00A0' : ch}
      </motion.span>
    ))}
  </span>
);

const Stars = ({ count = 5, size = 13 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={size} className={i < count ? 'fill-amber-400 text-amber-400' : 'text-ink-200'} />
    ))}
  </div>
);

const REVIEWS = [
  { name: 'Priya Sharma', rating: 5, text: 'Best biryani in Tagarapuvalasa! Delivered piping hot. The chicken was so tender and the aroma was unreal.', time: '2 days ago' },
  { name: 'Ravi Kumar',   rating: 5, text: 'Butter Chicken + Garlic Naan — restaurant quality at home. Quick delivery, great packaging!', time: '1 week ago' },
  { name: 'Ananya Reddy', rating: 5, text: 'Paneer Tikka was absolutely divine. Perfectly spiced and grilled. My whole family loved it!', time: '3 days ago' },
  { name: 'Kiran Babu',   rating: 4, text: 'Great food, very fresh ingredients. The Mango Lassi was thick and authentic. On-time delivery.', time: '5 days ago' },
];

const WHY_US = [
  { icon: ChefHat, title: 'Freshly Cooked', desc: 'Every dish is prepared fresh to order using authentic recipes and premium spices.', color: '#ff5a00' },
  { icon: Zap, title: 'Fast Delivery',   desc: 'Hot food at your door in 30–45 min. We never compromise on speed or quality.', color: '#ea580c' },
  { icon: Navigation, title: 'Live Tracking',   desc: 'Watch your order move from kitchen to doorstep in real-time.', color: '#fb923c' },
  { icon: ShieldCheck, title: 'Food Safety',     desc: 'Prepared in a hygienic, certified kitchen by experienced chefs every single day.', color: '#c2410c' },
];

const MARQUEE_ITEMS = [
  'SIGNATURE DUM BIRYANI', 'AUTHENTIC CURRIES', 'TANDOORI GRILLS', 'HERITAGE SWEETS',
  'PREMIUM BAKERY', 'FRESH MOCKTAILS', 'MOUTH-WATERING STARTERS', 'EXOTIC KEBABS',
];

const TYPE_CONFIG = {
  combo: { 
    icon: Gift, 
    label: 'Combo Deal', 
    glow: 'rgba(234, 88, 12, 0.25)',
    accent: '#ea580c',
    badgeBg: 'rgba(234, 88, 12, 0.2)'
  },
  coupon: { 
    icon: Tag, 
    label: 'Coupon', 
    glow: 'rgba(255, 90, 0, 0.3)',
    accent: '#ff5a00',
    badgeBg: 'rgba(255, 90, 0, 0.2)'
  },
  promo: { 
    icon: Zap, 
    label: 'Promotion', 
    glow: 'rgba(217, 119, 6, 0.25)',
    accent: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.2)'
  },
  seasonal: { 
    icon: Gift, 
    label: 'Special', 
    glow: 'rgba(154, 52, 18, 0.25)',
    accent: '#9a3412',
    badgeBg: 'rgba(154, 52, 18, 0.2)'
  },
};

const HomeOfferCard = ({ offer, index }) => {
  const [copied, setCopied] = useState(false);
  const config = TYPE_CONFIG[offer.type] || TYPE_CONFIG.promo;
  const Icon = config.icon;

  const copyCode = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const validUntil = offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('en-IN') : null;
  const discountLabel = offer.discountType === 'percent'
    ? `${offer.discountValue}% OFF`
    : offer.discountType === 'flat'
      ? `₹${offer.discountValue} OFF`
      : 'FREE DELIVERY';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.93 }} 
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }} 
      transition={{ delay: index * 0.12 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl text-white flex flex-col justify-between"
      style={{ 
        background: 'linear-gradient(180deg, rgba(28, 25, 23, 0.75) 0%, rgba(20, 18, 17, 0.85) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 15px ${config.glow}`,
      }}
    >
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }} />

      {/* Decorative Circles/Glows */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-20 blur-xl pointer-events-none" style={{ backgroundColor: config.accent }} />
      <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none" style={{ backgroundColor: config.accent }} />

      {/* Main Details (Top Section) */}
      <div className="p-6 pb-4 space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow" style={{ backgroundColor: config.badgeBg }}>
              <Icon size={16} style={{ color: config.accent }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: config.accent }}>{config.label}</span>
          </div>
          <span className="text-2xl font-black" style={{ color: config.accent }}>{discountLabel}</span>
        </div>

        <div>
          <h3 className="font-bold text-white text-xl leading-tight mb-1">{offer.title}</h3>
          {offer.description && <p className="text-ink-600 text-sm leading-relaxed">{offer.description}</p>}
        </div>

        {offer.minOrderValue > 0 && (
          <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white/5 text-ink-700 font-medium">
            Min. order: ₹{offer.minOrderValue}
          </div>
        )}
      </div>

      {/* Ticket Tear Perforated Line with side notches */}
      <div className="relative my-2">
        {/* Left Semi-circle notch */}
        <div className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#0c0a09] border border-stone-850 z-20" style={{ boxShadow: 'inset -3px 0 5px rgba(0,0,0,0.6)' }} />
        
        {/* Right Semi-circle notch */}
        <div className="absolute right-[-9px] top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#0c0a09] border border-stone-850 z-20" style={{ boxShadow: 'inset 3px 0 5px rgba(0,0,0,0.6)' }} />
        
        {/* Perforated divider line */}
        <div className="mx-3 border-t border-dashed border-stone-800" />
      </div>

      {/* Code & Expiry (Bottom Section) */}
      <div className="p-6 pt-4 space-y-3 bg-cream-200/20">
        {offer.code && (
          <button onClick={copyCode}
            className="w-full flex items-center justify-between bg-cream-100 border border-white/5 hover:border-white/10 rounded-xl px-4 py-2.5 transition-all group active:scale-98">
            <span className="font-mono font-bold tracking-widest text-sm text-stone-200 group-hover:text-white">{offer.code}</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95"
                  style={{ color: copied ? '#22c55e' : config.accent, backgroundColor: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' }}>
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </span>
          </button>
        )}

        {validUntil && (
          <div className="flex items-center justify-between text-[11px] text-ink-500">
            <span>Valid till</span>
            <span className="font-semibold text-ink-700">{validUntil}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const HomePage = () => {
  const cartRef = useRef(null);
  const [featured, setFeatured] = useState([]);
  const [offers, setOffers] = useState([]);

  const { settings, restaurant } = useSettingsStore();
  const isOpen = settings?.isOpen ?? null; // null = still loading

  useEffect(() => {
    const cartEl = document.querySelector('[data-cart-icon]');
    if (cartEl) cartRef.current = cartEl;
    getMenu().then((d) => setFeatured(d.items.filter((i) => i.isFeatured && i.isAvailable).slice(0, 4))).catch(() => {});
    getOffers().then((d) => setOffers(d.offers.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream-50">
      <SEO
        title="DFC Restaurant | Best Restaurant in Tagarapuvalasa & Bheemili"
        description="DFC Restaurant (Devi Food Court) — The best restaurant in Tagarapuvalasa & Bheemili. Order authentic Dum Biryani, Tandoori, Curries, Sweets & Mocktails online for fast home delivery."
        keywords="DFC, DFC Restaurant, DFC Thagarapuvalasa, DFC Tagarapuvalasa, best restaurant, best restaurant in tagarapuvalasa, best restaurant in bheemili, food delivery Tagarapuvalasa"
        canonical="https://dfcthagarapuvalasa.in/"
      />

      {/* ── HERO — dark, premium, Biryani-led brand intro ─────────────────────────── */}
      
      <div className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroRockyBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>

        {/* Dark overlay — slightly lighter so stone detail comes through */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'rgba(6, 4, 3, 0.62)' }} />

        {/* Rocky grain detail cross-hatch overlay */}
        <div className="rocky-detail-overlay" />

        {/* Subtle orange dot pattern on top */}
        <div className="absolute inset-0 pointer-events-none opacity-15"
             style={{ backgroundImage: 'radial-gradient(rgba(255,90,0,0.25) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Vignette edges — darkens corners to keep focus center */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />

        {/* Soft ambient orange color blobs — static radial gradients, hidden on mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          <div className="orb-orange absolute w-[560px] h-[560px] -top-40 -right-40 rounded-full" />
          <div className="orb-red absolute w-[460px] h-[460px] -bottom-32 -left-32 rounded-full" />
          <div className="orb-orange absolute w-[320px] h-[320px] top-1/3 left-1/3 rounded-full" />
        </div>

        {/* Desktop Hero Grid (Visible on Desktop/Lg screens) */}
        <div className="hidden lg:block relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Brand Logo & Live Badge */}
              <div className="flex items-center gap-3">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }} className="flex-shrink-0">
                  <img src={dfcLogo} alt="DFC Logo" className="w-32 h-32 object-contain animate-logo-breathe" />
                </motion.div>
                
                {isOpen !== null && (
                  <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 bg-ink-100/20 border border-white/10 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-soft backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: isOpen ? '#22c55e' : '#ef4444' }} />
                    <span style={{ color: isOpen ? '#faf8f6' : '#ef4444' }}>
                      {isOpen ? 'Now accepting online orders' : 'Currently closed — check back soon!'}
                    </span>
                  </motion.span>
                )}
              </div>

              {/* Bold Headline matching Mockup Style */}
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl leading-[1.05] tracking-wide text-white">
                The Delicious Food<br />For Your <span className="gradient-text-warm block sm:inline">Friends &amp; Family</span>
              </h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
                className="font-serif italic text-ink-800 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
                Authentic chicken &amp; veg Biryani cooked to perfection, mouth-watering tandoori, 
                heritage sweets, bakery items &amp; mocktails — crafted by expert chefs.
              </motion.p>

              {/* Action Buttons */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
                className="flex flex-row items-center gap-4 pt-2">
                <Link to="/menu" className="btn-primary text-center justify-center text-xs sm:text-base px-6 py-3 sm:px-8 sm:py-3.5 shadow-orange-glow">
                  View Our Menu <ArrowRight size={16} />
                </Link>
                <Link to="/offers" className="btn-outline text-center justify-center text-xs sm:text-base px-6 py-3 sm:px-8 sm:py-3.5 border-white/10 hover:border-white/20 text-white">
                  Today's Offers
                </Link>
              </motion.div>

              {/* Stats */}
              <div className="flex items-center gap-8 sm:gap-12 pt-6 border-t border-white/5">
                {[
                  { target: 500, suffix: '+',   label: 'Happy Customers' },
                  { target: 4.9, suffix: '★',   label: 'Avg Rating' },
                  { target: 30,  suffix: 'min', label: 'Avg Delivery' },
                ].map(({ target, suffix, label }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.15 }}>
                    <p className="text-2xl font-display text-white tracking-wide">
                      <Counter target={target} suffix={suffix} />
                    </p>
                    <p className="text-ink-600 text-xs mt-0.5 uppercase tracking-wider">{label}</p>
                  </motion.div>
                ))}
              </div>

            </div>

            {/* Right Column: Biryani Outlet Image with Smoke Animation */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative w-full">
              <motion.div
                 initial={{ opacity: 0, scale: 0.88, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 transition={{ duration: 1.3, ease: 'easeOut' }}
                 className="relative w-full max-w-[480px] md:max-w-[550px] h-[520px] md:h-[600px] flex items-end justify-center"
               >
                 
                 {/* Main Biryani Image — dynamically removes background */}
                 <motion.div
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                   className="relative z-10 w-full h-full flex items-end justify-center"
                 >
                   <TransparentImage
                     src={heroBiryaniNoBg}
                     alt="Signature Dum Biryani"
                     className="w-full h-full object-contain"
                     style={{
                       filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.35)) drop-shadow(0 0 60px rgba(0,0,0,0.85))',
                     }}
                     threshold={5}
                   />
                 </motion.div>

                 {/* Smoke puff container — 4 puffs (reduced from 7) for better GPU performance */}
                 <div className="smoke-container z-20">
                   <div className="smoke-puff" />
                   <div className="smoke-puff" />
                   <div className="smoke-puff" />
                   <div className="smoke-puff" />
                 </div>

                 {/* Floating Badge */}
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 1.4 }}
                   className="absolute bottom-4 left-4 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center gap-3 w-60 text-left z-20"
                   style={{ background: 'rgba(22,20,19,0.88)' }}
                 >
                   <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-xl flex-shrink-0">
                     🔥
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-white">Hyd Dum Biryani</h3>
                     <p className="text-xs text-ink-600 mt-0.5">Chef's Signature Blend</p>
                     <div className="flex items-center justify-between mt-1.5">
                       <span className="text-xs font-bold" style={{ color: '#ff5a00' }}>₹240</span>
                       <Link to="/menu?cat=Biryani" className="text-[10px] text-white font-semibold px-2.5 py-1 rounded-full transition-all"
                         style={{ background: '#ff5a00' }}>
                         Order Now
                       </Link>
                     </div>
                   </div>
                 </motion.div>

              </motion.div>
            </div>

          </div>
        </div>

        {/* ══ MOBILE HERO BLOCK ══════════════════════════════════════════════
            Matches screenshot: full-viewport hero with large biryani image    */}
        <div className="block lg:hidden relative z-10 w-full pt-20 pb-0 overflow-hidden">

          {/* Status badge — full-width pill */}
          {isOpen !== null && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-3 px-4 text-left">
              <span className="inline-flex items-center gap-1 bg-black/50 border border-white/10 text-[10px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: isOpen ? '#22c55e' : '#ef4444' }} />
                <span style={{ color: isOpen ? '#faf8f6' : '#ef4444' }}>
                  {isOpen ? 'Now accepting online orders' : 'Currently closed — check back soon!'}
                </span>
              </span>
            </motion.div>
          )}

          {/* Hero content area — heading on left, giant biryani on right */}
          <div className="relative min-h-[290px] px-4">

            {/* Left content column */}
            <div className="relative z-10 pr-[160px]">
              {/* DFC Logo */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                className="mb-2">
                <img src={dfcLogo} alt="DFC Logo" className="w-16 h-16 object-contain animate-logo-breathe" />
              </motion.div>

              {/* Hero Heading */}
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="font-display text-[26px] leading-[1.08] tracking-wide text-white uppercase">
                The Delicious Food<br />For Your<br />
                <span className="gradient-text-warm">Friends &amp; Family</span>
              </motion.h1>
            </div>

            {/* Giant biryani image — absolute right, spanning full hero height */}
            <div className="absolute right-[-8px] top-[-20px] w-[205px] h-[310px] pointer-events-none z-10">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full h-full"
              >
                <TransparentImage
                  src={heroBiryaniNoBg}
                  alt="Signature Dum Biryani"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.35)) drop-shadow(0 0 40px rgba(0,0,0,0.9))',
                  }}
                  threshold={5}
                />
              </motion.div>
              {/* Smoke puffs */}
              <div className="smoke-container z-20 absolute inset-0">
                <div className="smoke-puff" />
                <div className="smoke-puff" />
                <div className="smoke-puff" />
              </div>
            </div>

            {/* Description — below heading, constrained to left of image */}
            <div className="relative z-10 mt-3 pr-[160px]">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="font-serif italic text-ink-700 text-[11px] leading-relaxed">
                Authentic chicken &amp; veg Biryani cooked to perfection, mouth-watering tandoori,
                heritage sweets, bakery items &amp; mocktails — crafted by expert chefs.
              </motion.p>
            </div>

            {/* CTA Button — full width, below image */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="relative z-20 mt-[100px]">
              <Link to="/menu"
                className="inline-flex items-center justify-center gap-2 font-bold text-sm text-white rounded-full px-8 py-3 shadow-orange-glow w-full"
                style={{ background: 'linear-gradient(135deg, #ff5a00 0%, #ea580c 100%)' }}>
                View Our Menu <ArrowRight size={15} />
              </Link>
            </motion.div>

          </div>{/* end hero content area */}

          {/* ── Stats + Today's Offers row ─────────────────────── */}
          <div className="mt-4 mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(22,20,19,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* "Today's Offers" label */}
            <div className="flex items-center justify-center gap-2 py-2.5 border-b border-white/5">
              <span className="w-6 h-px bg-brand-500/60" />
              <Sparkles size={10} className="text-brand-500" />
              <span className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-brand-500">Today's Offers</span>
              <Sparkles size={10} className="text-brand-500" />
              <span className="w-6 h-px bg-brand-500/60" />
            </div>

            {/* Stats row with icons */}
            <div className="grid grid-cols-3">
              {[
                { icon: '👥', target: 500, suffix: '+', label: 'HAPPY\nCUSTOMERS' },
                { icon: '⭐', target: 4.9, suffix: '★', label: 'AVG RATING' },
                { icon: '🕐', target: 30, suffix: 'MIN', label: 'AVG DELIVERY' },
              ].map(({ icon, target, suffix, label }, idx) => (
                <div key={label} className={`flex flex-col items-center py-3.5 gap-0.5 ${idx < 2 ? 'border-r border-white/5' : ''}`}>
                  <span className="text-lg mb-0.5">{icon}</span>
                  <p className="text-[17px] font-display text-white leading-none tracking-wide font-bold">
                    <Counter target={target} suffix={suffix} />
                  </p>
                  <p className="text-ink-500 text-[8px] font-bold uppercase tracking-wider text-center whitespace-pre-line leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Featured item card (Hyd Dum Biryani) ──────────────── */}
          <div className="mt-3 mb-5 mx-4 rounded-2xl flex items-center gap-3 px-3 py-3"
            style={{ background: 'rgba(22,20,19,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <img src={heroBiryani} alt="Hyd Dum Biryani" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Flame size={12} className="text-brand-500" />
                <span className="text-white font-bold text-[13px] truncate">Hyd Dum Biryani</span>
              </div>
              <p className="text-ink-500 text-[10px]">Chef's Signature Blend</p>
              <p className="font-bold text-[15px] mt-0.5" style={{ color: '#ff5a00' }}>₹240</p>
            </div>
            <Link to="/menu?cat=Biryani"
              className="flex-shrink-0 text-[11px] text-white font-bold px-4 py-2.5 rounded-full whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #ff5a00 0%, #ea580c 100%)' }}>
              Order Now
            </Link>
          </div>

        </div>{/* end mobile block */}

        {/* Marquee strip */}
        <div className="relative z-10 w-full mt-10 border-t border-b overflow-hidden py-3"
          style={{ borderColor: 'rgba(255, 90, 0, 0.15)', background: 'rgba(255, 90, 0, 0.03)' }}>
          <div className="marquee-inner">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-6 text-[10px] font-extrabold tracking-[0.2em] uppercase whitespace-nowrap text-ink-600">
                {item}
                <span className="text-[6px] text-brand-500/50 mx-2">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED DISHES ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <div className="relative w-full overflow-hidden border-t border-b"
          style={{
            backgroundImage: `url(${menuDoodleBg})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '750px',
            backgroundColor: '#0c0a09',
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
          {/* Subtle dark overlay for readability */}
          <div className="absolute inset-0 bg-black/42 pointer-events-none" />

          <Section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 justify-start">
                  <span className="w-8 h-px bg-brand-500"></span>
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-brand-500">Today's Picks</span>
                </div>
                <h2 className="section-heading mb-1 text-white">Featured Dishes</h2>
                <p className="section-sub text-ink-600">Our chef's recommendations, served fresh</p>
              </div>
              <Link to="/menu" className="flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#ff5a00' }}>
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {featured.map((item, i) => (
                <motion.div key={item._id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ willChange: 'opacity' }}
                >
                  <MenuCard item={item} cartRef={cartRef} />
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── CATEGORIES GRID ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden border-t border-b"
        style={{
          backgroundImage: `url(${popularCategoriesBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}>
        {/* Subtle dark overlay for readability */}
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />

        <Section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="text-center mb-12">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <span className="w-8 h-px bg-brand-500"></span>
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-brand-500">Explore Our Menu</span>
              <span className="w-8 h-px bg-brand-500"></span>
            </div>
            <h2 className="section-heading mb-3 text-white">Popular Categories</h2>
            <p className="section-sub mx-auto text-center text-ink-600">Browse our most loved sections from both outlets</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-5">
            {[
              { icon: ChefHat, label: 'Chicken',  cat: 'Starters', img: catChicken },
              { icon: Utensils, label: 'Biryani',  cat: 'Biryani',  img: catBiryani },
              { icon: Soup, label: 'Curries',  cat: 'Curries',  img: catCurries },
              { icon: Pizza, label: 'Pizza',  cat: 'Pizza',  img: catPizza },
              { icon: Flame, label: 'Tandoori', cat: 'Tandoori', img: catTandoori },
              { icon: Cookie, label: 'Sweets',   cat: 'Desserts', img: catSweets },
              { icon: Sparkles, label: 'Drinks',   cat: 'Drinks',   img: catDrinks },
            ].map(({ icon: Icon, label, cat, img }, i) => (
              <motion.div key={cat} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}>
                <Link to={`/menu?cat=${cat}`}
                  className="group flex flex-col items-center rounded-2xl overflow-hidden border border-brand-500/20 hover:border-brand-500/40 bg-[#0e0c0b] transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,90,0,0.15)] text-center w-full">
                  {/* Image */}
                  <div className="w-full aspect-[3/4] overflow-hidden relative">
                    <img
                      src={img}
                      alt={label}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Icon badge */}
                    <span
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full border border-brand-500/40 bg-black/60 backdrop-blur-[2px] text-brand-500"
                    >
                      <Icon size={14} />
                    </span>
                  </div>
                  {/* Label */}
                  <div className="w-full px-3 py-5 flex flex-col items-center justify-center">
                    <span
                      className="text-base font-bold tracking-wide text-white mb-1"
                    >
                      {label}
                    </span>
                    <p className="text-ink-600 text-xs font-medium group-hover:text-brand-500 transition-colors">Explore →</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── VISIT OUR OUTLETS ────────────────────────────────────────── */}
      <Section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <div className="text-center mb-12">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <span className="w-8 h-px bg-brand-500"></span>
            <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-brand-500">Come Say Hi</span>
            <span className="w-8 h-px bg-brand-500"></span>
          </div>
          <h2 className="section-heading mb-3 text-white">Visit Our <span className="gradient-text">Outlets</span></h2>
          <p className="section-sub font-serif italic text-lg mx-auto text-center text-ink-700">Two iconic locations, the same unforgettable taste</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              img: storefrontPink,
              label: 'Outlet One',
              tag: ['Sweets', 'Bakery', 'Mocktails'],
              accent: '#ff5a00',
              accentLight: 'rgba(255,90,0,0.05)',
              accentBorder: 'rgba(255,90,0,0.15)',
              mapUrl: 'https://maps.google.com/?q=Tagarapuvalasa,Visakhapatnam',
              address: 'Tagarapuvalasa, Visakhapatnam',
            },
            {
              img: storefrontBlue,
              label: 'Outlet Two',
              tag: ['Biryani', 'Tandoori', 'Pizza'],
              accent: '#ea580c',
              accentLight: 'rgba(234,88,12,0.05)',
              accentBorder: 'rgba(234,88,12,0.15)',
              mapUrl: 'https://maps.google.com/?q=Tagarapuvalasa,Visakhapatnam',
              address: 'Tagarapuvalasa, Visakhapatnam',
            },
          ].map(({ img, label, tag, accent, accentLight, accentBorder, mapUrl, address }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.55 }}
              className="group rounded-3xl overflow-hidden card-premium w-full"
              style={{ border: `1.5px solid ${accentBorder}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              {/* Image — responsive height so it does not dominate mobile viewports */}
              <div className="relative overflow-hidden h-[200px] xs:h-[260px] sm:h-[320px] md:h-[380px]" style={{ background: '#12100f' }}>
                <img
                  src={img}
                  alt={label}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover lg:object-contain transition-transform duration-700 group-hover:lg:scale-100 group-hover:scale-105"
                />
                {/* Subtle gradient overlay at bottom of image */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
                {/* Outlet badge top-left */}
                <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-white px-3 py-1.5 rounded-full backdrop-blur-sm"
                  style={{ background: `${accent}cc` }}>
                  {label}
                </span>
              </div>

              {/* Info strip */}
              <div className="px-6 py-5" style={{ background: accentLight }}>
                {/* Tag chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {tag.map((t) => (
                    <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: '#161413', color: accent, border: `1px solid ${accentBorder}` }}>
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  {/* Address */}
                  <div className="flex items-center gap-2 text-ink-600 text-sm">
                    <MapPin size={14} style={{ color: accent, flexShrink: 0 }} />
                    <span>{address}</span>
                  </div>
                  {/* Directions button */}
                  <a href={mapUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all duration-200 hover:opacity-80 active:scale-95 flex-shrink-0 ml-3"
                    style={{ background: accent, color: 'white', boxShadow: `0 4px 14px ${accent}50` }}>
                    <Navigation size={13} />
                    Directions
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────── */}
      <Section className="relative overflow-hidden py-24 border-y"
        style={{ background: 'linear-gradient(135deg, #0c0a09 0%, #161413 50%, #0c0a09 100%)', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <span className="w-8 h-px bg-brand-500"></span>
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-brand-500">Our Promise</span>
              <span className="w-8 h-px bg-brand-500"></span>
            </div>
            <h2 className="section-heading mb-3 text-white">Why Choose <span className="gradient-text">DFC?</span></h2>
            <p className="section-sub mx-auto text-center text-ink-600">We go above and beyond for every single order</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {WHY_US.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="card-premium rounded-2xl p-4 sm:p-7 text-center group hover:-translate-y-2 transition-all duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}>
                  <Icon size={24} className="sm:w-7 sm:h-7 w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base mb-1.5 sm:mb-2">{title}</h3>
                <p className="text-ink-600 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── OFFERS ──────────────────────────────────────────────────────── */}
      <Section className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 justify-start">
              <span className="w-8 h-px bg-brand-500"></span>
              <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-brand-500">Exclusive Deals</span>
            </div>
            <h2 className="section-heading mb-1 text-white">Today's Offers</h2>
            <p className="section-sub text-ink-600">Limited time deals, just for you</p>
          </div>
          {offers.length > 0 && (
            <Link to="/offers" className="flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#ff5a00' }}>
              All offers <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {offers.map((offer, i) => (
              <HomeOfferCard key={offer._id} offer={offer} index={i} />
            ))}
          </div>
        ) : (
          /* ── Empty state — shown when no offers are active ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl text-center py-16 px-8"
            style={{ background: 'linear-gradient(135deg, #161413 0%, #0c0a09 100%)', border: '1.5px dashed rgba(255,90,0,0.2)' }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,90,0,0.05) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,90,0,0.05) 0%, transparent 70%)' }} />

            <div className="relative">
              {/* Bell icon with pulse ring */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-20 h-20 rounded-full animate-ping opacity-20"
                  style={{ background: '#ff5a00' }} />
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-soft"
                  style={{ background: 'linear-gradient(135deg, #ff5a00, #ea580c)', boxShadow: '0 8px 24px rgba(255,90,0,0.3)' }}>
                  <Sparkles size={28} className="text-white" />
                </div>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-white tracking-wide mb-3">
                Exciting Offers <span style={{ color: '#ff5a00' }}>Coming Soon!</span>
              </h3>
              <p className="text-ink-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-6">
                We're cooking up some amazing deals just for you. Check back soon — great discounts on your favourite DFC dishes are on the way! 🎉
              </p>

              {/* Status pill */}
              <span className="inline-flex items-center gap-2 bg-[#1c1918] border border-white/10 rounded-full px-5 py-2 text-sm font-semibold shadow-soft"
                style={{ color: '#ff7a00' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff5a00' }} />
                No active offers right now
              </span>
            </div>
          </motion.div>
        )}
      </Section>

      {/* ── REVIEWS (scrolling ticker) ────────────────────────────────── */}
      <Section className="relative overflow-hidden py-12 lg:py-20 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#12100f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 text-center">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <span className="w-8 h-px bg-brand-500"></span>
            <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-brand-500">Testimonials</span>
            <span className="w-8 h-px bg-brand-500"></span>
          </div>
          <h2 className="section-heading mb-3 text-white">What Our Customers Say</h2>
          <div className="flex justify-center gap-1 mt-3">
            <Stars count={5} size={16} />
            <span className="text-ink-600 text-sm ml-2">4.9 · 500+ reviews</span>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #12100f, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #12100f, transparent)' }} />
          <div className="marquee-inner-slow">
            {[...REVIEWS, ...REVIEWS, ...REVIEWS, ...REVIEWS].map((review, i) => (
              <div key={i} className="rounded-2xl p-6 mx-3 space-y-3 flex-shrink-0 bg-[#161413] border border-white/5 shadow-soft" style={{ width: '300px' }}>
                <div className="flex justify-between items-center">
                  <Stars count={review.rating} />
                  <Quote size={16} className="text-brand-500/30" />
                </div>
                <p className="font-serif italic text-ink-700 text-sm leading-relaxed">"{review.text}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <p className="text-white font-semibold text-xs">{review.name}</p>
                  <p className="text-ink-600 text-[10px]">{review.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── DELIVERY INFO ────────────────────────────────────────────────── */}
      <Section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl card-premium">
          <div className="absolute -top-20 -left-20 w-64 h-64 orb-red rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 orb-orange rounded-full pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 lg:p-14 space-y-6">
              <span className="tag bg-[#1c1918] border border-white/10 uppercase tracking-wider" style={{ color: '#ff5a00' }}>Delivery Info</span>
              <h2 className="font-display text-3xl md:text-4xl tracking-wide text-white leading-tight">
                We Deliver Across<br /><span className="gradient-text">Tagrapuvalsa</span>
              </h2>
              <p className="text-ink-700 leading-relaxed">
                Fast, reliable delivery across all major areas. Place your order and track it live.
                No hidden charges, no minimum order surprise.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  settings?.deliveryAreas?.filter((a) => a.isActive).length > 0
                    ? settings.deliveryAreas.filter((a) => a.isActive).map((a) => a.name)
                    : ['Tagarapuvalasa', 'Chittivalasa', 'Sangivalasa', 'Bheemunipatnam', 'Anandapuram', 'Junction Area']
                ).map((area) => (
                  <div key={area} className="flex items-center gap-2 text-sm text-ink-700">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff5a00' }} />
                    {area}
                  </div>
                ))}
              </div>
              <Link to="/menu" className="btn-primary inline-flex">Order Now <ArrowRight size={18} /></Link>
            </div>
            <div className="p-10 lg:p-14 flex flex-col justify-center space-y-7 border-t lg:border-t-0 lg:border-l border-white/5">
              {[
                {
                  icon: Clock, label: 'Delivery Time', color: '#ff5a00',
                  value: settings?.estimatedDeliveryMins
                    ? `${settings.estimatedDeliveryMins} minutes`
                    : '30–45 minutes',
                },
                {
                  icon: Bike, label: 'Delivery Charge', color: '#ea580c',
                  value: settings
                    ? `₹${settings.deliveryCharge} flat${
                        settings.freeDeliveryAbove > 0
                          ? ` (Free above ₹${settings.freeDeliveryAbove})`
                          : ''
                      }`
                    : '₹40 flat',
                },
                {
                  icon: Phone, label: 'Order Support', color: '#fb923c',
                  value: restaurant?.phone || '+91 98765 43210',
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-ink-600 text-xs font-medium uppercase tracking-wider">{label}</p>
                    <p className="text-white font-semibold mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

    </div>
  );
};

export default HomePage;
