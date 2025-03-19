/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Images configuration - minimal settings
  images: {
    unoptimized: true,
  },
  
  // Environment settings
  env: {
    // Ensure we have dummy env values for build
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'golf-improvement-app',
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-key-for-build',
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'dummy-key-for-build',
  },
  
  // Disable trailing slashes
  trailingSlash: false,
  
  // Ensure API routes work correctly
  experimental: {
    esmExternals: 'loose',
  },
  
  // Vercel-specific configuration
  output: process.env.VERCEL ? undefined : 'standalone'
};

module.exports = nextConfig; 