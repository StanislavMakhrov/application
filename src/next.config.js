/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // @react-pdf/renderer must run in Node.js context, not bundled
  serverExternalPackages: ['@react-pdf/renderer'],
};

module.exports = nextConfig;
