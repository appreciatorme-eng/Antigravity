'use client';

import { useSessionRefresh } from '@/hooks/useSessionRefresh';

/**
 * Invisible guard component that redirects to /auth on session expiry.
 * Mounted once in AppProviders so every page benefits.
 */
export function SessionRefreshGuard() {
  useSessionRefresh();
  return null;
}
