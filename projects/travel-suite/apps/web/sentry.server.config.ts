import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (!dsn && process.env.NODE_ENV === "production") {
  console.warn(
    "[Sentry] No DSN configured in production — errors will not be tracked. " +
    "Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN."
  );
}

Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
