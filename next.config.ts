// next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  // Mark these packages as external for serverless (CRITICAL for Puppeteer on Vercel)
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  
  // ... any image domains or other settings ...
  images: {
    remotePatterns: [/* ... if you had this before ... */],
    domains: ['lh3.googleusercontent.com'], // This was in your log
  },
  reactStrictMode: true,

  webpack: (
    config: WebpackConfiguration, // <-- THIS TYPE ANNOTATION IS CRUCIAL
    { isServer } // Extract isServer from the context
  ) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Your Prisma alias or other aliases
    };

    // Additional webpack config for serverless packages
    if (isServer) {
      // Mark Puppeteer packages as external for server-side builds
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@sparticuz/chromium');
      }
    }

    return config;
  },
};

export default nextConfig;