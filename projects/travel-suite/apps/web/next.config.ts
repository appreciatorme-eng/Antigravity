import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
