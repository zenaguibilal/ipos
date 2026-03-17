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
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'www.vectorlogo.zone',
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [
          {
            source: '/sw.js',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=0, must-revalidate',
              },
              {
                key: 'Service-Worker-Allowed',
                value: '/',
              },
            ],
          },
          {
            source: '/manifest.json',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=0, must-revalidate',
              },
            ],
          },
        ]
    },
};

module.exports = nextConfig;
