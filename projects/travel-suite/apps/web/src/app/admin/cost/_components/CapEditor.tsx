"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import { BarChart3, Loader2 } from "lucide-react";
import type { CostCategory } from "./types";
import { CATEGORY_LABEL, CATEGORY_COLOR, formatUsd } from "./types";

export interface CapEditorProps {
  readonly emergencyCapsUsd: Record<CostCategory, number>;
  readonly onCapSaved: () => Promise<void>;
}

export function CapEditor({ emergencyCapsUsd, onCapSaved }: CapEditorProps) {
  const { toast } = useToast();
  const [capDrafts, setCapDrafts] = useState<Record<CostCategory, string>>({
    amadeus: String(emergencyCapsUsd.amadeus.toFixed(2)),
    image_search: String(emergencyCapsUsd.image_search.toFixed(2)),
    ai_image: String(emergencyCapsUsd.ai_image.toFixed(2)),
  });
  const [savingCategory, setSavingCategory] = useState<CostCategory | null>(
    null,
  );

  const saveEmergencyCap = useCallback(
    async (category: CostCategory) => {
      const draft = Number(capDrafts[category]);
      if (!Number.isFinite(draft) || draft <= 0) {
        toast({
          title: "Invalid cap",
          description: "Emergency cap must be a positive number.",
          variant: "error",
        });
        return;
      }

      setSavingCategory(category);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Unauthorized");
        }

        const response = await fetch("/api/admin/cost/overview", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            capUsd: draft,
          }),
        });

        const json = (await response.json()) as {
          category?: string;
          cap_usd?: number;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(json.error || "Failed to update emergency cap");
        }

        toast({
          title: "Emergency cap updated",
          description: `${CATEGORY_LABEL[category]} is now capped at ${formatUsd(json.cap_usd || draft)}.`,
          variant: "success",
        });
        await onCapSaved();
      } catch (updateError) {
        toast({
          title: "Update failed",
          description:
            updateError instanceof Error
              ? updateError.message
              : "Unable to save cap",
          variant: "error",
        });
      } finally {
        setSavingCategory(null);
      }
    },
    [capDrafts, onCapSaved, toast],
  );

  return (
    <GlassCard padding="lg" className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-serif text-secondary dark:text-white">
          Emergency Cap Controls
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(CATEGORY_LABEL) as CostCategory[]).map((category) => (
          <div
            key={category}
            className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3"
          >
            <div>
              <p className={`text-sm font-bold ${CATEGORY_COLOR[category]}`}>
                {CATEGORY_LABEL[category]}
              </p>
              <p className="text-xs text-text-muted">
                Current cap: {formatUsd(emergencyCapsUsd[category] || 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={capDrafts[category]}
                onChange={(event) =>
                  setCapDrafts((previous) => ({
                    ...previous,
                    [category]: event.target.value,
                  }))
                }
                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <GlassButton
                className="h-9 rounded-lg px-3"
                disabled={savingCategory === category}
                onClick={() => void saveEmergencyCap(category)}
              >
                {savingCategory === category ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </GlassButton>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
