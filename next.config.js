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
    allowedDevOrigins: [
      '6000-firebase-ipos-intelligent-pos-1774532177545.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev',
      '*.cloudworkstations.dev'
    ]
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
