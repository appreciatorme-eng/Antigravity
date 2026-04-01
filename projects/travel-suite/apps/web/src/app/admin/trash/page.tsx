"use client";

import { useState, useEffect, useCallback } from "react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { Trash2, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

type SoftDeletableTable = "trips" | "proposals" | "clients" | "invoices";

interface DeletedItem {
  id: string;
  deleted_at: string;
  days_remaining: number;
  [key: string]: unknown;
}

const TABLE_LABELS: Record<SoftDeletableTable, string> = {
  trips: "Trips",
  proposals: "Proposals",
  clients: "Clients",
  invoices: "Invoices",
};

const DISPLAY_FIELD: Record<SoftDeletableTable, string[]> = {
  trips: ["title", "name", "destination"],
  proposals: ["title", "name", "client_name"],
  clients: ["full_name", "name", "company_name", "email"],
  invoices: ["invoice_number", "title", "name"],
};

function getItemDisplayName(item: DeletedItem, table: SoftDeletableTable): string {
  const fields = DISPLAY_FIELD[table];
  for (const field of fields) {
    const value = item[field];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return `${table.slice(0, -1)} #${item.id.slice(0, 8)}`;
}

function formatDeletedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TrashTable({
  table,
  onRestored,
}: {
  table: SoftDeletableTable;
  onRestored: () => void;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/trash/list?table=${table}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const json = await res.json();
      setItems(json.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  async function handleRestore(id: string) {
    try {
      setRestoringId(id);
      const res = await authedFetch("/api/admin/trash/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ table, id }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          (json as { error?: string } | null)?.error ?? `Restore failed: ${res.statusText}`,
        );
      }

      toast({
        title: `${TABLE_LABELS[table].slice(0, -1)} restored successfully`,
        variant: "success",
      });

      setItems((prev) => prev.filter((item) => item.id !== id));
      onRestored();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Restore failed",
        variant: "error",
      });
    } finally {
      setRestoringId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-[#00d084] animate-spin" />
        <span className="ml-2 text-sm text-white/50">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-rose-400 mb-2" />
        <p className="text-sm text-white/50">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trash2 className="h-8 w-8 text-white/30 mb-2" />
        <p className="text-sm text-white/50">No deleted {TABLE_LABELS[table].toLowerCase()} found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
              Deleted
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
              Days Remaining
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-sm text-white">
                {getItemDisplayName(item, table)}
              </td>
              <td className="px-4 py-3 text-sm text-white/60">
                {formatDeletedDate(item.deleted_at)}
              </td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={
                    item.days_remaining <= 7
                      ? "text-rose-400 font-medium"
                      : "text-white/60"
                  }
                >
                  {item.days_remaining} {item.days_remaining === 1 ? "day" : "days"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-right">
                <button
                  onClick={() => handleRestore(item.id)}
                  disabled={restoringId === item.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {restoringId === item.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                  Restore
                </button>
                <button
                  disabled
                  className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/30 cursor-not-allowed"
                  title="Permanent deletion coming soon"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<SoftDeletableTable>("trips");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRestored() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-[#00d084]" />
            Trash
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Deleted items are kept for 30 days before permanent removal
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as SoftDeletableTable)}
          >
            <div className="border-b border-white/10 px-4 pt-3">
              <TabsList className="bg-transparent gap-2">
                {(Object.keys(TABLE_LABELS) as SoftDeletableTable[]).map(
                  (table) => (
                    <TabsTrigger
                      key={table}
                      value={table}
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"
                    >
                      {TABLE_LABELS[table]}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </div>

            {(Object.keys(TABLE_LABELS) as SoftDeletableTable[]).map(
              (table) => (
                <TabsContent key={`${table}-${refreshKey}`} value={table}>
                  <TrashTable table={table} onRestored={handleRestored} />
                </TabsContent>
              ),
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
