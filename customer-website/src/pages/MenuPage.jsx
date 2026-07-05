import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, X, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMenu } from '../services/api';
import MenuCard from '../components/menu/MenuCard';
import cloudinaryAssets from '../cloudinary-assets.json';

const menuDoodleBg = cloudinaryAssets['menu-doodle-bg.png'];

const MenuPage = () => {
  const cartRef = useRef(null);
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('cat');
    if (cat) {
      setActiveCategory(cat);
    } else {
      setActiveCategory('All');
    }
  }, [location.search]);

  useEffect(() => {
    const cartEl = document.querySelector('[data-cart-icon]');
    if (cartEl) cartRef.current = cartEl;
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getMenu();
        setItems(data.items);
        setCategories(['All', ...data.categories]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchVeg = !vegOnly || item.isVeg;
    return matchCat && matchSearch && matchVeg;
  }), [items, activeCategory, search, vegOnly]);

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filtered };
    const g = {};
    filtered.forEach((item) => { if (!g[item.category]) g[item.category] = []; g[item.category].push(item); });
    return g;
  }, [filtered, activeCategory]);

  return (
    <div className="min-h-screen pt-20 relative overflow-hidden"
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

        {/* Left edge warm orange focus spot (lower page) */}
        <div className="absolute w-[900px] h-[900px] top-[45%] left-[-450px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.22) 0%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />

        {/* Right edge warm orange focus spot (lower page) */}
        <div className="absolute w-[900px] h-[900px] top-[50%] right-[-450px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,90,0,0.22) 0%, transparent 70%)',
            mixBlendMode: 'screen'
          }} />
      </div>



      {/* Hero */}
      <div className="relative overflow-hidden py-14 px-4 bg-transparent">
        <div className="relative max-w-7xl mx-auto text-center z-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#ff5a00' }}>Full Menu</p>
          <h1 className="font-display text-5xl sm:text-7xl leading-none tracking-wide text-white mb-2">
            OUR <span className="gradient-text-warm">MENU</span>
          </h1>
          <p className="text-ink-600 max-w-md mx-auto text-sm sm:text-base font-serif italic">Authentic flavours, freshly prepared for you</p>

          {/* Decorative Divider Line with Center Heart and Curl Flourishes */}
          <div className="flex items-center justify-center my-4 text-brand-500 opacity-80">
            <svg width="220" height="16" viewBox="0 0 220 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8H95M125 8H210" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5 8C15 4 15 12 25 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M215 8C205 4 205 12 195 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M110 11.5L106.5 8C103.5 5 101.5 7 103.5 10L110 14L116.5 10C118.5 7 116.5 5 113.5 8L110 11.5Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">

        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 py-3 mb-8 -mx-4 px-4 border-b"
          style={{ background: 'rgba(12,10,9,0.96)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>

          {/* Row 1 — Search + Veg toggle (stacked on mobile to ensure search box width) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">

            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes..." className="input-field pl-11 pr-10 w-full" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-950 flex items-center justify-center w-8 h-8">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Veg toggle */}
            <button onClick={() => setVegOnly(!vegOnly)}
              className="flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2 rounded-full text-sm font-semibold border transition-all flex-shrink-0"
              style={vegOnly
                ? { background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.35)', color: '#16a34a' }
                : { borderColor: 'rgba(255,255,255,0.12)', color: '#a8a299' }}>
              <Leaf size={13} /> <span>Veg Only</span>
            </button>
          </div>

          {/* Row 2 — Category pills (horizontal scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200
                  ${activeCategory === cat ? 'cat-pill-active' : 'cat-pill'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-ink-900/[0.06]">
                <div className="aspect-[4/3] skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded-full w-3/4" />
                  <div className="h-3 skeleton rounded-full w-full" />
                  <div className="h-3 skeleton rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-14">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <section key={category}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl tracking-wide text-white uppercase">{category}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,90,0,0.12)', color: '#ff5a00', border: '1px solid rgba(255,90,0,0.2)' }}>
                      {categoryItems.length}
                    </span>
                  </div>
                  {/* Decorative horizontal line with diamond point */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[8px] text-brand-500 opacity-85">◆</span>
                    <div className="flex-1 h-[1.5px]" style={{ background: 'linear-gradient(to right, rgba(255,90,0,0.3) 0%, rgba(255,90,0,0.05) 75%, transparent 100%)' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                    {categoryItems.map((item, i) => (
                      <motion.div key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 8) * 0.04 }}>
                        <MenuCard item={item} cartRef={cartRef} />
                      </motion.div>
                    ))}
                  </div>
              </section>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-24">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-ink-700 font-semibold text-lg">No dishes found</p>
                <p className="text-ink-500 text-sm mt-2">Try a different search or category</p>
                <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="btn-outline mt-6 text-sm">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
