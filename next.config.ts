import path from 'path';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // i18n via next.config is unsupported in App Router; use middleware/route groups instead
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
};

export default nextConfig;
