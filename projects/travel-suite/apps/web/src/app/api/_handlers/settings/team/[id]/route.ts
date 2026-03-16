import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { canManageRole, type TeamRole } from "@/lib/team/roles";
import {
  mapProfileRoleToTeamRole,
  mapTeamRoleToProfileRole,
  requireTeamManager,
  resolveTeamContext,
} from "../shared";
import { logError } from "@/lib/observability/logger";

const UpdateTeamMemberSchema = z.object({
  role: z.enum(["manager", "agent", "driver"]),
});

export async function PATCH(
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
    const body = await request.json().catch(() => null);
    const parsed = UpdateTeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid role update payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const { data: targetMember, error: targetError } = await context.admin
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      logError("[settings/team/:id] failed to load member", targetError);
      return apiError("Failed to load team member", 500);
    }

    if (!targetMember || targetMember.organization_id !== context.organization.id) {
      return apiError("Team member not found", 404);
    }

    if (targetMember.id === context.organization.owner_id) {
      return apiError("The workspace owner cannot be reassigned", 400);
    }

    const currentRole = mapProfileRoleToTeamRole(
      targetMember.role,
      targetMember.id,
      context.organization.owner_id
    );
    const nextRole = parsed.data.role as TeamRole;

    if (!canManageRole(context.actorRole, currentRole) || !canManageRole(context.actorRole, nextRole)) {
      return apiError("You cannot change that member role", 403);
    }

    const { error: updateError } = await context.admin
      .from("profiles")
      .update({
        role: mapTeamRoleToProfileRole(nextRole),
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetMember.id);

    if (updateError) {
      logError("[settings/team/:id] failed to update role", updateError);
      return apiError("Failed to update team member", 500);
    }

    return apiSuccess({ id: targetMember.id, role: nextRole });
  } catch (error) {
    logError("[settings/team/:id] unexpected patch error", error);
    return apiError("Failed to update team member", 500);
  }
}

export async function DELETE(
  _request: Request,
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
      .select("id, role, organization_id")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      logError("[settings/team/:id] failed to load removable member", targetError);
      return apiError("Failed to load team member", 500);
    }

    if (!targetMember || targetMember.organization_id !== context.organization.id) {
      return apiError("Team member not found", 404);
    }

    if (targetMember.id === context.organization.owner_id) {
      return apiError("The workspace owner cannot be removed", 400);
    }

    const currentRole = mapProfileRoleToTeamRole(
      targetMember.role,
      targetMember.id,
      context.organization.owner_id
    );

    if (!canManageRole(context.actorRole, currentRole)) {
      return apiError("You cannot remove that member", 403);
    }

    const { error: removeError } = await context.admin
      .from("profiles")
      .update({
        organization_id: null,
        role: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetMember.id);

    if (removeError) {
      logError("[settings/team/:id] failed to remove member", removeError);
      return apiError("Failed to remove team member", 500);
    }

    return apiSuccess({ id: targetMember.id, removed: true });
  } catch (error) {
    logError("[settings/team/:id] unexpected delete error", error);
    return apiError("Failed to remove team member", 500);
  }
}
