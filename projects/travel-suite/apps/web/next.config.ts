import type { NextConfig } from "next";
import path from "node:path";
import "./src/env";

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: ['pdf-parse'],
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      // Itinerary location thumbnails
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      // Org logo URLs (admin settings)
      {
        protocol: "https",
        hostname: "gobuddyadventures.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gobuddyadventures.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
