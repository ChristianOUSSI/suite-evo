import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le socle partagé est du JS écrit à la main : Next le lit tel quel.
  transpilePackages: ["@cadc/kit"],
};

export default nextConfig;
