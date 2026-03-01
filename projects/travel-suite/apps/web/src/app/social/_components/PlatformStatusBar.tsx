"use client";

import { useEffect, useState } from "react";
import { Instagram, Facebook, Plus, RefreshCw, CheckCircle2, AlertCircle, Wifi } from "lucide-react";
import { motion } from "framer-motion";

interface Connection {
    id: string;
    platform: "instagram" | "facebook";
    platform_page_id: string;
    token_expires_at: string | null;
    is_expiring_soon: boolean;
}

interface Props {
    onConnectionsLoaded?: (connections: { instagram: boolean; facebook: boolean }) => void;
}

export const PlatformStatusBar = ({ onConnectionsLoaded }: Props) => {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/social/connections")
            .then(r => r.json())
            .then(data => {
                const nowMs = Date.now();
                const conns: Connection[] = (data.connections || []).map((conn: Omit<Connection, "is_expiring_soon">) => {
                    const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : Number.NaN;
                    const daysLeft = Number.isFinite(expiresAt)
                        ? (expiresAt - nowMs) / (1000 * 60 * 60 * 24)
                        : Number.POSITIVE_INFINITY;
                    return {
                        ...conn,
                        is_expiring_soon: daysLeft < 7,
                    };
                });
                if (cancelled) return;
                setConnections(conns);
                onConnectionsLoaded?.({
                    instagram: conns.some(c => c.platform === "instagram"),
                    facebook: conns.some(c => c.platform === "facebook"),
                });
            })
            .catch(() => {
                if (cancelled) return;
                onConnectionsLoaded?.({ instagram: false, facebook: false });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [onConnectionsLoaded]);

    const igConn = connections.find(c => c.platform === "instagram");
    const fbConn = connections.find(c => c.platform === "facebook");

    const isExpiringSoon = (connection: Connection | undefined) => connection?.is_expiring_soon === true;

    const handleConnect = (platform: string) => {
        if (platform === "facebook") {
            window.location.href = "/api/social/oauth/facebook";
        }
    };

    if (loading) return null;

    const allConnected = igConn && fbConn;
    const noneConnected = !igConn && !fbConn;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium flex-wrap ${
                allConnected
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : noneConnected
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
        >
            <Wifi className={`w-4 h-4 shrink-0 ${allConnected ? "text-emerald-500" : noneConnected ? "text-amber-500" : "text-blue-500"}`} />

            {/* Instagram status */}
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
                    <Instagram className="w-3.5 h-3.5 text-white" />
                </div>
                {igConn ? (
                    <span className={`flex items-center gap-1 ${isExpiringSoon(igConn) ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isExpiringSoon(igConn)
                            ? <><AlertCircle className="w-3.5 h-3.5" /> Expiring soon</>
                            : <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</>
                        }
                    </span>
                ) : (
                    <button
                        onClick={() => handleConnect("facebook")}
                        className="text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 font-bold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Connect
                    </button>
                )}
            </div>

            <span className="text-slate-300 dark:text-slate-600">|</span>

            {/* Facebook status */}
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Facebook className="w-3.5 h-3.5 text-white" />
                </div>
                {fbConn ? (
                    <span className={`flex items-center gap-1 ${isExpiringSoon(fbConn) ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isExpiringSoon(fbConn)
                            ? <><AlertCircle className="w-3.5 h-3.5" /> Expiring soon</>
                            : <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</>
                        }
                    </span>
                ) : (
                    <button
                        onClick={() => handleConnect("facebook")}
                        className="text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 font-bold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Connect
                    </button>
                )}
            </div>

            {/* Refresh if anything expiring */}
            {(isExpiringSoon(igConn) || isExpiringSoon(fbConn)) && (
                <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                        onClick={() => fetch("/api/social/refresh-tokens", { method: "POST" }).then(() => window.location.reload())}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 font-bold"
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh tokens
                    </button>
                </>
            )}

            {noneConnected && (
                <span className="text-xs text-amber-700 dark:text-amber-400 ml-auto hidden sm:inline">
                    Connect platforms to enable auto-publishing →
                </span>
            )}
        </motion.div>
    );
};
