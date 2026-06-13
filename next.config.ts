import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 图片域名白名单（Supabase Storage）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;