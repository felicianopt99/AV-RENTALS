
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  eslint: {
    ignoreDuringBuilds: false,
  },
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
