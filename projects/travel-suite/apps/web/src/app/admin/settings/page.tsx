"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Settings,
    Save,
    Building2,
    Globe,
    Palette,
    Shield,
    Bell,
    Check
} from "lucide-react";

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    subscription_tier: string | null;
}

export default function SettingsPage() {
    const supabase = createClient();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from("organizations")
                .select("*")
                .single();

            if (error) throw error;
            setOrganization(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("organizations")
                .update({
                    name: organization.name,
                    logo_url: organization.logo_url,
                    primary_color: organization.primary_color
                })
                .eq("id", organization.id);

            if (error) throw error;

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-slate-400" />
                    Settings
                </h1>
                <p className="text-slate-500 mt-1">Manage your organization details and application preferences.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Organization Details */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-slate-900">Organization Details</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Company Name</label>
                                <input
                                    type="text"
                                    value={organization?.name || ""}
                                    onChange={(e) => setOrganization(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Enter company name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Organization Slug</label>
                                <input
                                    type="text"
                                    value={organization?.slug || ""}
                                    disabled
                                    className="w-full px-4 py-2 border border-slate-100 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Logo URL</label>
                            <input
                                type="url"
                                value={organization?.logo_url || ""}
                                onChange={(e) => setOrganization(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </div>
                </div>

                {/* Branding & Theme */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <Palette className="w-5 h-5 text-purple-500" />
                        <h2 className="font-bold text-slate-900">Branding & Theme</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-semibold text-slate-700">Primary Brand Color</label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        value={organization?.primary_color || "#00D084"}
                                        onChange={(e) => setOrganization(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                                        className="w-10 h-10 border-none rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={organization?.primary_color || ""}
                                        onChange={(e) => setOrganization(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="#00D084"
                                    />
                                </div>
                            </div>
                            <div className="w-32 h-32 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 p-4">
                                <div
                                    className="w-full h-8 rounded shadow-sm"
                                    style={{ backgroundColor: organization?.primary_color || "#00D084" }}
                                ></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    Primary Color Preview
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Config (ReadOnly in this demo) */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm opacity-60">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-slate-900">System Configuration</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Push Notifications</p>
                                    <p className="text-xs text-slate-500">Global kill switch</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-primary rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Two-Factor Auth</p>
                                    <p className="text-xs text-slate-500">Security requirement</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-slate-300 rounded-full relative">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                    {showSuccess && (
                        <span className="flex items-center gap-2 text-green-600 font-medium animate-in fade-in slide-in-from-right-4">
                            <Check className="w-5 h-5" />
                            Settings saved successfully
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 font-bold"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
