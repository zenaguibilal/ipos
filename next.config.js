/** @type {import('next').NextConfig} */

const withPWA = require("@ducanh2912/next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    fallbacks: {
        document: "/offline",
    },
});

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

module.exports = withPWA(nextConfig);
