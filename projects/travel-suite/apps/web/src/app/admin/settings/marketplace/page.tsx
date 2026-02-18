"use client";

import Link from "next/link";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Save,
    RefreshCcw,
    BarChart3,
    MapPin,
    Tag,
    Info,
    Layout,
    Globe,
    Briefcase,
    Building2,
    ShieldCheck,
    CheckCircle2,
    Image as ImageIcon,
    Plus,
    Trash2,
    List,
    FileText,
    ShieldAlert,
    FileCheck,
    ExternalLink
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";

interface RateCardItem {
    id: string;
    service: string;
    margin: number;
}

interface ComplianceDocument {
    id: string;
    name: string;
    url: string;
    type: string;
    expiry_date?: string;
}

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
        verification_status: "none" as string,
        gallery_urls: [] as string[],
        rate_card: [] as RateCardItem[],
        compliance_documents: [] as ComplianceDocument[]
    });
    const [newRegion, setNewRegion] = useState("");
    const [newSpecialty, setNewSpecialty] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [newRateService, setNewRateService] = useState("");
    const [newRateMargin, setNewRateMargin] = useState("");

    // Document form
    const [docName, setDocName] = useState("");
    const [docUrl, setDocUrl] = useState("");
    const [docType, setDocType] = useState("Other");
    const [docExpiry, setDocExpiry] = useState("");

    const [successMessage, setSuccessMessage] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

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
                        gallery_urls: marketProfile.gallery_urls || [],
                        rate_card: marketProfile.rate_card || [],
                        compliance_documents: marketProfile.compliance_documents || []
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
                    margin_rate: formData.margin_rate === "" ? null : Number(formData.margin_rate),
                    gallery_urls: formData.gallery_urls,
                    rate_card: formData.rate_card,
                    compliance_documents: formData.compliance_documents
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
            setFormData({ ...formData, service_regions: [...formData.service_regions, newRegion] });
            setNewRegion("");
        }
    };

    const removeRegion = (region: string) => {
        setFormData({ ...formData, service_regions: formData.service_regions.filter(r => r !== region) });
    };

    const addSpecialty = () => {
        if (newSpecialty && !formData.specialties.includes(newSpecialty)) {
            setFormData({ ...formData, specialties: [...formData.specialties, newSpecialty] });
            setNewSpecialty("");
        }
    };

    const removeSpecialty = (spec: string) => {
        setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== spec) });
    };

    const addImage = () => {
        if (newImageUrl && !formData.gallery_urls.includes(newImageUrl)) {
            setFormData({ ...formData, gallery_urls: [...formData.gallery_urls, newImageUrl] });
            setNewImageUrl("");
        }
    };

    const removeImage = (url: string) => {
        setFormData({ ...formData, gallery_urls: formData.gallery_urls.filter(u => u !== url) });
    };

    const addRateItem = () => {
        if (newRateService && newRateMargin) {
            const newItem: RateCardItem = {
                id: Math.random().toString(36).substr(2, 9),
                service: newRateService,
                margin: Number(newRateMargin)
            };
            setFormData({ ...formData, rate_card: [...formData.rate_card, newItem] });
            setNewRateService("");
            setNewRateMargin("");
        }
    };

    const removeRateItem = (id: string) => {
        setFormData({ ...formData, rate_card: formData.rate_card.filter(item => item.id !== id) });
    };

    const addDocument = () => {
        if (docName && docUrl) {
            const newDoc: ComplianceDocument = {
                id: Math.random().toString(36).substr(2, 9),
                name: docName,
                url: docUrl,
                type: docType,
                expiry_date: docExpiry || undefined
            };
            setFormData({ ...formData, compliance_documents: [...formData.compliance_documents, newDoc] });
            setDocName("");
            setDocUrl("");
            setDocExpiry("");
        }
    };

    const removeDocument = (id: string) => {
        setFormData({ ...formData, compliance_documents: formData.compliance_documents.filter(d => d.id !== id) });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCcw className="animate-spin text-blue-400" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Marketplace Settings</h1>
                    <p className="text-slate-400">Manage your organization's presence and credentials in the partner network.</p>
                </div>
                <div className="flex items-center gap-3">
                    {successMessage && (
                        <div className="text-green-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <CheckCircle2 size={16} />
                            Saved Successfully
                        </div>
                    )}
                    <Link href="/admin/marketplace/analytics">
                        <GlassButton variant="secondary" className="flex items-center gap-2">
                            <BarChart3 size={18} /> Analytics
                        </GlassButton>
                    </Link>
                    <GlassButton onClick={handleSave} disabled={saving} className="w-40 flex items-center justify-center gap-2">
                        {saving ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </GlassButton>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Info & Documents */}
                <div className="lg:col-span-2 space-y-8">
                    <GlassCard className="p-8 space-y-8">
                        {/* Hero Header */}
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
                                            <CheckCircle2 size={14} /> Verified Partner
                                        </div>
                                    ) : formData.verification_status === 'pending' ? (
                                        <div className="flex items-center gap-1.5 text-orange-400 font-medium">
                                            <RefreshCcw size={14} className="animate-spin" /> Verification Pending
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <ShieldCheck size={14} /> Standard Partner
                                        </div>
                                    )}
                                </div>
                            </div>
                            {formData.verification_status === 'none' && (
                                <div className="ml-auto">
                                    <GlassButton variant="secondary" className="text-xs py-1.5 px-3" onClick={handleRequestVerification} disabled={saving || !formData.description}>
                                        Request Verification
                                    </GlassButton>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Info size={16} className="text-blue-400" /> Organization Bio
                                </label>
                                <textarea
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/30 outline-none h-32 text-sm"
                                    placeholder="Describe your services, destinations, and what makes you a unique partner..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <MapPin size={16} className="text-orange-400" /> Service Regions
                                    </label>
                                    <div className="flex gap-2">
                                        <GlassInput placeholder="e.g. Bali" value={newRegion} onChange={(e) => setNewRegion(e.target.value)} onKeyPress={(e) => e.key === "Enter" && addRegion()} />
                                        <GlassButton onClick={addRegion} variant="secondary" className="px-3"><Plus size={16} /></GlassButton>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.service_regions.map(r => (
                                            <div key={r} className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-xs text-white flex items-center gap-2 border border-slate-700">
                                                {r} <button onClick={() => removeRegion(r)} className="text-slate-500 hover:text-red-400">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <Tag size={16} className="text-purple-400" /> Specialties
                                    </label>
                                    <div className="flex gap-2">
                                        <GlassInput placeholder="e.g. Luxury" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} onKeyPress={(e) => e.key === "Enter" && addSpecialty()} />
                                        <GlassButton onClick={addSpecialty} variant="secondary" className="px-3"><Plus size={16} /></GlassButton>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.specialties.map(s => (
                                            <div key={s} className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-xs text-white flex items-center gap-2 border border-slate-700">
                                                {s} <button onClick={() => removeSpecialty(s)} className="text-slate-500 hover:text-red-400">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Document Vault Section */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldAlert className="text-yellow-400" size={20} /> B2B Compliance Vault
                            </h3>
                            <p className="text-xs text-slate-500">Provide legal and safety documents that verified partners can access to streamline onboarding.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/30 p-4 rounded-3xl border border-slate-800">
                            <div className="space-y-3">
                                <GlassInput placeholder="Document Name (e.g. Liability Insurance)" value={docName} onChange={(e) => setDocName(e.target.value)} />
                                <div className="flex gap-2">
                                    <select
                                        className="bg-slate-900 border border-slate-800 rounded-2xl px-4 text-xs text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value)}
                                    >
                                        <option>Insurance</option>
                                        <option>License</option>
                                        <option>Safety Protocol</option>
                                        <option>Contract Template</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="flex-1">
                                        <input
                                            type="date"
                                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-slate-300 outline-none"
                                            value={docExpiry}
                                            onChange={(e) => setDocExpiry(e.target.value)}
                                            placeholder="Expiry Date"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <GlassInput placeholder="Hosted Document URL (PDF/Doc)" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
                                <GlassButton onClick={addDocument} className="w-full flex items-center justify-center gap-2 py-2">
                                    <Plus size={16} /> Add to Vault
                                </GlassButton>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.compliance_documents.map(doc => (
                                <div key={doc.id} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white font-medium">{doc.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <span className="uppercase">{doc.type}</span>
                                                {doc.expiry_date && (
                                                    <span className="flex items-center gap-1">
                                                        • Expires {new Date(doc.expiry_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={doc.url} target="_blank" className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                                            <ExternalLink size={16} />
                                        </a>
                                        <button onClick={() => removeDocument(doc.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Media Gallery */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ImageIcon className="text-pink-400" size={20} /> Media Portfolio
                            </h3>
                            <span className="text-xs text-slate-500">{formData.gallery_urls.length} images</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <GlassInput placeholder="Paste image URL..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
                                <GlassButton onClick={addImage} variant="secondary" className="flex items-center gap-2 min-w-[100px]">
                                    <Plus size={16} /> Add Image
                                </GlassButton>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.gallery_urls.map((url, idx) => (
                                    <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                                        <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => removeImage(url)} className="p-2 bg-red-500 rounded-full text-white transform hover:scale-110 transition-transform">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: Rate Card */}
                <div className="space-y-8">
                    <GlassCard className="p-8 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <List className="text-green-400" size={20} /> Partner Rate Card
                            </h3>
                            <p className="text-xs text-slate-500">Define specific margin rates for different service types.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                                <GlassInput placeholder="Service (e.g. Trekking)" value={newRateService} onChange={(e) => setNewRateService(e.target.value)} className="text-sm" />
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <GlassInput type="number" placeholder="Margin" value={newRateMargin} onChange={(e) => setNewRateMargin(e.target.value)} className="text-sm pr-8" />
                                        <span className="absolute right-3 top-2.5 text-slate-500 text-sm">%</span>
                                    </div>
                                    <GlassButton onClick={addRateItem} variant="secondary" className="px-3">Add</GlassButton>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {formData.rate_card.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                        <div className="space-y-0.5">
                                            <div className="text-sm text-white font-medium">{item.service}</div>
                                            <div className="text-xs text-green-400 font-bold">{item.margin}% Margin</div>
                                        </div>
                                        <button onClick={() => removeRateItem(item.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 space-y-3">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider italic">Baseline Margin (%)</label>
                            <GlassInput
                                type="number"
                                value={formData.margin_rate}
                                onChange={(e) => setFormData({ ...formData, margin_rate: e.target.value })}
                                className="text-sm"
                            />
                            <p className="text-[10px] text-slate-600">This applies to all services not explicitly listed above.</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
