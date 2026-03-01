import { NextResponse } from "next/server";

export function ensureMockEndpointAllowed(endpoint: string): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Not implemented in production",
        code: "mock_disabled_in_production",
        endpoint,
      },
      { status: 501 }
    );
  }

  const explicitMockEnable = process.env.ENABLE_MOCK_ENDPOINTS === "true";
  if (process.env.NODE_ENV !== "development" && !explicitMockEnable) {
    return NextResponse.json(
      {
        error: "Mock endpoint is disabled for this environment",
        code: "mock_disabled",
        endpoint,
      },
      { status: 403 }
    );
  }

  return null;
}
