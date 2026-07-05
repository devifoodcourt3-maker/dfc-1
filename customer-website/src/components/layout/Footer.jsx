import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook } from 'lucide-react';
import cloudinaryAssets from '../../cloudinary-assets.json';

const dfcLogo = cloudinaryAssets['dfc-logo.png'];
import useSettingsStore from '../../store/settingsStore';

const Footer = () => {
  const { settings, restaurant } = useSettingsStore();

  const phone = restaurant?.phone || '+91 98765 43210';
  const email = restaurant?.email || 'hello@dfcrestaurant.com';
  const address = restaurant?.address || 'Tagarapuvalasa, Visakhapatnam, Andhra Pradesh 531162';
  const isOpen = settings?.isOpen ?? true;
  const instagramHref = settings?.socialLinks?.instagram || '#';
  const facebookHref  = settings?.socialLinks?.facebook  || '#';

  const getDashboardUrl = () => {
    if (import.meta.env.VITE_DASHBOARD_URL) return import.meta.env.VITE_DASHBOARD_URL;
    if (window.location.hostname.includes('dfc-restaurant') || window.location.hostname.includes('pages.dev')) {
      return 'https://dfc-dashboard.pages.dev';
    }
    return 'http://localhost:5174';
  };

  const getRiderUrl = () => {
    if (import.meta.env.VITE_RIDER_URL) return import.meta.env.VITE_RIDER_URL;
    if (window.location.hostname.includes('dfc-restaurant') || window.location.hostname.includes('pages.dev')) {
      return 'https://dfc-rider.pages.dev';
    }
    return 'http://localhost:5175';
  };

  return (
    <footer className="relative overflow-hidden border-t mt-16" style={{ borderColor: 'rgba(26,24,22,0.08)', background: '#fff7ed' }}>

      {/* Top tricolor divider */}
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #b91c1c, #d97706, #15803d)' }} />

      {/* Ambient soft orbs */}
      <div className="absolute -bottom-20 -left-20 w-72 h-72 orb-red rounded-full pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-56 h-56 orb-green rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="md:col-span-1 space-y-5">
          <div className="flex items-center gap-2.5">
            <img src={dfcLogo} alt="DFC — Devi Food Court" className="w-10 h-10 object-contain" />
            <span className="font-display text-2xl tracking-wide text-ink-900">Devi Food Court</span>
          </div>
          <p className="text-ink-600 text-sm leading-relaxed">
            Authentic flavours crafted with love, delivered hot to your doorstep across Tagarapuvalasa.
          </p>
          <div className="flex gap-3">
            {[
              { href: instagramHref, Icon: Instagram, color: '#b91c1c' },
              { href: facebookHref,  Icon: Facebook,  color: '#15803d' },
            ].map(({ href, Icon, color }) => (
              <a key={color} href={href}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 bg-ink-900/[0.04] border border-ink-900/[0.06] hover:shadow-soft"
                style={{ color }}>
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: '#b91c1c' }}>Quick Links</h4>
          <ul className="space-y-2.5">
            {[['/', 'Home'], ['/menu', 'Menu'], ['/offers', 'Offers'], ['/track', 'Track Order'], ['/contact', 'Contact']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-ink-600 hover:text-ink-900 text-sm transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-ink-300 group-hover:bg-brand-500 transition-colors" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: '#d97706' }}>Contact</h4>
          <ul className="space-y-3.5">
            <li className="flex items-start gap-3 text-sm text-ink-600">
              <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#d97706' }} />
              {address}
            </li>
            <li className="flex items-center gap-3 text-sm text-ink-600">
              <Phone size={14} className="flex-shrink-0" style={{ color: '#d97706' }} />
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-ink-900 transition-colors">{phone}</a>
            </li>
            <li className="flex items-center gap-3 text-sm text-ink-600">
              <Mail size={14} className="flex-shrink-0" style={{ color: '#d97706' }} />
              <a href={`mailto:${email}`} className="hover:text-ink-900 transition-colors truncate">{email}</a>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-widest mb-5" style={{ color: '#15803d' }}>Hours</h4>
          <ul className="space-y-2 text-sm text-ink-600">
            <li className="flex items-center gap-2"><Clock size={12} style={{ color: '#15803d' }} /> Mon–Fri: 10am – 10pm</li>
            <li className="flex items-center gap-2"><Clock size={12} style={{ color: '#15803d' }} /> Sat–Sun: 10am – 11pm</li>
          </ul>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: isOpen ? 'rgba(21,128,61,0.08)' : 'rgba(185,28,28,0.08)',
              border: `1px solid ${isOpen ? 'rgba(21,128,61,0.25)' : 'rgba(185,28,28,0.25)'}`,
            }}>
            <span className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: isOpen ? '#15803d' : '#b91c1c' }} />
            <span className="text-xs font-bold tracking-wide"
              style={{ color: isOpen ? '#15803d' : '#b91c1c' }}>
              {isOpen ? 'Open Now' : 'Currently Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t py-6 text-center text-xs text-ink-500 space-y-2.5" style={{ borderColor: 'rgba(26,24,22,0.06)' }}>
        <div>
          <span className="gradient-text font-bold">Devi Food Court</span>
          <span className="mx-2 text-ink-300">·</span>
          © {new Date().getFullYear()} All rights reserved
          <span className="mx-2 text-ink-300">·</span>
          Made with ❤️ in Tagarapuvalasa
        </div>
        
        {/* Staff portal shortcuts */}
        <div className="flex justify-center items-center gap-3 text-[11px] text-ink-400">
          <a href={getDashboardUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors hover:underline">
            Admin Portal
          </a>
          <span className="w-1 h-1 rounded-full bg-ink-200" />
          <a href={getRiderUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors hover:underline">
            Delivery Portal
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
