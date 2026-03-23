"use client";

import { useReportWebVitals } from "next/web-vitals";
import { usePostHog } from "posthog-js/react";

/**
 * Hook that reports Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
 * to PostHog as structured events.
 *
 * Must be rendered inside <PostHogProvider>.
 */
export function useWebVitalsReporter() {
  const posthog = usePostHog();

  useReportWebVitals((metric) => {
    posthog.capture("web_vitals", {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id,
    });
  });
}
