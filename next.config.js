/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  experimental: {
    // Add workstation origins to allow HMR and static resource requests
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      'localhost:9002'
    ],
  },
  // Optimize webpack cache to handle "big strings" serialization issues in dev
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: true,
      };
    }
    return config;
  },
}

module.exports = nextConfig
