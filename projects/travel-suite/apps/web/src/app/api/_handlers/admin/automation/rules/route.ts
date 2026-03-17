import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AUTOMATION_TEMPLATES, getTemplateById } from "@/lib/automation/templates";

const AUTOMATION_RULES_RATE_LIMIT_MAX = 60;
const AUTOMATION_RULES_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function resolveScopedOrganizationId(
  admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
  request: NextRequest,
): { organizationId: string | null } | { error: NextResponse } {
  const requestedOrganizationId = sanitizeText(
    request.nextUrl.searchParams.get("organization_id"),
    { maxLength: 80 },
  );

  if (admin.isSuperAdmin) {
    return { organizationId: requestedOrganizationId || null };
  }

  if (!admin.organizationId) {
    return {
      error: apiError("Admin organization not configured", 400),
    };
  }

  if (
    requestedOrganizationId &&
    requestedOrganizationId !== admin.organizationId
  ) {
    return {
      error: apiError("Cannot access another organization scope", 403),
    };
  }

  return { organizationId: admin.organizationId };
}

/**
 * GET /api/admin/automation/rules
 *
 * List automation rules for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return apiError(
        "Unauthorized",
        admin.response.status || 401,
      );
    }

    const scopedOrg = resolveScopedOrganizationId(admin, req);
    if ("error" in scopedOrg) return scopedOrg.error;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: AUTOMATION_RULES_RATE_LIMIT_MAX,
      windowMs: AUTOMATION_RULES_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:automation:rules",
    });
    if (!rateLimit.success) {
      return apiError(
        "Too many automation rules requests. Please retry later.",
        429,
      );
    }

    // Build query for automation rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rulesQuery = (admin.adminClient as any)
      .from("automation_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (scopedOrg.organizationId) {
      rulesQuery = rulesQuery.eq("organization_id", scopedOrg.organizationId);
    }

    const { data: rules, error: rulesError } = await rulesQuery;

    if (rulesError) {
      console.error("Error fetching automation rules:", rulesError);
      return apiError("Failed to fetch automation rules", 500);
    }

    // Enrich rules with template metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedRules = (rules || []).map((rule: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const template = getTemplateById(rule.rule_type as any);
      return {
        id: rule.id,
        organization_id: rule.organization_id,
        rule_type: rule.rule_type,
        enabled: rule.enabled,
        trigger_config: rule.trigger_config,
        action_config: rule.action_config,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        template: template
          ? {
              name: template.name,
              description: template.description,
              category: template.category,
              stop_conditions: template.stop_conditions,
            }
          : null,
      };
    });

    // If no rules exist yet, return templates as available rules to create
    if (enrichedRules.length === 0 && scopedOrg.organizationId) {
      const availableTemplates = AUTOMATION_TEMPLATES.map((template) => ({
        rule_type: template.id,
        enabled: false,
        template: {
          name: template.name,
          description: template.description,
          category: template.category,
          trigger_config: template.trigger_config,
          action_config: template.action_config,
          stop_conditions: template.stop_conditions,
        },
      }));

      return apiSuccess({ rules: availableTemplates, templates: AUTOMATION_TEMPLATES });
    }

    return apiSuccess({ rules: enrichedRules, templates: AUTOMATION_TEMPLATES });
  } catch (error) {
    console.error("Automation rules endpoint error:", error);
    return apiError("Internal server error", 500);
  }
}
