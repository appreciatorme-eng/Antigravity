"use client";

import { useState } from "react";
import { X, Instagram, Facebook, Calendar, Clock, Send, Download, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SocialTemplate } from "@/lib/social/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    template: SocialTemplate | null;
    templateData: any;
    onDownload: () => void;
    onSaveDraft: (caption: string) => void;
    connections: { instagram: boolean; facebook: boolean };
}

type PublishMode = "now" | "schedule";

export const PublishKitDrawer = ({
    isOpen,
    onClose,
    template,
    templateData,
    onDownload,
    onSaveDraft,
    connections,
}: Props) => {
    const [caption, setCaption] = useState(
        `✈️ ${templateData?.destination || "Dream Destination"} awaits!\n\n${templateData?.offer || ""} — starting @ ${templateData?.price || ""}\n\nBook now: ${templateData?.contactNumber || ""}\n\n#travel #tours #${(templateData?.destination || "travel").toLowerCase().replace(/\s+/g, "")}`
    );
    const [platforms, setPlatforms] = useState({ instagram: true, facebook: false });
    const [publishMode, setPublishMode] = useState<PublishMode>("now");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("09:00");
    const [publishing, setPublishing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [published, setPublished] = useState(false);

    const handlePublish = async () => {
        const hasConnection = (platforms.instagram && connections.instagram) || (platforms.facebook && connections.facebook);
        if (!hasConnection) {
            toast.error("Connect Instagram or Facebook first in Settings → Social Connections.");
            return;
        }
        setPublishing(true);
        try {
            const endpoint = publishMode === "now" ? "/api/social/publish" : "/api/social/schedule";
            const body: any = {
                templateId: template?.id,
                templateData,
                caption,
                platforms: Object.entries(platforms).filter(([, v]) => v).map(([k]) => k),
            };
            if (publishMode === "schedule") {
                body.scheduledFor = `${scheduleDate}T${scheduleTime}:00`;
            }
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Publish failed");
            setPublished(true);
            toast.success(publishMode === "now" ? "Published successfully! 🎉" : "Scheduled successfully!");
            setTimeout(() => { setPublished(false); onClose(); }, 2000);
        } catch {
            toast.error("Could not publish. Check your platform connections.");
        } finally {
            setPublishing(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await onSaveDraft(caption);
            toast.success("Saved as draft!");
        } finally {
            setSaving(false);
        }
    };

    const charCount = caption.length;
    const igLimit = 2200;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <div>
                                <h3 className="font-bold text-lg">Publish Kit</h3>
                                <p className="text-indigo-100 text-xs mt-0.5 font-medium">
                                    {template?.name || "Template"}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {/* Platform selector */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">
                                    Publish To
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: "instagram", label: "Instagram", icon: Instagram, color: "from-pink-500 to-rose-500", connected: connections.instagram },
                                        { key: "facebook", label: "Facebook", icon: Facebook, color: "from-blue-600 to-indigo-600", connected: connections.facebook },
                                    ].map(({ key, label, icon: Icon, color, connected }) => (
                                        <button
                                            key={key}
                                            onClick={() => setPlatforms(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                                            className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                                platforms[key as keyof typeof platforms]
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
                                            {!connected && (
                                                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                                                    Not Connected
                                                </span>
                                            )}
                                            {connected && platforms[key as keyof typeof platforms] && (
                                                <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-indigo-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {(!connections.instagram && !connections.facebook) && (
                                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                            No platforms connected. You can still download or save as draft.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Caption editor */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Caption</label>
                                    <span className={`text-[10px] font-bold ${charCount > igLimit ? "text-red-500" : "text-slate-400"}`}>
                                        {charCount}/{igLimit}
                                    </span>
                                </div>
                                <textarea
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    rows={6}
                                    className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium leading-relaxed"
                                />
                            </div>

                            {/* Timing toggle */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">When</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                                    {[
                                        { key: "now", label: "Post Now", icon: Send },
                                        { key: "schedule", label: "Schedule", icon: Calendar },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setPublishMode(key as PublishMode)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                                                publishMode === key
                                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule picker */}
                            <AnimatePresence>
                                {publishMode === "schedule" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Date
                                            </label>
                                            <input
                                                type="date"
                                                value={scheduleDate}
                                                min={new Date().toISOString().split("T")[0]}
                                                onChange={e => setScheduleDate(e.target.value)}
                                                className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Time
                                            </label>
                                            <input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={e => setScheduleTime(e.target.value)}
                                                className="w-full p-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer actions */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            {published ? (
                                <div className="flex items-center justify-center gap-3 py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span className="font-bold text-lg">
                                        {publishMode === "now" ? "Published!" : "Scheduled!"}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold h-12 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all"
                                        onClick={handlePublish}
                                        disabled={publishing || (!platforms.instagram && !platforms.facebook)}
                                    >
                                        {publishing ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : publishMode === "now" ? (
                                            <Send className="w-5 h-5 mr-2" />
                                        ) : (
                                            <Calendar className="w-5 h-5 mr-2" />
                                        )}
                                        {publishing
                                            ? "Publishing..."
                                            : publishMode === "now"
                                            ? "Publish Now"
                                            : "Schedule Post"}
                                    </Button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="font-semibold h-10 rounded-xl"
                                            onClick={handleSaveDraft}
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save Draft
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="font-semibold h-10 rounded-xl"
                                            onClick={onDownload}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
