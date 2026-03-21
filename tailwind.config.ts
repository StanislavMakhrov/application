import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
      },
    },
  },
  plugins: [],
};

export default config;
