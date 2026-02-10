import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Ensure CSS is properly handled in production
  experimental: {
    optimizeCss: false, // Disable if causing issues
  },
  // Ensure proper transpilation
  transpilePackages: [],
};

export default nextConfig;
