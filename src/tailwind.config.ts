import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // GrünBilanz brand colors
        brand: {
          green: '#2D6A4F',
          'green-dark': '#1B4332',
          'green-light': '#52B788',
          'green-pale': '#D8F3DC',
          'green-muted': '#B7E4C7',
          amber: '#F4A261',
          red: '#E76F51',
        },
        'warm-bg': '#F4F6F4',
        'card-border': '#E2E8E4',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(45,106,79,0.12), 0 1px 4px rgba(0,0,0,0.06)',
        green: '0 4px 14px rgba(45,106,79,0.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
        'card-highlight': 'linear-gradient(135deg, #D8F3DC 0%, #f0faf3 100%)',
        'header-gradient': 'linear-gradient(180deg, #ffffff 0%, #f4f6f4 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
