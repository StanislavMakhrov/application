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
        // GrünBilanz brand colors
        brand: {
          green: '#1e5c3a',
          'green-mid': '#2D6A4F',
          'green-light': '#52B788',
          'green-pale': '#D8F3DC',
          'green-muted': '#e8f5ec',
          amber: '#F4A261',
          red: '#E76F51',
        },
        // Surface colors
        'warm-bg': '#f0f4f1',
        'card-border': '#e2e8e4',
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fbf9',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
        'glow-green': '0 0 0 3px rgba(82,183,136,0.25)',
        'inner-sm': 'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1e5c3a 0%, #2D6A4F 60%, #3a8a63 100%)',
        'gradient-card-accent': 'linear-gradient(90deg, #1e5c3a, #52B788)',
        'gradient-hero': 'linear-gradient(135deg, #1e5c3a 0%, #2D6A4F 40%, #52B788 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
