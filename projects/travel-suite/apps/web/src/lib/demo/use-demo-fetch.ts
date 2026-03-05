// useDemoFetch — wraps fetch() to inject X-Demo-Org-Id header.
// Drop-in replacement for fetch in admin pages.

"use client";

import { useCallback } from "react";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

export function useDemoFetch() {
  const { isDemoMode, demoOrgId } = useDemoMode();

  return useCallback(
    (url: string, init?: RequestInit): Promise<Response> => {
      if (isDemoMode && url.startsWith("/api/admin")) {
        const headers = new Headers(init?.headers);
        headers.set("X-Demo-Org-Id", demoOrgId);
        return fetch(url, { ...init, headers });
      }
      return fetch(url, init);
    },
    [isDemoMode, demoOrgId]
  );
}
