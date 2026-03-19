/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Use external packages for PDF generation (server-only, avoids bundling issues)
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
};

export default nextConfig;
