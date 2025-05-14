// next.config.js
const path = require('path');

module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Redirect imports of '@prisma/client/default' to the actual client entry
      '@prisma/client/default': require.resolve('@prisma/client'),
    };
    return config;
  },
};
