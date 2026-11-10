/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Landing (copie de la page Alytics) : mêmes seuils que l'original, 810 et 1200 px.
      screens: {
        tab: '810px',
        desk: '1200px',
      },
      colors: {
        al: {
          blue: '#126dfb',
          'blue-hover': '#0765e8',
          ink: '#121212',
          gray: '#575757cc',
          tag: '#e1eaf8',
          page: '#fcfcfc',
          line: '#e4e4e4',
          tile: '#e8e8e9',
          soft: '#f5f5f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
