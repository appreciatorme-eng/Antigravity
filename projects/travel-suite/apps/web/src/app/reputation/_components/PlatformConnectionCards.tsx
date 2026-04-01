"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import type {
  ReputationPlatformConnection,
  ConnectionPlatform,
} from "@/lib/reputation/types";

interface PlatformConnectionCardsProps {
  connections: ReputationPlatformConnection[];
  onConnectionsChanged?: () => Promise<void> | void;
}

interface PlatformInfo {
  id: ConnectionPlatform;
  label: string;
  color: string;
  icon: string;
}

const PLATFORMS: PlatformInfo[] = [
  { id: "google_business", label: "Google Business", color: "#4285F4", icon: "G" },
  { id: "tripadvisor", label: "TripAdvisor", color: "#34E0A1", icon: "T" },
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "f" },
  { id: "makemytrip", label: "MakeMyTrip", color: "#EB2026", icon: "M" },
];

function formatLastSynced(dateStr: string | null): string {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface ConnectFormData {
  platform_account_id: string;
  platform_account_name: string;
}

export default function PlatformConnectionCards({
  connections,
  onConnectionsChanged,
}: PlatformConnectionCardsProps) {
  const [connectingPlatform, setConnectingPlatform] =
    useState<ConnectionPlatform | null>(null);
  const [formData, setFormData] = useState<ConnectFormData>({
    platform_account_id: "",
    platform_account_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [localConnections, setLocalConnections] =
    useState<ReputationPlatformConnection[]>(connections);

  useEffect(() => {
    setLocalConnections(connections);
  }, [connections]);

  const connectedMap = new Map<ConnectionPlatform, ReputationPlatformConnection>();
  for (const conn of localConnections) {
    connectedMap.set(conn.platform, conn);
  }

  const handleConnect = async (platform: ConnectionPlatform) => {
    if (!formData.platform_account_id.trim() || !formData.platform_account_name.trim()) {
      setError("All fields are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const res = await authedFetch("/api/reputation/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          platform_account_id: formData.platform_account_id.trim(),
          platform_account_name: formData.platform_account_name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to connect");
        return;
      }

      setLocalConnections((prev) => [...prev, data.connection]);
      await onConnectionsChanged?.();
      setConnectingPlatform(null);
      setFormData({ platform_account_id: "", platform_account_name: "" });
      setNotice("Platform connected successfully.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      setError(null);
      setNotice(null);
      const res = await authedFetch(
        `/api/reputation/connections?id=${connectionId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to disconnect");
        return;
      }

      setLocalConnections((prev) => prev.filter((c) => c.id !== connectionId));
      await onConnectionsChanged?.();
      setNotice("Platform disconnected.");
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncingConnectionId(connectionId);
    setError(null);
    setNotice(null);

    try {
      const res = await authedFetch("/api/reputation/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        inserted?: number;
        updated?: number;
        lastSyncedAt?: string;
      };

      if (!res.ok) {
        setError(data.error || "Failed to sync reviews");
        return;
      }

      setLocalConnections((prev) =>
        prev.map((connection) =>
          connection.id === connectionId
            ? {
                ...connection,
                last_synced_at: data.lastSyncedAt || new Date().toISOString(),
                sync_error: null,
              }
            : connection
        )
      );

      await onConnectionsChanged?.();
      setNotice(
        `Review sync complete. ${data.inserted ?? 0} imported, ${data.updated ?? 0} refreshed.`,
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSyncingConnectionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const connection = connectedMap.get(platform.id);
          const isConnected = !!connection;
          const isGoogleBusiness = platform.id === "google_business";
          const isSyncing = syncingConnectionId === connection?.id;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-3"
            >
              {/* Platform header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {platform.label}
                  </p>
                  {isConnected && connection.platform_account_name && (
                    <p className="text-xs text-gray-500 truncate">
                      {connection.platform_account_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Not connected</span>
                  </>
                )}
              </div>

              {/* Sync info */}
              {isConnected && (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" />
                  <span>Last synced: {formatLastSynced(connection.last_synced_at)}</span>
                </div>
              )}

              {/* Sync error */}
              {isConnected && connection.sync_error && (
                <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{connection.sync_error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-2">
                {isConnected ? (
                  <div className="space-y-2">
                    {isGoogleBusiness ? (
                      <button
                        onClick={() => {
                          void handleSync(connection.id);
                        }}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Syncing..." : "Sync Reviews"}
                      </button>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                        Automatic review sync for this platform is coming soon.
                      </div>
                    )}
                    <button
                      onClick={() => {
                        void handleDisconnect(connection.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConnectingPlatform(platform.id);
                      setFormData({ platform_account_id: "", platform_account_name: "" });
                      setError(null);
                      setNotice(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Connect
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Connect form overlay */}
      <AnimatePresence>
        {connectingPlatform && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-primary" />
                  Connect{" "}
                  {PLATFORMS.find((p) => p.id === connectingPlatform)?.label}
                </h3>
                <button
                  onClick={() => setConnectingPlatform(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Account ID / Place ID
                  </label>
                  <input
                    type="text"
                    value={formData.platform_account_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        platform_account_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary/50"
                    placeholder="e.g. ChIJ..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.platform_account_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        platform_account_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary/50"
                    placeholder="e.g. My Travel Agency"
                  />
                </div>
              </div>

              <button
                onClick={() => handleConnect(connectingPlatform)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Connecting..." : "Connect Platform"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
