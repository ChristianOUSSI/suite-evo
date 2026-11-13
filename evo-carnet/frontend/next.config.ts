import type { NextConfig } from "next";

const apiOrigine = process.env.EVO_CARNET_API_URL ?? "http://127.0.0.1:10500";

const nextConfig: NextConfig = {
  // Le socle partagé est du JS écrit à la main : Next le lit tel quel.
  transpilePackages: ["@cadc/kit"],
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
