import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  allowedDevOrigins: [
    "10.187.172.250",
  ],
};

export default nextConfig;
