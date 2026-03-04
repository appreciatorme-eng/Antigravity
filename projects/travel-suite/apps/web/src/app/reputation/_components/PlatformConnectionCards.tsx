"use client";

import { useState } from "react";
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
import type {
  ReputationPlatformConnection,
  ConnectionPlatform,
} from "@/lib/reputation/types";

interface PlatformConnectionCardsProps {
  connections: ReputationPlatformConnection[];
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
}: PlatformConnectionCardsProps) {
  const [connectingPlatform, setConnectingPlatform] =
    useState<ConnectionPlatform | null>(null);
  const [formData, setFormData] = useState<ConnectFormData>({
    platform_account_id: "",
    platform_account_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localConnections, setLocalConnections] =
    useState<ReputationPlatformConnection[]>(connections);

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

    try {
      const res = await fetch("/api/reputation/connections", {
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
      setConnectingPlatform(null);
      setFormData({ platform_account_id: "", platform_account_name: "" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const res = await fetch(
        `/api/reputation/connections?id=${connectionId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to disconnect");
        return;
      }

      setLocalConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const connection = connectedMap.get(platform.id);
          const isConnected = !!connection;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl border border-white/10 bg-slate-800/50 p-5 flex flex-col gap-3"
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
                  <p className="text-sm font-semibold text-white truncate">
                    {platform.label}
                  </p>
                  {isConnected && connection.platform_account_name && (
                    <p className="text-xs text-slate-400 truncate">
                      {connection.platform_account_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">
                      Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-500">Not connected</span>
                  </>
                )}
              </div>

              {/* Sync info */}
              {isConnected && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" />
                  <span>Last synced: {formatLastSynced(connection.last_synced_at)}</span>
                </div>
              )}

              {/* Sync error */}
              {isConnected && connection.sync_error && (
                <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{connection.sync_error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-2">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setConnectingPlatform(platform.id);
                      setFormData({ platform_account_id: "", platform_account_name: "" });
                      setError(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 border border-white/15 transition-colors"
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
            <div className="rounded-xl border border-white/10 bg-slate-800/70 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-primary" />
                  Connect{" "}
                  {PLATFORMS.find((p) => p.id === connectingPlatform)?.label}
                </h3>
                <button
                  onClick={() => setConnectingPlatform(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                    placeholder="e.g. ChIJ..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
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
