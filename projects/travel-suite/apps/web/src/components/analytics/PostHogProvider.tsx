"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";
import { useWebVitalsReporter } from "@/lib/analytics/web-vitals";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip initial mount — PostHogProvider captures the first pageview after init
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    const search = searchParams?.toString() || "";
    posthog.capture("$pageview", {
      pathname,
      search,
      url: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}

function WebVitalsReporter() {
  useWebVitalsReporter();
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      person_profiles: "identified_only",
    });

    // Capture initial pageview here — PageViewTracker fires before init due to React's
    // child-first useEffect ordering, so we handle the first pageview post-init.
    posthog.capture("$pageview", {
      pathname: window.location.pathname,
      search: window.location.search,
      url: window.location.href,
    });
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogReactProvider client={posthog}>
      <PageViewTracker />
      <WebVitalsReporter />
      {children}
    </PostHogReactProvider>
  );
}
