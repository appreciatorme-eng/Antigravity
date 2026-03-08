import { apiError, apiSuccess } from "@/lib/api/response";
import { sendTeamInviteNotification } from "@/lib/email/notifications";
import { canManageRole } from "@/lib/team/roles";
import {
  mapProfileRoleToTeamRole,
  requireTeamManager,
  resolveTeamContext,
} from "../../shared";

const DEFAULT_INVITE_REDIRECT_PATH = "/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { data: targetMember, error: targetError } = await context.admin
      .from("profiles")
      .select("id, email, full_name, role, organization_id")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error("[settings/team/:id/resend] failed to load member:", targetError);
      return apiError("Failed to load team member", 500);
    }

    if (!targetMember || targetMember.organization_id !== context.organization.id) {
      return apiError("Team member not found", 404);
    }

    const teamRole = mapProfileRoleToTeamRole(
      targetMember.role,
      targetMember.id,
      context.organization.owner_id
    );
    if (!canManageRole(context.actorRole, teamRole)) {
      return apiError("You cannot resend an invite for that member", 403);
    }

    if (!targetMember.email) {
      return apiError("That member does not have an email address on file", 400);
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;
    const redirectTo = new URL(DEFAULT_INVITE_REDIRECT_PATH, appUrl).toString();

    const inviteResponse = await context.admin.auth.admin.inviteUserByEmail(targetMember.email, {
      redirectTo,
      data: {
        full_name: targetMember.full_name,
        organization_id: context.organization.id,
      },
    });

    if (inviteResponse.error) {
      console.error("[settings/team/:id/resend] inviteUserByEmail failed:", inviteResponse.error);
      return apiError("Failed to resend invite", 500);
    }

    void sendTeamInviteNotification({
      to: targetMember.email,
      organizationName: context.organization.name,
      inviterName: context.actorProfile.full_name || context.organization.name,
      role: teamRole,
      inviteUrl: redirectTo,
    });

    return apiSuccess({ id: targetMember.id, resent: true });
  } catch (error) {
    console.error("[settings/team/:id/resend] unexpected error:", error);
    return apiError("Failed to resend invite", 500);
  }
}
