import type { NextConfig } from "next";

const apiOrigin = process.env.CASH_API_URL ?? "http://127.0.0.1:8200";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
