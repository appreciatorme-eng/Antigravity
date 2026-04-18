// Event-driven autopilot trigger — fires immediately on business events instead of waiting for the daily cron.
// Use triggerEventAutopilot() as fire-and-forget from webhook handlers.

import { createAdminClient } from "@/lib/supabase/admin";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { logPlatformAction } from "@/lib/platform/audit";
import { logError, logEvent } from "@/lib/observability/logger";
import { scheduleBackgroundTask } from "@/lib/server/background";

// Maps external event names to the trigger types runBusinessOsEventAutomation accepts
const TRIGGER_MAP = {
    payment_failed: "collections_updated",
    payment_captured: "collections_updated",
    new_signup: "account_state_updated",
    comms_updated: "comms_updated",
    work_item_updated: "work_item_updated",
} as const satisfies Record<string, Parameters<typeof runBusinessOsEventAutomation>[1]["trigger"]>;

export type EventAutopilotTrigger = keyof typeof TRIGGER_MAP;

export function triggerEventAutopilot(orgId: string, trigger: EventAutopilotTrigger): void {
    scheduleBackgroundTask(
        runBusinessOsEventAutomation(createAdminClient() as never, {
            orgId,
            currentUserId: null,
            trigger: TRIGGER_MAP[trigger],
        })
            .then((result) => {
                void logPlatformAction(null, "Autopilot: Event trigger run", "automation", {
                    org_id: orgId,
                    trigger,
                    success: true,
                    state_updated: result?.state_updated ?? false,
                    work_items_created: result?.work_items_created ?? 0,
                });
                logEvent("info", "[event-autopilot] Completed", {
                    orgId,
                    trigger,
                    stateUpdated: result?.state_updated,
                    workItemsCreated: result?.work_items_created,
                });
            })
            .catch((err: unknown) => {
                void logPlatformAction(null, "Autopilot: Event trigger run", "automation", {
                    org_id: orgId,
                    trigger,
                    success: false,
                });
                logError("[event-autopilot] Failed", err, { orgId, trigger });
            }),
    );
}
