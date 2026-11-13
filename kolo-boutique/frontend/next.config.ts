import type { NextConfig } from "next";

const apiOrigine = process.env.KOLO_API_URL ?? "http://127.0.0.1:8300";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigine}/:path*`,
      },
    ];
  },
};

export default nextConfig;
