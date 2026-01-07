import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: {
    buildActivity: true,
  },
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
  },
};

export default nextConfig;
