import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep mongoose (and its native/CJS deps) out of the Turbopack bundle.
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
