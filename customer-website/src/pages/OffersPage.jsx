import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Gift, Zap, Copy, Check } from 'lucide-react';
import { getOffers } from '../services/api';
import toast from 'react-hot-toast';
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

const OfferCard = ({ offer }) => {
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
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }}
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

import SEO from '../components/shared/SEO';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getOffers().then((d) => setOffers(d.offers)).catch(() => { }).finally(() => setIsLoading(false));
  }, []);

  const types = ['all', ...new Set(offers.map((o) => o.type))];
  const filtered = filter === 'all' ? offers : offers.filter((o) => o.type === filter);

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${menuDoodleBg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '750px',
        backgroundColor: '#0c0a09'
      }}>
      <SEO
        title="DFC Restaurant Offers & Coupons | Best Deals in Tagarapuvalasa & Bheemili"
        description="Save big on your food orders at DFC Restaurant. Get exclusive coupon codes, discounts, and combo deals on Biryani, Tandoori & Curries in Tagarapuvalasa and Bheemili."
        keywords="DFC offers, DFC restaurant coupons, DFC Tagarapuvalasa deals, food discounts Tagarapuvalasa, best restaurant offers Bheemili"
        canonical="https://dfcthagarapuvalasa.in/offers"
      />

      {/* Dark overlay to blend background doodles seamlessly */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 90, 0, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

      {/* Ambient glow blobs behind header and content */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left corner warm orange focus spot */}
        <div className="absolute w-[900px] h-[900px] top-[-300px] left-[-350px] rounded-full animate-float-slow"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.3) 0%, rgba(255,90,0,0.06) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />

        {/* Top-right corner warm orange focus spot */}
        <div className="absolute w-[900px] h-[900px] top-[-300px] right-[-350px] rounded-full animate-float"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.3) 0%, rgba(255,90,0,0.06) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />

        {/* Bottom center deep orange focus spot */}
        <div className="absolute w-[800px] h-[800px] bottom-[-200px] left-1/2 -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.15) 0%, rgba(234,88,12,0.03) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />
      </div>



      <div className="max-w-7xl mx-auto pt-12 relative z-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(255,90,0,0.08)', border: '1px solid rgba(255,90,0,0.25)', color: '#ff5a00' }}>
            <Zap size={14} className="animate-pulse" /> EXCLUSIVE DEALS
          </span>
          <h1 className="font-display text-5xl sm:text-6xl leading-none tracking-wide text-white mb-3">
            TODAY'S <span className="gradient-text-warm">OFFERS</span>
          </h1>
          <p className="text-ink-600 max-w-md mx-auto text-sm sm:text-base font-serif italic">
            Use these codes at checkout to save big on your next order
          </p>
          {/* Decorative Divider Line */}
          <div className="flex items-center justify-center my-4 text-[#ff5a00] opacity-80">
            <svg width="220" height="16" viewBox="0 0 220 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8H95M125 8H210" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5 8C15 4 15 12 25 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M215 8C205 4 205 12 195 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M110 11.5L106.5 8C103.5 5 101.5 7 103.5 10L110 14L116.5 10C118.5 7 116.5 5 113.5 8L110 11.5Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Filter */}
        {types.length > 1 && (
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {types.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize
                  ${filter === t ? 'cat-pill-active' : 'cat-pill'}`}>
                {t === 'all' ? 'All Offers' : t}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-cream-100/40 border border-white/5 h-56 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((offer) => <OfferCard key={offer._id} offer={offer} />)}
          </div>
        ) : (
          <div className="text-center py-24 bg-cream-100/20 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-5xl mb-4">🎁</p>
            <p className="text-ink-900 font-semibold text-lg">No offers available right now</p>
            <p className="text-ink-600 text-sm mt-2">Check back soon for exclusive deals</p>
          </div>
        )}

        {/* Info banner */}
        <div className="mt-12 p-6 text-center rounded-2xl border"
          style={{ 
            background: 'linear-gradient(90deg, rgba(255, 90, 0, 0.04) 0%, rgba(255, 90, 0, 0.08) 50%, rgba(255, 90, 0, 0.04) 100%)',
            borderColor: 'rgba(255, 90, 0, 0.15)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)'
          }}>
          <p className="text-stone-400 text-sm leading-relaxed">
            💡 <span className="text-white font-semibold">How to use a coupon?</span> Add items to your cart,
            go to checkout, and enter the coupon code in the <span className="text-[#ff5a00] font-semibold">"Coupon Code"</span> field before placing your order.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
