
import type { NextConfig } from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: true,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
    devIndicators: {
        allowedDevOrigins: ["https://*.cloudworkstations.dev"],
    },
};

export default withPWA(nextConfig);
