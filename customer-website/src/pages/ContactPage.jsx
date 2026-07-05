import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook, MessageCircle } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import cloudinaryAssets from '../cloudinary-assets.json';

const menuDoodleBg = cloudinaryAssets['menu-doodle-bg.png'];
const floatingVeggies = cloudinaryAssets['floating-veggies.png'];
import { useEffect, useState } from 'react';

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

const ContactPage = () => {
  const { settings, restaurant } = useSettingsStore();

  const phone = restaurant?.phone || '+91 98765 43210';
  const email = restaurant?.email || 'hello@dfcrestaurant.com';
  const whatsapp = settings?.socialLinks?.whatsapp || phone;
  const isOpen = settings?.isOpen ?? true;
  const instagramHref = settings?.socialLinks?.instagram || '#';
  const facebookHref = settings?.socialLinks?.facebook || '#';

  const CONTACT_CARDS = [
    {
      icon: Phone, title: 'Call Us', value: phone, sub: 'Available during business hours',
      href: `tel:${phone.replace(/\s/g, '')}`, cta: 'Call Now', grad: 'linear-gradient(135deg, #b91c1c, #d97706)'
    },
    {
      icon: MessageCircle, title: 'WhatsApp', value: whatsapp, sub: 'Quick responses on WhatsApp',
      href: `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`, cta: 'Chat Now', grad: 'linear-gradient(135deg, #166534, #15803d)'
    },
    {
      icon: Mail, title: 'Email Us', value: email, sub: 'We reply within 24 hours',
      href: `mailto:${email}`, cta: 'Send Email', grad: 'linear-gradient(135deg, #d97706, #fb842f)'
    },
  ];

  // Build opening hours from settings or fall back to defaults
  const DAY_GROUPS = [
    { label: 'Monday – Friday', keys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
    { label: 'Saturday', keys: ['saturday'] },
    { label: 'Sunday', keys: ['sunday'] },
  ];
  const HOURS = (settings?.openingHours && settings.openingHours.length > 0)
    ? DAY_GROUPS.map(({ label, keys }) => {
      const entry = settings.openingHours.find((h) => keys.includes(h.day));
      if (!entry) return null;
      if (entry.isClosed) return { days: label, time: 'Closed' };
      const fmt = (t) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${((h % 12) || 12)}:${String(m).padStart(2, '0')} ${ampm}`;
      };
      return { days: label, time: `${fmt(entry.open)} – ${fmt(entry.close)}` };
    }).filter(Boolean)
    : [
      { days: 'Monday – Friday', time: '10:00 AM – 10:00 PM' },
      { days: 'Saturday', time: '10:00 AM – 11:00 PM' },
      { days: 'Sunday', time: '10:00 AM – 11:00 PM' },
    ];
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

      <div className="max-w-6xl mx-auto pt-12">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="section-heading text-4xl md:text-5xl mb-4">Get in <span className="gradient-text">Touch</span></h1>
          <p className="section-sub mx-auto text-center">
            Have a question or want to give feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {CONTACT_CARDS.map(({ icon: Icon, title, value, sub, href, cta, grad }) => (
            <motion.a key={title} href={href} target="_blank" rel="noreferrer"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300 block text-white"
              style={{ background: grad, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative space-y-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white/75 text-xs font-semibold uppercase tracking-wider">{title}</p>
                  <p className="text-white font-bold text-lg mt-1 break-all">{value}</p>
                  <p className="text-white/65 text-xs mt-1">{sub}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-white text-sm font-semibold group-hover:gap-2 transition-all">
                  {cta} →
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location & Hours */}
          <div className="space-y-5">
            <div className="card-premium p-6 space-y-5">
              <h3 className="font-bold text-ink-900 text-lg flex items-center gap-2">
                <MapPin size={18} style={{ color: '#b91c1c' }} /> Our Location
              </h3>
              <div className="space-y-2">
                <p className="text-ink-900 font-semibold">Devi Food Court</p>
                <p className="text-ink-600 text-sm leading-relaxed">
                  Tagarapuvalasa, Visakhapatnam,<br />
                  Andhra Pradesh 531162, India
                </p>
              </div>
              <a href="https://maps.google.com/?q=Tagarapuvalasa,Visakhapatnam" target="_blank" rel="noreferrer"
                className="btn-outline text-sm py-2.5 px-5 inline-flex">
                <MapPin size={14} /> Open in Maps
              </a>
            </div>

            <div className="card-premium p-6 space-y-4">
              <h3 className="font-bold text-ink-900 text-lg flex items-center gap-2">
                <Clock size={18} style={{ color: '#d97706' }} /> Business Hours
              </h3>
              <div className="space-y-3">
                {HOURS.map(({ days, time }) => (
                  <div key={days} className="flex justify-between items-center py-2 border-b border-ink-900/[0.06] last:border-0">
                    <span className="text-ink-600 text-sm">{days}</span>
                    <span className="text-ink-900 text-sm font-medium">{time}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{
                  background: isOpen ? 'rgba(21,128,61,0.08)' : 'rgba(185,28,28,0.08)',
                  border: `1px solid ${isOpen ? 'rgba(21,128,61,0.2)' : 'rgba(185,28,28,0.2)'}`,
                }}>
                <span className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: isOpen ? '#15803d' : '#b91c1c' }} />
                <span className="text-sm font-semibold"
                  style={{ color: isOpen ? '#15803d' : '#b91c1c' }}>
                  {isOpen ? 'Currently Open' : 'Currently Closed'}
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="card-premium p-6">
              <h3 className="font-bold text-ink-900 text-lg mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, label: 'Instagram', href: instagramHref, color: '#b91c1c' },
                  { icon: Facebook, label: 'Facebook', href: facebookHref, color: '#15803d' },
                ].map(({ icon: Icon, label, href, color }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-cream-100 border border-ink-900/[0.06] rounded-xl px-4 py-2.5 text-ink-600 text-sm font-medium transition-all hover:text-white"
                    style={{ '--hover-bg': color }}
                    onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>
                    <Icon size={16} /> {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Map placeholder card */}
          <div className="card-premium overflow-hidden h-full min-h-[400px] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              style={{ background: 'linear-gradient(160deg, #fff8f2 0%, #fffdfb 100%)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(185,28,28,0.08)' }}>
                <MapPin size={32} style={{ color: '#b91c1c' }} />
              </div>
              <h3 className="font-bold text-ink-900 text-xl mb-2">Find Us Here</h3>
              <p className="text-ink-500 text-sm mb-6">Tagarapuvalasa, Visakhapatnam, Andhra Pradesh</p>
              <a href="https://maps.google.com/?q=Tagarapuvalasa,Visakhapatnam" target="_blank" rel="noreferrer" className="btn-primary text-sm px-6 py-3">
                Open Google Maps
              </a>
              <p className="text-ink-400 text-xs mt-4">Easy to find · Ample parking available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
