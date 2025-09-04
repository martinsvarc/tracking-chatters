/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'neon-orchid': 'rgb(var(--neon-orchid))',
        'sunset-gold': 'rgb(var(--sunset-gold))',
        'velvet-gray': 'rgb(var(--velvet-gray))',
        'obsidian': 'rgb(var(--obsidian))',
        'charcoal': 'rgb(var(--charcoal))',
        'smoke': 'rgb(var(--smoke))',
        'pearl': 'rgb(var(--pearl))',
        'crimson': 'rgb(var(--crimson))',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'data-update': 'data-update 0.6s ease-out',
        'live-pulse': 'live-pulse 2s ease-in-out infinite',
        'live-ring': 'live-ring 2s ease-in-out infinite',
        'wave-sweep': 'wave-sweep 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-slide-in': 'fade-slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-slide-out': 'fade-slide-out 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'expand': 'expand 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'collapse': 'collapse 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'success-fade-in': 'success-fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'checkmark-glow': 'checkmark-glow 1.5s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          'from': { 'box-shadow': '0 0 20px rgba(var(--neon-orchid), 0.2)' },
          'to': { 'box-shadow': '0 0 40px rgba(var(--neon-orchid), 0.4)' }
        },
        'float': {
          '0%, 100%': { 'transform': 'translateY(0px)' },
          '50%': { 'transform': 'translateY(-8px)' }
        },
        'data-update': {
          '0%': { 
            'transform': 'scale(1)',
            'box-shadow': '0 0 0 0 rgba(var(--neon-orchid), 0.7)'
          },
          '50%': { 
            'transform': 'scale(1.05)',
            'box-shadow': '0 0 0 10px rgba(var(--neon-orchid), 0)'
          },
          '100%': { 
            'transform': 'scale(1)',
            'box-shadow': '0 0 0 0 rgba(var(--neon-orchid), 0)'
          }
        },
        'live-pulse': {
          '0%, 100%': { 'opacity': '1', 'transform': 'scale(1)' },
          '50%': { 'opacity': '0.7', 'transform': 'scale(1.2)' }
        },
        'live-ring': {
          '0%, 100%': { 'opacity': '0.3', 'transform': 'scale(1)' },
          '50%': { 'opacity': '0.1', 'transform': 'scale(1.3)' }
        },
        'wave-sweep': {
          '0%': { 'left': '-100%', 'opacity': '0' },
          '20%': { 'opacity': '1' },
          '80%': { 'opacity': '1' },
          '100%': { 'left': '100%', 'opacity': '0' }
        },
        'fade-slide-in': {
          '0%': { 'opacity': '0', 'transform': 'translateX(20px)' },
          '100%': { 'opacity': '1', 'transform': 'translateX(0)' }
        },
        'fade-slide-out': {
          '0%': { 'opacity': '1', 'transform': 'translateX(0)' },
          '100%': { 'opacity': '0', 'transform': 'translateX(-20px)' }
        },
        'expand': {
          '0%': { 'max-height': '0', 'opacity': '0' },
          '100%': { 'max-height': '500px', 'opacity': '1' }
        },
        'collapse': {
          '0%': { 'max-height': '500px', 'opacity': '1' },
          '100%': { 'max-height': '0', 'opacity': '0' }
        },
        'success-fade-in': {
          '0%': { 'opacity': '0', 'transform': 'scale(0.8)' },
          '50%': { 'opacity': '1', 'transform': 'scale(1.1)' },
          '100%': { 'opacity': '1', 'transform': 'scale(1)' }
        },
        'checkmark-glow': {
          '0%, 100%': { 'filter': 'brightness(1) drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' },
          '50%': { 'filter': 'brightness(1.3) drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))' }
        }
      }
    },
  },
  plugins: [],
}
