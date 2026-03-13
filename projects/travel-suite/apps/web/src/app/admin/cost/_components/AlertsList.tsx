"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import type { CostAlert, CostOverviewPayload } from "./types";

export interface AlertsListProps {
  readonly alerts: readonly CostAlert[];
  readonly onPayloadChange: (
    updater: (previous: CostOverviewPayload | null) => CostOverviewPayload | null,
  ) => void;
}

export function AlertsList({ alerts, onPayloadChange }: AlertsListProps) {
  const { toast } = useToast();
  const [acknowledgingAlertId, setAcknowledgingAlertId] = useState<
    string | null
  >(null);

  const acknowledgeAlert = useCallback(
    async (alert: CostAlert) => {
      if (alert.acknowledged) {
        return;
      }

      setAcknowledgingAlertId(alert.id);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Unauthorized");
        }

        const response = await fetch("/api/admin/cost/alerts/ack", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alert_id: alert.id,
            organization_id: alert.organization_id,
          }),
        });

        const json = (await response.json()) as {
          error?: string;
          acknowledged_at?: string;
          acknowledged_by?: string;
        };
        if (!response.ok) {
          throw new Error(json.error || "Failed to acknowledge alert");
        }

        onPayloadChange((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            alerts: previous.alerts.map((item) =>
              item.id === alert.id
                ? {
                    ...item,
                    acknowledged: true,
                    acknowledged_at:
                      json.acknowledged_at || new Date().toISOString(),
                    acknowledged_by: json.acknowledged_by || "current_admin",
                  }
                : item,
            ),
          };
        });

        toast({
          title: "Alert acknowledged",
          description: "Ownership has been recorded for this alert.",
          variant: "success",
        });
      } catch (ackError) {
        toast({
          title: "Acknowledge failed",
          description:
            ackError instanceof Error
              ? ackError.message
              : "Unable to acknowledge alert",
          variant: "error",
        });
      } finally {
        setAcknowledgingAlertId(null);
      }
    },
    [onPayloadChange, toast],
  );

  return (
    <GlassCard
      padding="lg"
      className={
        alerts.length > 0
          ? "border-rose-200/70 bg-rose-50/40"
          : "border-emerald-200/70 bg-emerald-50/30"
      }
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">
            Anomaly Alerts
          </p>
          <h2 className="text-lg font-serif text-secondary dark:text-white mt-1">
            Cost and abuse signals with runbooks
          </h2>
        </div>
        <span
          className={`text-xs font-black px-2 py-1 rounded-lg border ${alerts.length > 0 ? "text-rose-700 bg-rose-50 border-rose-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}`}
        >
          {alerts.length > 0 ? `${alerts.length} active` : "No active alerts"}
        </span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-text-muted">
          No cost spikes, cap-hit anomalies, or repeated admin auth failures
          in the current window.
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 12).map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-rose-100 bg-white p-3"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    {alert.title}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {alert.organization_name} · {alert.description}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {alert.metric_value} · Owner: {alert.owner} · SLA{" "}
                    {alert.runbook.response_sla_minutes}m
                  </p>
                  {alert.acknowledged_at ? (
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Acknowledged at{" "}
                      {new Date(alert.acknowledged_at).toLocaleString(
                        "en-US",
                      )}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${alert.severity === "high" ? "text-rose-700 bg-rose-50 border-rose-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}
                >
                  {alert.severity}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={alert.runbook.url}
                  className="inline-flex text-[11px] font-bold text-primary hover:underline"
                >
                  Open runbook ({alert.runbook.version})
                </a>
                <button
                  type="button"
                  onClick={() => void acknowledgeAlert(alert)}
                  disabled={
                    alert.acknowledged || acknowledgingAlertId === alert.id
                  }
                  className={`h-7 px-3 rounded-md border text-[11px] font-bold transition-colors ${
                    alert.acknowledged
                      ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                      : "text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {acknowledgingAlertId === alert.id ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving
                    </span>
                  ) : alert.acknowledged ? (
                    "Acknowledged"
                  ) : (
                    "Acknowledge"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
