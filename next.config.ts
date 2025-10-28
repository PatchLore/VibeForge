import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.suno.ai',
      },
      {
        protocol: 'https',
        hostname: 'cdn.suno.ai',
      },
      {
        protocol: 'https',
        hostname: 'musicfile.kie.ai',
      },
      {
        protocol: 'https',
        hostname: 'byteimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.kie.ai',
      },
      {
        protocol: 'https',
        hostname: '**.suno.ai',
      },
    ],
  },
};

export default nextConfig;
