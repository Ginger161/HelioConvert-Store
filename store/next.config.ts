import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the original single "Business Stack" became several stacks, one per business
  async redirects() {
    return [{ source: "/stack/business-stack", destination: "/stacks", permanent: true }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
