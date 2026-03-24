import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2D6A4F',
          'green-light': '#52B788',
          'green-pale': '#D8F3DC',
          'green-dark': '#1B4332',
          amber: '#F4A261',
          red: '#E76F51',
        },
        'warm-bg': '#F0F4F0',
        'card-border': '#E2EAE5',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(45, 106, 79, 0.08), 0 0 1px 0 rgba(45, 106, 79, 0.12)',
        'card-hover': '0 8px 24px 0 rgba(45, 106, 79, 0.15), 0 0 1px 0 rgba(45, 106, 79, 0.15)',
        glow: '0 0 20px rgba(82, 183, 136, 0.3)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
