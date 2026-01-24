import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    devIndicators: {
        allowedDevOrigins: ["https://*.cloudworkstations.dev"],
    },
    images: {
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
};

export default nextConfig;
