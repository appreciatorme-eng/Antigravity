import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { canManageRole, type TeamRole } from "@/lib/team/roles";
import {
  mapProfileRoleToTeamRole,
  mapTeamRoleToProfileRole,
  requireTeamManager,
  resolveTeamContext,
} from "../shared";

const InviteTeamMemberSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(["manager", "agent", "driver"]),
});

const DEFAULT_INVITE_REDIRECT_PATH = "/auth";

export async function POST(request: Request) {
  try {
    const result = await resolveTeamContext();
    if (result.response) {
      return result.response;
    }

    const { context } = result;
    const forbidden = requireTeamManager(context);
    if (forbidden) {
      return forbidden;
    }

    const body = await request.json().catch(() => null);
    const parsed = InviteTeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid invite payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const { email, name, phone, role } = parsed.data;

    if (!canManageRole(context.actorRole, role as TeamRole)) {
      return apiError("You cannot invite members with that role", 403);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data: existingProfile, error: existingProfileError } = await context.admin
      .from("profiles")
      .select("id, email, organization_id, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfileError) {
      console.error("[settings/team/invite] failed to check existing profile:", existingProfileError);
      return apiError("Failed to prepare invite", 500);
    }

    if (existingProfile?.organization_id === context.organization.id) {
      return apiError("That member is already part of your team", 409);
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;
    const redirectTo = new URL(DEFAULT_INVITE_REDIRECT_PATH, appUrl).toString();

    let invitedUserId = existingProfile?.id ?? null;

    if (!invitedUserId) {
      const inviteResponse = await context.admin.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: {
          full_name: name,
          organization_id: context.organization.id,
        },
      });

      if (inviteResponse.error) {
        console.error("[settings/team/invite] inviteUserByEmail failed:", inviteResponse.error);
        return apiError("Failed to send invite email", 500);
      }

      invitedUserId = inviteResponse.data.user?.id ?? null;
    }

    if (!invitedUserId) {
      return apiError("Invite did not return a user record", 500);
    }

    const mappedRole = mapTeamRoleToProfileRole(role);
    const { error: upsertError } = await context.admin.from("profiles").upsert(
      {
        id: invitedUserId,
        organization_id: context.organization.id,
        role: mappedRole,
        full_name: name,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("[settings/team/invite] failed to upsert invited profile:", upsertError);
      return apiError("Failed to provision invited member", 500);
    }

    const effectiveRole = mapProfileRoleToTeamRole(mappedRole, invitedUserId, context.organization.owner_id);

    return apiSuccess({
      id: invitedUserId,
      email: normalizedEmail,
      name,
      role: effectiveRole,
      invited: true,
    });
  } catch (error) {
    console.error("[settings/team/invite] unexpected error:", error);
    return apiError("Failed to invite team member", 500);
  }
}
