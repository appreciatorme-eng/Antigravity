/**
 * useClientPipeline — Data fetching, filtering, lifecycle stage management, and stats
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useClients } from "@/lib/queries/clients";
import { useToast } from "@/components/ui/toast";
import { authedFetch } from "@/lib/api/authed-fetch";
import {
    type Client,
    type FeatureLimitSnapshot,
    LIFECYCLE_STAGES,
    STAGE_CONFIG,
} from "../types";

interface ClientStats {
    activeCount: number;
    vipCount: number;
    totalLTV: number;
    visibleClientLimit: FeatureLimitSnapshot | null;
}

interface StageGroup {
    stage: (typeof LIFECYCLE_STAGES)[number];
    config: (typeof STAGE_CONFIG)[(typeof LIFECYCLE_STAGES)[number]];
    clients: Client[];
}

interface UseClientPipelineReturn {
    clients: Client[];
    filteredClients: Client[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    stageUpdatingId: string | null;
    clientsByStage: StageGroup[];
    stats: ClientStats;
    fetchClients: () => Promise<unknown>;
    handleLifecycleStageChange: (clientId: string, lifecycleStage: string) => Promise<void>;
}

export function useClientPipeline(): UseClientPipelineReturn {
    const { toast } = useToast();
    const { data: rawClients, isLoading: loading, refetch: fetchClients } = useClients();
    const clients: Client[] = rawClients || [];

    const [searchTerm, setSearchTerm] = useState("");
    const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null);
    const [clientLimit, setClientLimit] = useState<FeatureLimitSnapshot | null>(null);

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const limitsResponse = await authedFetch("/api/subscriptions/limits", { cache: "no-store" });
                if (!limitsResponse.ok) return;
                const payload = await limitsResponse.json();
                const limit = payload?.limits?.clients;
                if (!limit) return;
                setClientLimit({
                    allowed: Boolean(limit.allowed),
                    used: Number(limit.used || 0),
                    limit: limit.limit === null ? null : Number(limit.limit || 0),
                    remaining: limit.remaining === null ? null : Number(limit.remaining || 0),
                    tier: String(limit.tier || "free"),
                    resetAt: limit.resetAt || null,
                });
            } catch { /* best-effort */ }
        };
        fetchLimits();
    }, []);

    const filteredClients = clients.filter(client =>
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const clientsByStage: StageGroup[] = LIFECYCLE_STAGES.map((stage) => ({
        stage,
        config: STAGE_CONFIG[stage],
        clients: filteredClients.filter((client) => (client.lifecycle_stage || "lead") === stage),
    }));

    const handleLifecycleStageChange = useCallback(async (clientId: string, lifecycleStage: string) => {
        setStageUpdatingId(clientId);
        try {
            const response = await authedFetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: clientId, lifecycle_stage: lifecycleStage }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update stage");
            }
            await fetchClients();
        } catch (error) {
            toast({
                title: "Failed to update stage",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "error",
            });
        } finally {
            setStageUpdatingId(null);
        }
    }, [fetchClients, toast]);

    const activeCount = clients.filter(c => ["lead", "prospect", "proposal"].includes(c.lifecycle_stage || "lead")).length;
    const vipCount = clients.filter(c => c.client_tag === "vip").length;
    const totalLTV = clients.reduce((acc, c) => acc + ((c.trips_count || 1) * (c.budget_max || 85000)), 0);
    const visibleClientLimit = clientLimit && clientLimit.limit !== null ? clientLimit : null;

    return {
        clients,
        filteredClients,
        loading,
        searchTerm,
        setSearchTerm,
        stageUpdatingId,
        clientsByStage,
        stats: { activeCount, vipCount, totalLTV, visibleClientLimit },
        fetchClients,
        handleLifecycleStageChange,
    };
}
