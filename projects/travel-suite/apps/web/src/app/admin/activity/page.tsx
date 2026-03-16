"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Filter,
  Search,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  Loader2,
} from "lucide-react";

interface ActivityRow {
  id: string;
  eventType: string;
  actionName: string;
  actionParams: unknown;
  actionResult: unknown;
  channel: string | null;
  createdAt: string;
  userId: string | null;
  userName: string;
}

type EventTypeFilter = "all" | "action" | "error" | "info";

function formatTimestamp(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const type = eventType.toLowerCase();

  if (type.includes("error") || type.includes("fail")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold text-rose-400">
        <XCircle className="h-3 w-3" />
        Error
      </span>
    );
  }

  if (type.includes("success") || type.includes("complete")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </span>
    );
  }

  if (type.includes("warn")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
        <AlertCircle className="h-3 w-3" />
        Warning
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-400">
      <Info className="h-3 w-3" />
      {eventType}
    </span>
  );
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("all");

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/activity");
        if (!res.ok) {
          throw new Error(`Failed to fetch activities: ${res.statusText}`);
        }

        const json = await res.json();
        setActivities(json.data?.activities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        searchTerm === "" ||
        activity.actionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.eventType.toLowerCase().includes(searchTerm.toLowerCase());

      if (eventTypeFilter === "all") return matchesSearch;

      const eventTypeLower = activity.eventType.toLowerCase();
      if (eventTypeFilter === "error") {
        return matchesSearch && (eventTypeLower.includes("error") || eventTypeLower.includes("fail"));
      }
      if (eventTypeFilter === "action") {
        return matchesSearch && eventTypeLower.includes("action");
      }
      if (eventTypeFilter === "info") {
        return matchesSearch && eventTypeLower.includes("info");
      }

      return matchesSearch;
    });
  }, [activities, searchTerm, eventTypeFilter]);

  return (
    <div className="min-h-screen bg-[#0a1628] p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Activity className="h-8 w-8 text-[#00d084]" />
            Activity Log
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Complete audit trail of all actions in your workspace
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Total Activities</p>
                <p className="text-2xl font-semibold">{activities.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Successful</p>
                <p className="text-2xl font-semibold">
                  {activities.filter((a) =>
                    a.eventType.toLowerCase().includes("success") ||
                    a.eventType.toLowerCase().includes("complete")
                  ).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Errors</p>
                <p className="text-2xl font-semibold">
                  {activities.filter((a) =>
                    a.eventType.toLowerCase().includes("error") ||
                    a.eventType.toLowerCase().includes("fail")
                  ).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search activities, users, or actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00d084]/50"
              />
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/40" />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value as EventTypeFilter)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00d084]/50"
              >
                <option value="all">All Events</option>
                <option value="action">Actions</option>
                <option value="error">Errors</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 text-[#00d084] animate-spin mb-4" />
              <p className="text-white/50 text-sm">Loading activities...</p>
            </div>
          ) : error ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Activities</h2>
              <p className="text-white/50 text-sm max-w-md">{error}</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-white/40" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Activities Found</h2>
              <p className="text-white/50 text-sm max-w-md">
                {searchTerm || eventTypeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No activity logs available yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Channel
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredActivities.map((activity, index) => (
                    <motion.tr
                      key={activity.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="h-3.5 w-3.5 text-white/40" />
                          {formatTimestamp(activity.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-white/40" />
                          <span className="text-white/90">{activity.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-white font-medium">{activity.actionName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <EventTypeBadge eventType={activity.eventType} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-white/60">
                          {activity.channel || "—"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && filteredActivities.length > 0 && (
          <div className="text-center text-sm text-white/40">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        )}
      </div>
    </div>
  );
}
