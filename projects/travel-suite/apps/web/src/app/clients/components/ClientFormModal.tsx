/**
 * ClientFormModal — Add/Edit client modal with full form fields
 */

"use client";

import { Languages } from "lucide-react";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import {
    type ClientFormData,
    LIFECYCLE_STAGES,
    STAGE_CONFIG,
    LANGUAGES,
} from "../types";

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: ClientFormData;
    onFormChange: React.Dispatch<React.SetStateAction<ClientFormData>>;
    editingClientId: string | null;
    saving: boolean;
    formError: string | null;
    onSave: () => Promise<void>;
}

export function ClientFormModal({
    isOpen,
    onClose,
    formData,
    onFormChange,
    editingClientId,
    saving,
    formError,
    onSave,
}: ClientFormModalProps) {
    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title={editingClientId ? "Edit Client" : "Add New Client"}
        >
            <p className="text-sm font-medium text-text-muted mb-6">
                {editingClientId
                    ? "Update the client details below."
                    : "Fill in the details to add a new client to your pipeline."}
            </p>
            <div className="grid gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-4">
                <GlassInput
                    label="Full Name *"
                    value={formData.full_name}
                    onChange={(e) => onFormChange(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Rahul Sharma"
                />
                <GlassInput
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => onFormChange(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="rahul@example.com"
                />
                <GlassInput
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => onFormChange(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
                            <Languages className="w-2.5 h-2.5" /> Language
                        </label>
                        <select
                            value={formData.languagePreference}
                            onChange={(e) => onFormChange(prev => ({ ...prev, languagePreference: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                        >
                            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Client Tag</label>
                        <select
                            value={formData.clientTag}
                            onChange={(e) => onFormChange(prev => ({ ...prev, clientTag: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                        >
                            <option value="standard">Standard</option>
                            <option value="vip">{"\u2B50"} VIP</option>
                            <option value="repeat">{"\uD83D\uDD04"} Repeat</option>
                            <option value="corporate">{"\uD83C\uDFE2"} Corporate</option>
                            <option value="family">{"\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67"} Family</option>
                            <option value="honeymoon">{"\uD83D\uDC91"} Honeymoon</option>
                            <option value="high_priority">{"\uD83D\uDD25"} High Priority</option>
                        </select>
                    </div>
                </div>
                <div className="grid gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pipeline Stage</label>
                    <select
                        value={formData.lifecycleStage}
                        onChange={(e) => onFormChange(prev => ({ ...prev, lifecycleStage: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                    >
                        {LIFECYCLE_STAGES.map(s => (
                            <option key={s} value={s}>{STAGE_CONFIG[s].emoji} {STAGE_CONFIG[s].label}</option>
                        ))}
                    </select>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Travel Preferences</h4>
                    <div className="grid gap-4">
                        <GlassInput
                            label="Preferred Destination"
                            value={formData.preferredDestination}
                            onChange={(e) => onFormChange(prev => ({ ...prev, preferredDestination: e.target.value }))}
                            placeholder="Rajasthan, Kerala..."
                        />
                        <div className="grid grid-cols-3 gap-3">
                            <GlassInput
                                label="Travelers"
                                type="number"
                                value={formData.travelersCount}
                                onChange={(e) => onFormChange(prev => ({ ...prev, travelersCount: e.target.value }))}
                                placeholder="2"
                            />
                            <GlassInput
                                label="Min Budget \u20B9"
                                type="number"
                                value={formData.budgetMin}
                                onChange={(e) => onFormChange(prev => ({ ...prev, budgetMin: e.target.value }))}
                                placeholder="50000"
                            />
                            <GlassInput
                                label="Max Budget \u20B9"
                                type="number"
                                value={formData.budgetMax}
                                onChange={(e) => onFormChange(prev => ({ ...prev, budgetMax: e.target.value }))}
                                placeholder="150000"
                            />
                        </div>
                        <GlassInput
                            label="Home Airport"
                            value={formData.homeAirport}
                            onChange={(e) => onFormChange(prev => ({ ...prev, homeAirport: e.target.value }))}
                            placeholder="DEL, BOM, MAA..."
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => onFormChange(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Special requirements, dietary needs, preferences..."
                            className="min-h-[90px] w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-secondary dark:text-white placeholder:text-text-muted/60 focus:border-primary/50 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                {formError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formError}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <GlassButton
                    onClick={onClose}
                    variant="ghost"
                    className="font-bold text-xs uppercase tracking-widest text-text-muted"
                >
                    Cancel
                </GlassButton>
                <GlassButton
                    onClick={onSave}
                    disabled={saving}
                    variant="primary"
                    className="font-bold text-xs uppercase tracking-widest"
                >
                    {saving ? "Saving..." : (editingClientId ? "Update Client" : "Add Client")}
                </GlassButton>
            </div>
        </GlassModal>
    );
}
