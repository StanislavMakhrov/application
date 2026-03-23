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
          green: '#2D6A4F',
          'green-light': '#52B788',
          'green-pale': '#D8F3DC',
          amber: '#F4A261',
          red: '#E76F51',
        },
        // Design refresh — warm off-white background
        'warm-bg': '#F7F6F2',
        'card-border': '#E5E7EB',
      },
    },
  },
  plugins: [],
};

export default config;
