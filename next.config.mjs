/** @type {import('next').NextConfig} */
import withPWA from '@ducanh2912/next-pwa';

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // any other next.js config you have
};

export default pwa(nextConfig);
