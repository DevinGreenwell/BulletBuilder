// next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack'; // Make sure this import is present

const nextConfig: NextConfig = {
  // ... any image domains or other settings ...
  images: {
    remotePatterns: [/* ... if you had this before ... */],
    domains: ['lh3.googleusercontent.com'], // This was in your log
  },
  reactStrictMode: true,

  webpack: (
    config: WebpackConfiguration, // <-- THIS TYPE ANNOTATION IS CRUCIAL
    // { buildId, dev, isServer, defaultLoaders, webpack } // Other params
  ) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Your Prisma alias or other aliases
    };
    return config;
  },
};

export default nextConfig;