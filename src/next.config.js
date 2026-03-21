/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Needed for @react-pdf/renderer to work in Next.js
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
};

module.exports = nextConfig;
