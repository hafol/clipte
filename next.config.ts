import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  turbopack: {},
  images: {
    // Creator portraits on the landing page are resized to thumbnail size
    remotePatterns: [{ protocol: 'https', hostname: 'clipping.net', pathname: '/clients/**' }],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
