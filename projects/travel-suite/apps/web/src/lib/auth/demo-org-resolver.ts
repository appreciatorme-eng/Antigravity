// Server-side demo org detection for API handlers.
// Reads X-Demo-Org-Id header and validates against the known demo org.

import { NextResponse } from "next/server";
import { DEMO_ORG_ID } from "@/lib/demo/constants";

interface DemoOrgResult {
  isDemoMode: boolean;
  demoOrgId: string | null;
}

export function resolveDemoOrg(request: Request): DemoOrgResult {
  const headerOrgId = request.headers.get("X-Demo-Org-Id");
  if (headerOrgId && headerOrgId === DEMO_ORG_ID) {
    return { isDemoMode: true, demoOrgId: DEMO_ORG_ID };
  }
  return { isDemoMode: false, demoOrgId: null };
}

export function blockDemoMutation(request: Request): NextResponse | null {
  if (request.method === "GET" || request.method === "OPTIONS") {
    return null;
  }
  const { isDemoMode } = resolveDemoOrg(request);
  if (isDemoMode) {
    return NextResponse.json(
      {
        error:
          "This action is not available in Demo Mode. Toggle off to work with your real data.",
      },
      { status: 403 }
    );
  }
  return null;
}

export function resolveScopedOrgWithDemo(
  request: Request,
  adminOrgId: string | null
): string | null {
  const { isDemoMode, demoOrgId } = resolveDemoOrg(request);
  return isDemoMode ? demoOrgId : adminOrgId;
}
