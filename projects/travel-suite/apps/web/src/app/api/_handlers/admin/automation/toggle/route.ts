import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getTemplateById, buildDefaultRuleConfig } from "@/lib/automation/templates";
import { logError } from "@/lib/observability/logger";

const AUTOMATION_TOGGLE_RATE_LIMIT_MAX = 30;
const AUTOMATION_TOGGLE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

/**
 * POST /api/admin/automation/toggle
 *
 * Enable or disable an automation rule
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: true });
    if (!admin.ok) {
      return apiError(
        "Unauthorized",
        admin.response.status || 401,
      );
    }

    if (!admin.organizationId) {
      return apiError("Organization ID is required", 400);
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: AUTOMATION_TOGGLE_RATE_LIMIT_MAX,
      windowMs: AUTOMATION_TOGGLE_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:automation:toggle",
    });
    if (!rateLimit.success) {
      return apiError(
        "Too many automation toggle requests. Please retry later.",
        429,
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON in request body", 400);
    }

    if (typeof body !== "object" || body === null) {
      return apiError("Request body must be an object", 400);
    }

    const requestBody = body as Record<string, unknown>;

    // Validate rule_type
    const ruleType = sanitizeText(requestBody.rule_type, { maxLength: 80 });
    if (!ruleType) {
      return apiError("rule_type is required", 400);
    }

    // Validate template exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = getTemplateById(ruleType as any);
    if (!template) {
      return apiError("Invalid rule_type", 400);
    }

    // Validate enabled flag
    const enabled = requestBody.enabled;
    if (typeof enabled !== "boolean") {
      return apiError("enabled must be a boolean", 400);
    }

    // Check if rule already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingRule, error: fetchError } = await (admin.adminClient as any)
      .from("automation_rules")
      .select("*")
      .eq("organization_id", admin.organizationId)
      .eq("rule_type", ruleType)
      .maybeSingle();

    if (fetchError) {
      logError("Error fetching automation rule", fetchError, { route: "/api/admin/automation/toggle" });
      return apiError("Failed to fetch automation rule", 500);
    }

    // If rule exists, update it
    if (existingRule) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedRule, error: updateError } = await (admin.adminClient as any)
        .from("automation_rules")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", existingRule.id)
        .select()
        .single();

      if (updateError) {
        logError("Error updating automation rule", updateError, { route: "/api/admin/automation/toggle" });
        return apiError("Failed to update automation rule", 500);
      }

      return apiSuccess({
        rule: updatedRule,
        message: `Automation rule ${enabled ? "enabled" : "disabled"} successfully`,
      });
    }

    // If rule doesn't exist, create it with default config
    const defaultConfig = buildDefaultRuleConfig(template.id);
    if (!defaultConfig) {
      return apiError("Failed to build default rule config", 500);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newRule, error: createError } = await (admin.adminClient as any)
      .from("automation_rules")
      .insert({
        organization_id: admin.organizationId,
        rule_type: ruleType,
        enabled,
        trigger_config: defaultConfig.trigger_config,
        action_config: defaultConfig.action_config,
      })
      .select()
      .single();

    if (createError) {
      logError("Error creating automation rule", createError, { route: "/api/admin/automation/toggle" });
      return apiError("Failed to create automation rule", 500);
    }

    return apiSuccess({
      rule: newRule,
      message: `Automation rule created and ${enabled ? "enabled" : "disabled"} successfully`,
    }, 201);
  } catch (error) {
    logError("Automation toggle endpoint error", error, { route: "/api/admin/automation/toggle" });
    return apiError("Internal server error", 500);
  }
}
