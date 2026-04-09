import path from "node:path";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const projectRoot = path.resolve(import.meta.dirname);
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// i18n configuration via next-intl plugin
// Supports EN/HI initially, framework ready for regional (TA/BN/TE/MR) and international (TH/ID) languages
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const DEFAULT_HTTPS_IMAGE_HOSTS = [
  "images.unsplash.com",
  "upload.wikimedia.org",
  "images.pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "tripbuilt.com",
  "www.tripbuilt.com",
  "grainy-gradients.vercel.app",
  "unpkg.com",
  "tiles.openfreemap.org",
  "*.tile.openstreetmap.org",
  "tile.openstreetmap.org",
  "**.supabase.co",
  "fal.media",
  "v3.fal.media",
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

const cspHeader = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://app.posthog.com https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://maps.googleapis.com https://maps.gstatic.com https://prod.spline.design https://*.tile.openstreetmap.org https://*.openstreetmap.org https://tiles.openfreemap.org https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://api.razorpay.com https://checkout.razorpay.com",
].join("; ");

// Payment pages need a relaxed CSP — Razorpay checkout.js dynamically
// loads sub-resources from various *.razorpay.com subdomains that are
// impossible to enumerate statically.
const paymentCspHeader = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://*.razorpay.com https://api.razorpay.com https://checkout.razorpay.com",
].join("; ");

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "sharp",
    "imapflow",
    "nodemailer",
    "mailparser",
    "@sparticuz/chromium",
    "playwright-core",
  ],
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns,
formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/unsplash-img/:path*",
          destination: "https://images.unsplash.com/:path*",
        },
      ],
    };
  },
  async redirects() {
    return [
      { source: "/welcome", destination: "/", permanent: true },
      { source: "/login", destination: "/auth", permanent: true },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];

    return [
      {
        source: "/pay/:path*",
        headers: [
          // No CSP for payment pages — Razorpay checkout.js requires
          // unrestricted script/connect access to dynamic subdomains
          ...securityHeaders,
        ],
      },
      {
        source: "/((?!pay/).*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
