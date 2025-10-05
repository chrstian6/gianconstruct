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
};

export default nextConfig;
