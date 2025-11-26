import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["qomrlsulpdzdwjiohtqo.supabase.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // For older versions (keep both for compatibility)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // ADD THIS SECTION TO IGNORE ESLINT ERRORS DURING BUILD
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optional: Also ignore TypeScript errors if you have any
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
