import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Static export doesn't support the default Image Optimization API
  },
};

export default nextConfig;
