/** @type {import('next').NextConfig} */

const nextConfig = {
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

module.exports = nextConfig;
