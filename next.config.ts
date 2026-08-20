import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sites/Vinext serves public assets directly. Avoid the Next image proxy,
    // which is not available for these local exercise images in production.
    unoptimized: true,
  },
};

export default nextConfig;
