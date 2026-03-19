import type { NextConfig } from 'next';

// GrünBilanz Next.js configuration
// Minimal config; PDF generation uses React-PDF server-side (see api/report/[year]/route.ts)
const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@react-pdf/renderer'],
  },
};

export default nextConfig;
