import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

type RequestLike = Request & {
  headers: {
    get(name: string): string | null;
  };
};

type AdminRole = "admin" | "super_admin";

type AdminProfile = {
  id: string;
  role: string | null;
  organization_id: string | null;
};

type RequireAdminFailure = {
  ok: false;
  response: NextResponse;
};

type RequireAdminSuccess = {
  ok: true;
  userId: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
  role: AdminRole;
  profile: AdminProfile;
  adminClient: ReturnType<typeof createAdminClient>;
};

export type RequireAdminResult = RequireAdminFailure | RequireAdminSuccess;

type RequireAdminOptions = {
  requireOrganization?: boolean;
};

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function normalizeBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

function parseRole(input: string | null): AdminRole | null {
  const role = (input || "").toLowerCase();
  if (role === "admin") return "admin";
  if (role === "super_admin") return "super_admin";
  return null;
}

async function getUserIdFromRequest(
  request: RequestLike,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const token = normalizeBearerToken(request.headers.get("authorization"));

  if (token) {
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);
    if (!authError && user) {
      return user.id;
    }
  }

  try {
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function requireAdmin(
  request: RequestLike,
  options: RequireAdminOptions = {}
): Promise<RequireAdminResult> {
  const requireOrganization = options.requireOrganization !== false;
  const adminClient = createAdminClient();
  const userId = await getUserIdFromRequest(request, adminClient);
  if (!userId) {
    return {
      ok: false,
      response: jsonError("Unauthorized", 401),
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      ok: false,
      response: jsonError("Forbidden", 403),
    };
  }

  const parsedRole = parseRole(profile.role);
  if (!parsedRole) {
    return {
      ok: false,
      response: jsonError("Forbidden", 403),
    };
  }

  if (requireOrganization && !profile.organization_id && parsedRole !== "super_admin") {
    return {
      ok: false,
      response: jsonError("Admin organization not configured", 400),
    };
  }

  return {
    ok: true,
    userId,
    organizationId: profile.organization_id,
    isSuperAdmin: parsedRole === "super_admin",
    role: parsedRole,
    profile,
    adminClient,
  };
}
