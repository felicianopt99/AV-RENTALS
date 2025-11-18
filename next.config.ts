import path from 'path';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // eslint config removed for Next.js 16+
  // Turbopack optimizations (updated syntax)
  turbopack: {
    resolveAlias: {
      // Reduce module resolution time
      '@': './src',
    },
  },
  // Optimize compilation (removed deprecated swcMinify)
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure static asset handling to avoid conflicts
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/public/favicon.ico',
      },
    ];
  },
};

export default nextConfig;
