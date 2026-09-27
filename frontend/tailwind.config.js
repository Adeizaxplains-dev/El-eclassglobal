/** @type {import('tailwindcss').Config} */
import { THEME } from './src/config/theme.config.js';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: THEME.colors,
      fontFamily: THEME.fontFamily,
      boxShadow: THEME.boxShadow,
      borderRadius: THEME.borderRadius,

      /* Subtle reveal animation used sparingly (category/product hovers) */
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },

  plugins: [],
};
