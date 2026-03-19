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
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "dtm-parts.com" }],
        destination: "https://dtmparts.co.il/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.dtm-parts.com" }],
        destination: "https://dtmparts.co.il/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.dtmparts.co.il" }],
        destination: "https://dtmparts.co.il/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
