import type { NextConfig } from "next";

const internalApiUrl = process.env.INTERNAL_API_URL?.trim().replace(/\/+$/, "");
if (internalApiUrl) {
  const url = new URL(internalApiUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/") {
    throw new Error("INTERNAL_API_URL yalnız backend'in http(s) kök adresi olmalı.");
  }
}

const nextConfig: NextConfig = {
  async rewrites() {
    return internalApiUrl
      ? [{ source: "/api/:path*", destination: `${internalApiUrl}/api/:path*` }]
      : [];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
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
