// GET /api/superadmin/me — lightweight identity check for the god-mode layout.
// Returns the caller's role so the client layout doesn't need a browser-side DB query.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ role: auth.role, userId: auth.userId });
}
