// next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack'; // Import the type

const nextConfig: NextConfig = {
  reactStrictMode: true, // Good to keep this
  // Add any other specific Next.js config options you need here

  // Your webpack customization
  webpack: (
    config: WebpackConfiguration, // <-- Add the type annotation here
    { buildId, dev, isServer, defaultLoaders, webpack } // These are other available params you can type if used
  ) => {
    // The Vercel log showed this alias setup, ensure it's what you intend.
    // This section seems to be related to Prisma. If you are NOT using Prisma,
    // you might not need this webpack customization at all.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Example: If you had a Prisma alias here, it would look like:
      // '@prisma/client/default': require.resolve('@prisma/client/default?runtime=library'),
    };

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;