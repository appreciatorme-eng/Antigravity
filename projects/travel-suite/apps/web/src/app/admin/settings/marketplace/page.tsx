"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Save,
    RefreshCcw,
    MapPin,
    Tag,
    Info,
    Layout,
    Globe,
    Briefcase,
    Building2,
    ShieldCheck,
    CheckCircle2
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";

export default function MarketplaceSettingsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organization, setOrganization] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: "",
        service_regions: [] as string[],
        specialties: [] as string[],
        margin_rate: "" as string | number,
        verification_status: "none" as string
    });
    const [newRegion, setNewRegion] = useState("");
    const [newSpecialty, setNewSpecialty] = useState("");
    const [successMessage, setSuccessMessage] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch user's organization
            const { data: profile } = await supabase
                .from("profiles")
                .select("organization_id")
                .eq("id", session.user.id)
                .single();

            if (profile?.organization_id) {
                const { data: org } = await supabase
                    .from("organizations")
                    .select("name, logo_url")
                    .eq("id", profile.organization_id)
                    .single();
                setOrganization({ ...org, id: profile.organization_id });

                // Fetch marketplace profile
                const { data: marketProfile } = await (supabase as any)
                    .from("marketplace_profiles")
                    .select("*")
                    .eq("organization_id", profile.organization_id)
                    .single();

                if (marketProfile) {
                    setFormData({
                        description: marketProfile.description || "",
                        service_regions: marketProfile.service_regions || [],
                        specialties: marketProfile.specialties || [],
                        margin_rate: marketProfile.margin_rate ?? "",
                        verification_status: marketProfile.verification_status || "none",
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        if (!organization?.id) return;
        setSaving(true);
        setSuccessMessage(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/marketplace", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    description: formData.description,
                    service_regions: formData.service_regions,
                    specialties: formData.specialties,
                    margin_rate: formData.margin_rate === "" ? null : Number(formData.margin_rate)
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to save settings");
            }

            setSuccessMessage(true);
            setTimeout(() => setSuccessMessage(false), 3000);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRequestVerification = async () => {
        if (!organization?.id) return;
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/marketplace", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    ...formData,
                    margin_rate: formData.margin_rate === "" ? null : Number(formData.margin_rate),
                    request_verification: true
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to request verification");
            }

            setFormData(prev => ({ ...prev, verification_status: 'pending' }));
            setSuccessMessage(true);
            setTimeout(() => setSuccessMessage(false), 3000);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const addRegion = () => {
        if (newRegion && !formData.service_regions.includes(newRegion)) {
            setFormData({
                ...formData,
                service_regions: [...formData.service_regions, newRegion]
            });
            setNewRegion("");
        }
    };

    const removeRegion = (region: string) => {
        setFormData({
            ...formData,
            service_regions: formData.service_regions.filter(r => r !== region)
        });
    };

    const addSpecialty = () => {
        if (newSpecialty && !formData.specialties.includes(newSpecialty)) {
            setFormData({
                ...formData,
                specialties: [...formData.specialties, newSpecialty]
            });
            setNewSpecialty("");
        }
    };

    const removeSpecialty = (spec: string) => {
        setFormData({
            ...formData,
            specialties: formData.specialties.filter(s => s !== spec)
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCcw className="animate-spin text-blue-400" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-[1000px] mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Marketplace Settings</h1>
                <p className="text-slate-400">Manage your organization's presence in the partner marketplace.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Profile Section */}
                <GlassCard className="p-8 space-y-8">
                    <div className="flex items-center gap-6 pb-8 border-b border-slate-800">
                        <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden relative">
                            {organization?.logo_url ? (
                                <img src={organization.logo_url} alt={organization.name} className="object-cover w-full h-full" />
                            ) : (
                                <Building2 size={32} className="text-slate-600" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">{organization?.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                {formData.verification_status === 'verified' ? (
                                    <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                                        <CheckCircle2 size={14} />
                                        Verified Partner
                                    </div>
                                ) : formData.verification_status === 'pending' ? (
                                    <div className="flex items-center gap-1.5 text-orange-400 font-medium">
                                        <RefreshCcw size={14} className="animate-spin" />
                                        Verification Pending
                                    </div>
                                ) : (
                                    <>
                                        <ShieldCheck size={14} className="text-slate-600" />
                                        Standard Partner Account
                                    </>
                                )}
                            </div>
                        </div>
                        {formData.verification_status === 'none' && (
                            <div className="ml-auto">
                                <GlassButton
                                    variant="secondary"
                                    className="text-xs py-1.5 px-3"
                                    onClick={handleRequestVerification}
                                    disabled={saving || !formData.description}
                                >
                                    Request Verification
                                </GlassButton>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Bio */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Info size={16} className="text-blue-400" />
                                Organization Bio
                            </label>
                            <textarea
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/30 outline-none h-32"
                                placeholder="Describe your services, history, and what makes you a great partner..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <p className="text-xs text-slate-600 italic">This will be shown on your public profile to other operators.</p>
                        </div>

                        {/* Regions */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <MapPin size={16} className="text-orange-400" />
                                Service Regions
                            </label>
                            <div className="flex gap-2">
                                <GlassInput
                                    placeholder="Add a region (e.g., Bali, Tuscany)"
                                    value={newRegion}
                                    onChange={(e) => setNewRegion(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && addRegion()}
                                />
                                <GlassButton onClick={addRegion} variant="secondary">Add</GlassButton>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.service_regions.map(region => (
                                    <div key={region} className="px-3 py-1.5 bg-slate-800 rounded-full text-sm text-white flex items-center gap-2 border border-slate-700">
                                        {region}
                                        <button onClick={() => removeRegion(region)} className="text-slate-500 hover:text-red-400">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Specialties */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Tag size={16} className="text-purple-400" />
                                specialties
                            </label>
                            <div className="flex gap-2">
                                <GlassInput
                                    placeholder="Add a specialty (e.g., Luxury, Guided Tours)"
                                    value={newSpecialty}
                                    onChange={(e) => setNewSpecialty(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && addSpecialty()}
                                />
                                <GlassButton onClick={addSpecialty} variant="secondary">Add</GlassButton>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.specialties.map(spec => (
                                    <div key={spec} className="px-3 py-1.5 bg-slate-800 rounded-full text-sm text-white flex items-center gap-2 border border-slate-700">
                                        {spec}
                                        <button onClick={() => removeSpecialty(spec)} className="text-slate-500 hover:text-red-400">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Margin */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Layout size={16} className="text-green-400" />
                                Default Partner Margin (%)
                            </label>
                            <GlassInput
                                type="number"
                                placeholder="e.g. 15"
                                value={formData.margin_rate}
                                onChange={(e) => setFormData({ ...formData, margin_rate: e.target.value })}
                            />
                            <p className="text-xs text-slate-600 italic">This is the baseline margin rate you offer to partner operators.</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {successMessage && (
                                <div className="text-green-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                    <CheckCircle2 size={16} />
                                    Settings saved successfully
                                </div>
                            )}
                        </div>
                        <GlassButton
                            onClick={handleSave}
                            disabled={saving}
                            className="w-40 flex items-center justify-center gap-2"
                        >
                            {saving ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
                            {saving ? "Saving..." : "Save Changes"}
                        </GlassButton>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
