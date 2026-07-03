/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette - Vibrant Premium Orange (matching the mockup)
        brand: {
          50: 'rgba(255, 90, 0, 0.05)',
          100: 'rgba(255, 90, 0, 0.1)',
          200: 'rgba(255, 90, 0, 0.2)',
          300: 'rgba(255, 90, 0, 0.35)',
          400: 'rgba(255, 90, 0, 0.5)',
          500: '#ff5a00',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        red: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d',
        },
        green: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
        },
        ink: {
          950: '#ffffff',
          900: '#faf8f6', // primary text color on dark
          800: '#e5e1db', // secondary text
          700: '#ccc7be',
          600: '#a8a299',
          500: '#7e786f',
        },
        cream: {
          50: '#0c0a09', // primary dark page background
          100: '#161413', // secondary dark/card background
          200: '#221e1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Bebas Neue', 'Playfair Display', 'serif'],
      },
      animation: {
        'float':           'float 4s ease-in-out infinite',
        'float-slow':      'float 7s ease-in-out infinite',
        'float-delayed':   'float 5s ease-in-out 1.5s infinite',
        'slide-up':        'slideUp 0.6s ease-out',
        'fade-in':         'fadeIn 0.5s ease-out',
        'cart-bounce':     'cartBounce 0.4s ease-out',
        'fly':             'fly 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'gradient-x':      'gradientX 6s ease infinite',
        'marquee':         'marquee 28s linear infinite',
        'marquee-slow':    'marquee 44s linear infinite',
        'counter':         'counterUp 1.2s ease-out forwards',
        'orb-drift':       'orbDrift 12s ease-in-out infinite',
        'orb-drift-r':     'orbDriftR 16s ease-in-out infinite',
        'shimmer':         'shimmer 1.5s infinite',
        'pulse-glow':      'pulseGlow 2.4s ease-in-out infinite',
        'slide-right':     'slideRight 0.5s ease-out forwards',
        'zoom-in':         'zoomIn 0.6s ease-out forwards',
        'logo-breathe':    'logoBreathe 3.5s ease-in-out infinite',
      },
      keyframes: {
        float:    { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(28px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        zoomIn:   { from: { opacity: 0, transform: 'scale(0.92)' }, to: { opacity: 1, transform: 'scale(1)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        cartBounce: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.3)' } },
        fly: {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '60%': { opacity: 0.8 },
          '100%': { opacity: 0, transform: 'scale(0.2)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 8px 30px rgba(185,28,28,0.18), 0 0 0 rgba(217,119,6,0)' },
          '50%':     { boxShadow: '0 8px 40px rgba(185,28,28,0.3), 0 0 30px rgba(217,119,6,0.15)' },
        },
        counterUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        orbDrift: {
          '0%,100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':     { transform: 'translate(50px, -60px) scale(1.15)' },
          '66%':     { transform: 'translate(-30px, 50px) scale(0.9)' },
        },
        orbDriftR: {
          '0%,100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':     { transform: 'translate(-60px, 40px) scale(1.1)' },
          '66%':     { transform: 'translate(40px, -50px) scale(0.95)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        logoBreathe: {
          '0%,100%': { transform: 'scale(1)',    opacity: '0.92' },
          '50%':     { transform: 'scale(1.04)', opacity: '1'    },
        },
      },
      backgroundImage: {
        'tricolor-gradient': 'linear-gradient(135deg, #b91c1c 0%, #d97706 50%, #15803d 100%)',
        'red-orange':        'linear-gradient(135deg, #b91c1c 0%, #d97706 100%)',
        'orange-green':      'linear-gradient(135deg, #d97706 0%, #15803d 100%)',
        'radial-glow':       'radial-gradient(circle at 50% 0%, rgba(217,119,6,0.10), transparent 60%)',
      },
      boxShadow: {
        'soft':      '0 4px 20px rgba(26,24,22,0.06)',
        'soft-lg':   '0 12px 40px rgba(26,24,22,0.08)',
        'red-glow':  '0 8px 30px rgba(185,28,28,0.18)',
        'orange-glow': '0 8px 30px rgba(217,119,6,0.18)',
        'green-glow':  '0 8px 30px rgba(21,128,61,0.18)',
      },
    },
  },
  plugins: [],
};
