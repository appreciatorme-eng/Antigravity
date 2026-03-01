import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname);

const DEFAULT_HTTPS_IMAGE_HOSTS = [
  "images.unsplash.com",
  "upload.wikimedia.org",
  "images.pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "gobuddyadventures.com",
  "www.gobuddyadventures.com",
  "grainy-gradients.vercel.app",
  "unpkg.com",
  "tiles.openfreemap.org",
  "**.supabase.co",
];

function parseCsvHosts(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0);
}

const extraHttpsHosts = parseCsvHosts(process.env.NEXT_IMAGE_REMOTE_HOSTS);
const httpsHosts = [...new Set([...DEFAULT_HTTPS_IMAGE_HOSTS, ...extraHttpsHosts])];

const remotePatterns = [
  ...httpsHosts.map((hostname) => ({
    protocol: "https",
    hostname,
    pathname: "/**",
  })),
  {
    protocol: "http",
    hostname: "localhost",
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    pathname: "/**",
  },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
