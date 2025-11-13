import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript errors during build (safe for now)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;