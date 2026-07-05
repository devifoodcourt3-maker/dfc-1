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
  combo: { icon: Gift, label: 'Combo Deal', grad: 'linear-gradient(135deg, #ea580c, #f97316)' },
  coupon: { icon: Tag, label: 'Coupon', grad: 'linear-gradient(135deg, #ff5a00, #fb842f)' },
  promo: { icon: Zap, label: 'Promotion', grad: 'linear-gradient(135deg, #d97706, #fb842f)' },
  seasonal: { icon: Gift, label: 'Special', grad: 'linear-gradient(135deg, #9a3412, #c2410c)' },
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-6 text-white"
      style={{ background: config.grad, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
    >
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-black/5 rounded-full" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon size={16} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white/75 uppercase tracking-widest">{config.label}</span>
          </div>
          <span className="text-2xl font-black text-white">{discountLabel}</span>
        </div>

        <div>
          <h3 className="font-bold text-white text-xl leading-tight mb-1">{offer.title}</h3>
          {offer.description && <p className="text-white/75 text-sm">{offer.description}</p>}
        </div>

        {offer.minOrderValue > 0 && (
          <p className="text-white/65 text-xs">Min. order: ₹{offer.minOrderValue}</p>
        )}

        {offer.code && (
          <button onClick={copyCode}
            className="w-full flex items-center justify-between bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl px-4 py-3 transition-all group">
            <span className="font-mono font-bold text-white tracking-widest text-sm">{offer.code}</span>
            <span className="flex items-center gap-1.5 text-white/80 group-hover:text-white text-xs font-medium">
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </span>
          </button>
        )}

        {validUntil && <p className="text-white/55 text-xs">Valid until {validUntil}</p>}
      </div>
    </motion.div>
  );
};

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

      {/* Dark overlay to blend background doodles seamlessly (lighter to make doodles more visible) */}
      <div className="absolute inset-0 bg-black/42 pointer-events-none" />

      {/* Ambient orange glow blobs behind header and content */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left corner warm orange focus spot */}
        <div className="absolute w-[900px] h-[900px] top-[-300px] left-[-350px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.36) 0%, rgba(255,90,0,0.08) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />

        {/* Top-right corner warm orange focus spot */}
        <div className="absolute w-[900px] h-[900px] top-[-300px] right-[-350px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.36) 0%, rgba(255,90,0,0.08) 50%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />
      </div>

      {/* Scattered background veggies/ingredients with transparent background */}

      <div className="max-w-7xl mx-auto pt-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(255,90,0,0.08)', border: '1px solid rgba(255,90,0,0.25)', color: '#ff5a00' }}>
            <Zap size={14} /> Exclusive Deals
          </span>
          <h1 className="section-heading text-4xl md:text-5xl mb-4 text-white">Today's <span className="gradient-text">Offers</span></h1>
          <p className="section-sub mx-auto text-center">
            Use these codes at checkout to save big on your next order
          </p>
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
              <div key={i} className="rounded-2xl bg-white border border-ink-900/[0.06] h-52 skeleton" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((offer) => <OfferCard key={offer._id} offer={offer} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎁</p>
            <p className="text-ink-700 font-semibold">No offers available right now</p>
            <p className="text-ink-500 text-sm mt-2">Check back soon for exclusive deals</p>
          </div>
        )}

        {/* Info banner */}
        <div className="mt-12 card-premium p-6 text-center">
          <p className="text-ink-600 text-sm">
            💡 <span className="text-ink-900 font-semibold">How to use a coupon?</span> Add items to your cart,
            go to checkout, and enter the coupon code in the "Coupon Code" field before placing your order.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
