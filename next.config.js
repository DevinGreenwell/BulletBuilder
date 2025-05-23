/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only use this if TypeScript errors are also blocking builds
    // ignoreBuildErrors: true,
  },
}

module.exports = nextConfig