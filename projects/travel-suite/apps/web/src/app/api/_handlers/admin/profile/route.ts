import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

const PROFILE_SELECT = "id, full_name, email, avatar_url";

const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(180),
  email: z.string().trim().email().max(320),
  avatar_url: z.string().trim().url().max(2048).optional().nullable().or(z.literal("")),
});

type AdminClient = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>["adminClient"];

async function loadProfile(adminClient: AdminClient, userId: string) {
  const [{ data: profile, error: profileError }, authResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .maybeSingle(),
    adminClient.auth.admin.getUserById(userId),
  ]);

  return {
    profile,
    profileError,
    authUser: authResult.data.user ?? null,
    authError: authResult.error ?? null,
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: false });
    if (!auth.ok) return auth.response;

    const { profile, profileError, authUser, authError } = await loadProfile(auth.adminClient, auth.userId);
    if (profileError) {
      logError("[admin/profile:GET] Failed to load profile", profileError);
      return apiError("Failed to load profile", 500);
    }
    if (authError) {
      logError("[admin/profile:GET] Failed to load auth user", authError);
    }

    return apiSuccess({
      profile: {
        id: auth.userId,
        full_name: profile?.full_name ?? authUser?.user_metadata?.full_name ?? "",
        email: authUser?.email ?? profile?.email ?? "",
        avatar_url: profile?.avatar_url ?? null,
      },
    });
  } catch (error) {
    logError("[admin/profile:GET] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: false });
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid profile details", 400);
    }

    const { profileError, authUser, authError } = await loadProfile(auth.adminClient, auth.userId);
    if (profileError) {
      logError("[admin/profile:PATCH] Failed to load current profile", profileError);
      return apiError("Failed to load profile", 500);
    }
    if (authError) {
      logError("[admin/profile:PATCH] Failed to load auth user", authError);
      return apiError("Failed to load account details", 500);
    }

    const nextFullName = parsed.data.full_name.trim();
    const nextEmail = parsed.data.email.trim().toLowerCase();
    const nextAvatarUrl = parsed.data.avatar_url || null;

    const currentMetadata =
      authUser?.user_metadata && typeof authUser.user_metadata === "object" && !Array.isArray(authUser.user_metadata)
        ? authUser.user_metadata
        : {};

    if (authUser && (authUser.email !== nextEmail || currentMetadata.full_name !== nextFullName)) {
      const { error: authUpdateError } = await auth.adminClient.auth.admin.updateUserById(auth.userId, {
        email: nextEmail,
        user_metadata: {
          ...currentMetadata,
          full_name: nextFullName,
        },
      });
      if (authUpdateError) {
        logError("[admin/profile:PATCH] Failed to update auth user", authUpdateError);
        return apiError("Failed to update account email", 500);
      }
    }

    const { error: updateError } = await auth.adminClient
      .from("profiles")
      .update({
        full_name: nextFullName,
        email: nextEmail,
        avatar_url: nextAvatarUrl,
      })
      .eq("id", auth.userId);

    if (updateError) {
      logError("[admin/profile:PATCH] Failed to update profile", updateError);
      return apiError("Failed to save profile", 500);
    }

    const refreshed = await loadProfile(auth.adminClient, auth.userId);
    if (refreshed.profileError) {
      logError("[admin/profile:PATCH] Failed to reload profile", refreshed.profileError);
      return apiError("Profile saved, but failed to reload it", 500);
    }

    return apiSuccess({
      profile: {
        id: auth.userId,
        full_name: refreshed.profile?.full_name ?? nextFullName,
        email: refreshed.authUser?.email ?? refreshed.profile?.email ?? nextEmail,
        avatar_url: refreshed.profile?.avatar_url ?? nextAvatarUrl,
      },
    });
  } catch (error) {
    logError("[admin/profile:PATCH] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}
