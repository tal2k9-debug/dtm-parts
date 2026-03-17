import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dtm-parts.monday.com",
      },
      {
        protocol: "https",
        hostname: "*.monday.com",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
