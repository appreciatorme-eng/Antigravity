/**
 * useClientForm — Form state, validation, and save logic for add/edit client modal
 */

"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import {
    type Client,
    type ClientFormData,
    DEFAULT_FORM_DATA,
    formatFeatureLimitError,
} from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseClientFormReturn {
    formData: ClientFormData;
    setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
    editingClientId: string | null;
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    saving: boolean;
    formError: string | null;
    resetForm: () => void;
    handleEditClient: (client: Client) => void;
    handleSaveClient: () => Promise<void>;
}

interface UseClientFormOptions {
    onSaved: () => Promise<unknown>;
}

export function useClientForm({ onSaved }: UseClientFormOptions): UseClientFormReturn {
    const supabase = createClient();
    const { toast } = useToast();
    const { isDemoMode } = useDemoMode();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ClientFormData>({ ...DEFAULT_FORM_DATA });

    const resetForm = useCallback(() => {
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormError(null);
        setEditingClientId(null);
    }, []);

    const handleEditClient = useCallback((client: Client) => {
        setEditingClientId(client.id);
        setFormData({
            full_name: client.full_name || "",
            email: client.email || "",
            phone: client.phone || "",
            preferredDestination: client.preferred_destination || "",
            travelersCount: client.travelers_count?.toString() || "",
            budgetMin: client.budget_min?.toString() || "",
            budgetMax: client.budget_max?.toString() || "",
            travelStyle: client.travel_style || "",
            interests: client.interests?.join(", ") || "",
            homeAirport: client.home_airport || "",
            notes: client.notes || "",
            leadStatus: client.lead_status || "new",
            clientTag: client.client_tag || "standard",
            phaseNotificationsEnabled: client.phase_notifications_enabled ?? true,
            lifecycleStage: client.lifecycle_stage || "lead",
            marketingOptIn: client.marketing_opt_in || false,
            referralSource: client.referral_source || "",
            sourceChannel: client.source_channel || "",
            languagePreference: client.language_preference || "English",
        });
        setModalOpen(true);
    }, []);

    const handleSaveClient = useCallback(async () => {
        if (saving) return;
        if (isDemoMode) {
            setFormError("You're viewing demo data. Switch to real data to add clients.");
            toast({
                title: "Demo Mode Active",
                description: "Toggle off Demo Mode to work with your real data.",
                variant: "warning",
            });
            return;
        }
        if (!formData.full_name.trim()) {
            setFormError("Name is required.");
            return;
        }
        if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) {
            setFormError("Please enter a valid email address.");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const method = editingClientId ? "PATCH" : "POST";
            const body = editingClientId ? { ...formData, id: editingClientId } : formData;
            const response = await fetch("/api/admin/clients", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const payload = await response.json();
                throw new Error(formatFeatureLimitError(payload, payload.error || `Failed to ${editingClientId ? "update" : "create"} client`));
            }
            await onSaved();
            setModalOpen(false);
            resetForm();
            toast({
                title: editingClientId ? "Client Updated \u2705" : "Client Added \u2705",
                description: `${formData.full_name} has been ${editingClientId ? "updated" : "added"} successfully.`,
            });
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to save client");
        } finally {
            setSaving(false);
        }
    }, [formData, editingClientId, saving, isDemoMode, supabase, onSaved, resetForm, toast]);

    return {
        formData,
        setFormData,
        editingClientId,
        modalOpen,
        setModalOpen,
        saving,
        formError,
        resetForm,
        handleEditClient,
        handleSaveClient,
    };
}
