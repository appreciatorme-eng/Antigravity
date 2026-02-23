import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname);

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
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
