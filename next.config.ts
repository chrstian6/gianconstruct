import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["qomrlsulpdzdwjiohtqo.supabase.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Wildcard for all Supabase domains
      },
    ],
  },
};

export default nextConfig;
