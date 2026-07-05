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
    <footer className="relative overflow-hidden border-t mt-12 bg-cream-50 border-white/5">

      {/* Top brand gradient divider */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #ff5a00, #ea580c, #c2410c)' }} />

      {/* Ambient soft orbs */}
      <div className="absolute -bottom-20 -left-20 w-72 h-72 orb-red rounded-full pointer-events-none opacity-20" />
      <div className="absolute -top-10 -right-10 w-56 h-56 orb-green rounded-full pointer-events-none opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">

        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src={dfcLogo} alt="DFC — Devi Food Court" className="w-8 h-8 object-contain" />
            <span className="font-display text-lg tracking-wide text-white">Devi Food Court</span>
          </div>
          <p className="text-ink-600 text-xs leading-relaxed">
            Authentic flavours crafted with love, delivered hot to your doorstep across Tagarapuvalasa.
          </p>
          <div className="flex gap-2">
            {[
              { href: instagramHref, Icon: Instagram },
              { href: facebookHref,  Icon: Facebook  },
            ].map(({ href, Icon }) => (
              <a key={href} href={href}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-white/5 border border-white/10 hover:border-brand-500/40 hover:bg-brand-500/10 text-white hover:text-brand-500 hover:shadow-soft"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-bold text-[11px] uppercase tracking-widest mb-3.5 text-brand-500">Quick Links</h4>
          <ul className="space-y-2">
            {[['/', 'Home'], ['/menu', 'Menu'], ['/offers', 'Offers'], ['/track', 'Track Order'], ['/contact', 'Contact']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-ink-600 hover:text-white text-xs sm:text-sm transition-colors duration-200 flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-ink-500 group-hover:bg-brand-500 transition-colors" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold text-[11px] uppercase tracking-widest mb-3.5 text-brand-500">Contact</h4>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-600">
              <MapPin size={13} className="mt-0.5 flex-shrink-0 text-brand-500" />
              {address}
            </li>
            <li className="flex items-center gap-2.5 text-xs sm:text-sm text-ink-600">
              <Phone size={13} className="flex-shrink-0 text-brand-500" />
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{phone}</a>
            </li>
            <li className="flex items-center gap-2.5 text-xs sm:text-sm text-ink-600">
              <Mail size={13} className="flex-shrink-0 text-brand-500" />
              <a href={`mailto:${email}`} className="hover:text-white transition-colors truncate">{email}</a>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div>
          <h4 className="font-bold text-[11px] uppercase tracking-widest mb-3.5 text-brand-500">Hours</h4>
          <ul className="space-y-1.5 text-xs sm:text-sm text-ink-600">
            <li className="flex items-center gap-2"><Clock size={11} className="text-brand-500" /> Mon–Fri: 10am – 10pm</li>
            <li className="flex items-center gap-2"><Clock size={11} className="text-brand-500" /> Sat–Sun: 10am – 11pm</li>
          </ul>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
            style={{
              background: isOpen ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              borderColor: isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              color: isOpen ? '#4ade80' : '#f87171',
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: isOpen ? '#22c55e' : '#ef4444' }} />
            <span className="text-[10px] font-bold tracking-wide">
              {isOpen ? 'Open Now' : 'Currently Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t py-4 text-center text-[10px] sm:text-xs text-ink-500 space-y-2 border-white/5">
        <div>
          <span className="text-brand-500 font-bold">Devi Food Court</span>
          <span className="mx-2 text-ink-600">·</span>
          © {new Date().getFullYear()} All rights reserved
          <span className="mx-2 text-ink-300">·</span>
          Made with ❤️ in Tagarapuvalasa
        </div>
        
        {/* Staff portal shortcuts */}
        <div className="flex justify-center items-center gap-2.5 text-[10px] text-ink-500">
          <a href={getDashboardUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors hover:underline">
            Admin Portal
          </a>
          <span className="w-1 h-1 rounded-full bg-ink-600" />
          <a href={getRiderUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors hover:underline">
            Delivery Portal
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
