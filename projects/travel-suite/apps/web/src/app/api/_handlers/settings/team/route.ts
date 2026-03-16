import { apiError, apiSuccess } from "@/lib/api/response";
import { loadTeamMembers, requireTeamManager, resolveTeamContext } from "./shared";
import { logError } from "@/lib/observability/logger";

export async function GET() {
  try {
    const result = await resolveTeamContext();
    if (result.response) {
      return result.response;
    }

    const { context } = result;
    const { members, stats } = await loadTeamMembers(context);

    return apiSuccess({
      members,
      stats,
      currentUserRole: context.actorRole,
      organizationName: context.organization.name,
      viewerCanManageTeam: context.actorRole === "owner" || context.actorRole === "manager",
    });
  } catch (error) {
    logError("[settings/team] failed to load members", error);
    return apiError("Failed to load team members", 500);
  }
}

export async function POST() {
  const result = await resolveTeamContext();
  if (result.response) {
    return result.response;
  }

  const forbidden = requireTeamManager(result.context);
  if (forbidden) {
    return forbidden;
  }

  return apiError("Use /api/settings/team/invite to invite members", 405);
}
