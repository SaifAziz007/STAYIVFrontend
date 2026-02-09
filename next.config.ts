import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Remove 'output: export' to allow dynamic rendering for Vercel deployment
};

export default nextConfig;
