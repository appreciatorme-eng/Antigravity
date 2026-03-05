// Thin guard that asserts the authenticated user is a super_admin.
// Every /api/superadmin/* handler must call this at the top.

import { NextResponse } from "next/server";
import { requireAdmin, type RequireAdminResult } from "@/lib/auth/admin";

type RequestLike = Request & { headers: { get(name: string): string | null } };

type RequireSuperAdminSuccess = Extract<RequireAdminResult, { ok: true }>;

type RequireSuperAdminFailure = {
  ok: false;
  response: NextResponse;
};

export type RequireSuperAdminResult =
  | RequireSuperAdminSuccess
  | RequireSuperAdminFailure;

export async function requireSuperAdmin(
  request: RequestLike
): Promise<RequireSuperAdminResult> {
  const result = await requireAdmin(request, { requireOrganization: false });

  if (!result.ok) {
    return result;
  }

  if (!result.isSuperAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: super_admin role required" },
        { status: 403 }
      ),
    };
  }

  return result;
}
