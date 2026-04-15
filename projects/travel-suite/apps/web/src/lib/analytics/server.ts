import { PostHog } from "posthog-node";

function getServerClient() {
  const apiKey =
    process.env.POSTHOG_PROJECT_API_KEY ||
    process.env.POSTHOG_API_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    return null;
  }

  return new PostHog(apiKey, {
    host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function captureServerAnalyticsEvent(params: {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
}) {
  const client = getServerClient();
  if (!client) {
    return;
  }

  try {
    client.capture({
      event: params.event,
      distinctId: params.distinctId,
      properties: {
        ...params.properties,
        source: "server",
      },
    });
    await client.shutdown();
  } catch {
    // Analytics is best-effort only.
  }
}
