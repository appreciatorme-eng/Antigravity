import { createAdminClient } from "@/lib/supabase/admin";

const supabaseAdmin = createAdminClient();

/**
 * Validates that the Authorization header contains a Bearer token belonging
 * to an admin or super_admin user. Used by cron and notification endpoints
 * that accept manual triggering by admin users.
 */
export async function isAdminBearerToken(
  authHeader: string | null,
): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.substring(7);

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) return false;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  return profile?.role === "admin" || profile?.role === "super_admin";
}
