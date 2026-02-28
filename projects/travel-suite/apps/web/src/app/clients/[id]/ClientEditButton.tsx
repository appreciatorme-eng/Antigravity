"use client";

import { useState } from "react";
import { Edit2, Save, Loader2, Languages } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी (Hindi)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
    { code: "ml", label: "മലയാളം (Malayalam)" },
    { code: "bn", label: "বাংলা (Bengali)" },
    { code: "mr", label: "मराठी (Marathi)" },
    { code: "gu", label: "ગુજરાતી (Gujarati)" },
    { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
    { code: "ur", label: "اردو (Urdu)" },
    { code: "as", label: "অসমীয়া (Assamese)" },
];

interface ClientEditButtonProps {
    client: {
        id: string;
        full_name?: string | null;
        email?: string | null;
        phone?: string | null;
        preferred_destination?: string | null;
        travelers_count?: number | null;
        budget_min?: number | null;
        budget_max?: number | null;
        travel_style?: string | null;
        interests?: string[] | null;
        home_airport?: string | null;
        notes?: string | null;
        lead_status?: string | null;
        client_tag?: string | null;
        lifecycle_stage?: string | null;
        language_preference?: string | null;
    };
}

export default function ClientEditButton({ client }: ClientEditButtonProps) {
    const router = useRouter();
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
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
        lifecycleStage: client.lifecycle_stage || "lead",
        languagePreference: client.language_preference || "English",
    });

    const handleSave = async () => {
        if (!formData.full_name.trim() || !formData.email.trim()) {
            setError("Name and email are required.");
            return;
        }
        setSaving(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    id: client.id,
                    ...formData,
                }),
            });

            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload.error || "Failed to update client");
            }

            setOpen(false);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const selectCls = "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Client
            </button>

            <GlassModal isOpen={open} onClose={() => setOpen(false)} title="Edit Client">
                <div className="grid gap-5 max-h-[65vh] overflow-y-auto pr-2 pb-4">

                    {/* Basic Info */}
                    <div className="grid gap-4">
                        <GlassInput label="Full Name *" value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} placeholder="Rahul Sharma" />
                        <GlassInput label="Email *" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="rahul@example.com" />
                        <GlassInput label="Phone / WhatsApp" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                    </div>

                    {/* Language + Tag */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
                                <Languages className="w-3 h-3" /> Language
                            </label>
                            <select
                                value={formData.languagePreference}
                                onChange={e => setFormData(p => ({ ...p, languagePreference: e.target.value }))}
                                className={selectCls}
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.code} value={l.label}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Client Tag</label>
                            <select value={formData.clientTag} onChange={e => setFormData(p => ({ ...p, clientTag: e.target.value }))} className={selectCls}>
                                <option value="standard">Standard</option>
                                <option value="vip">⭐ VIP</option>
                                <option value="repeat">🔄 Repeat</option>
                                <option value="corporate">🏢 Corporate</option>
                                <option value="family">👨‍👩‍👧 Family</option>
                                <option value="honeymoon">💑 Honeymoon</option>
                                <option value="high_priority">🔥 High Priority</option>
                            </select>
                        </div>
                    </div>

                    {/* Lifecycle */}
                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pipeline Stage</label>
                        <select value={formData.lifecycleStage} onChange={e => setFormData(p => ({ ...p, lifecycleStage: e.target.value }))} className={selectCls}>
                            <option value="lead">🌱 Lead</option>
                            <option value="prospect">👀 Prospect</option>
                            <option value="proposal">📋 Proposal</option>
                            <option value="payment_pending">⏳ Payment Pending</option>
                            <option value="payment_confirmed">✅ Payment Confirmed</option>
                            <option value="active">✈️ Active Trip</option>
                            <option value="review">⭐ Review</option>
                            <option value="past">🏁 Closed</option>
                        </select>
                    </div>

                    {/* Travel Preferences */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Travel Preferences</h4>
                        <div className="grid gap-4">
                            <GlassInput label="Preferred Destination" value={formData.preferredDestination} onChange={e => setFormData(p => ({ ...p, preferredDestination: e.target.value }))} placeholder="Rajasthan, Kerala, Goa..." />
                            <div className="grid grid-cols-3 gap-3">
                                <GlassInput label="Pax Count" type="number" value={formData.travelersCount} onChange={e => setFormData(p => ({ ...p, travelersCount: e.target.value }))} placeholder="2" />
                                <GlassInput label="Min Budget ₹" type="number" value={formData.budgetMin} onChange={e => setFormData(p => ({ ...p, budgetMin: e.target.value }))} placeholder="50000" />
                                <GlassInput label="Max Budget ₹" type="number" value={formData.budgetMax} onChange={e => setFormData(p => ({ ...p, budgetMax: e.target.value }))} placeholder="150000" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Travel Style</label>
                                    <select value={formData.travelStyle} onChange={e => setFormData(p => ({ ...p, travelStyle: e.target.value }))} className={selectCls}>
                                        <option value="">Not specified</option>
                                        <option value="Leisure">🌴 Leisure</option>
                                        <option value="Adventure">🏔️ Adventure</option>
                                        <option value="Pilgrimage">🙏 Pilgrimage</option>
                                        <option value="Honeymoon">💑 Honeymoon</option>
                                        <option value="Family">👨‍👩‍👧 Family</option>
                                        <option value="Business">💼 Business</option>
                                        <option value="Wildlife">🐯 Wildlife</option>
                                        <option value="Cultural">🏛️ Cultural</option>
                                        <option value="Luxury">✨ Luxury</option>
                                        <option value="Budget">💰 Budget</option>
                                    </select>
                                </div>
                                <GlassInput label="Home Airport" value={formData.homeAirport} onChange={e => setFormData(p => ({ ...p, homeAirport: e.target.value }))} placeholder="DEL, BOM, MAA..." />
                            </div>
                            <GlassInput label="Interests (comma separated)" value={formData.interests} onChange={e => setFormData(p => ({ ...p, interests: e.target.value }))} placeholder="Wildlife, Photography, Yoga, Culture..." />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Agent Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Special requirements, preferences, important reminders..."
                                className="min-h-[90px] w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-secondary dark:text-white placeholder:text-text-muted/60 focus:border-primary/50 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
                    <GlassButton onClick={() => setOpen(false)} variant="ghost" className="font-bold text-xs uppercase tracking-widest text-text-muted">
                        Cancel
                    </GlassButton>
                    <GlassButton onClick={handleSave} disabled={saving} variant="primary" className="font-bold text-xs uppercase tracking-widest">
                        {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving...</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save Changes</>}
                    </GlassButton>
                </div>
            </GlassModal>
        </>
    );
}
