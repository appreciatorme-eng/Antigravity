import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

type TripRequestProfileRow = {
  id: string;
  role: string | null;
  organization_id: string | null;
  full_name: string | null;
};

type TripRequestOrganizationRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
};

export type TripRequestRouteContext = {
  admin: ReturnType<typeof createAdminClient>;
  user: User;
  actorProfile: TripRequestProfileRow;
  organization: TripRequestOrganizationRow;
};

type ResolveTripRequestRouteContextResult =
  | { context: TripRequestRouteContext; response?: never }
  | { context?: never; response: Response };

export async function resolveTripRequestRouteContext(): Promise<ResolveTripRequestRouteContextResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: Response.json({ data: null, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = createAdminClient();
  const { data: actorProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, organization_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logError("[trip-requests] failed to load actor profile", profileError);
    return {
      response: Response.json({ data: null, error: "Failed to load profile" }, { status: 500 }),
    };
  }

  if (!actorProfile?.organization_id) {
    return {
      response: Response.json({ data: null, error: "Organization not found" }, { status: 404 }),
    };
  }

  if (!["admin", "super_admin"].includes(actorProfile.role ?? "")) {
    return {
      response: Response.json({ data: null, error: "Forbidden" }, { status: 403 }),
    };
  }

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id, name, owner_id")
    .eq("id", actorProfile.organization_id)
    .maybeSingle();

  if (organizationError) {
    logError("[trip-requests] failed to load organization", organizationError);
    return {
      response: Response.json({ data: null, error: "Failed to load organization" }, { status: 500 }),
    };
  }

  if (!organization) {
    return {
      response: Response.json({ data: null, error: "Organization not found" }, { status: 404 }),
    };
  }

  return {
    context: {
      admin,
      user,
      actorProfile,
      organization,
    },
  };
}
