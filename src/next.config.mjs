/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output so Docker can run a self-contained Node.js server
  // without needing the full node_modules tree at runtime.
  output: 'standalone',
};

export default nextConfig;
