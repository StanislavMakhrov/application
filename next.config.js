/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',
  // Ensure Node.js runtime is available for PDF generation routes
  serverExternalPackages: ['@react-pdf/renderer', '@prisma/client'],
};

module.exports = nextConfig;
