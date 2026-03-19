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
        // GrünBilanz brand colors — green for sustainability, professional blue for trust
        brand: {
          green: '#16a34a',
          'green-light': '#22c55e',
          'green-dark': '#15803d',
          blue: '#1d4ed8',
          'blue-light': '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
