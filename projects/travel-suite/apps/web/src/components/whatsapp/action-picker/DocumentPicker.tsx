/* Document/PDF picker — select a proposal PDF or paste a URL to send via WhatsApp. */
"use client";

import { useState } from "react";
import { FileText, Send, Link2, Loader2 } from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { ActionPickerProps } from "./shared";

export function DocumentPicker({ contact, onSend }: ActionPickerProps) {
    const [mode, setMode] = useState<"url" | "proposal">("url");
    const [url, setUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [fileName, setFileName] = useState("");
    const [sending, setSending] = useState(false);

    async function handleSend() {
        if (!url.trim()) return;
        setSending(true);
        try {
            const phone = contact.phone.replace(/\D/g, "");
            const res = await authedFetch("/api/whatsapp/send-rich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "media",
                    phone,
                    mediaUrl: url.trim(),
                    mediaType: "document",
                    caption: caption.trim() || undefined,
                    fileName: fileName.trim() || "document.pdf",
                    mimetype: "application/pdf",
                }),
            });
            if (res.ok) {
                const displayMsg = caption.trim()
                    ? `📄 ${fileName || "document.pdf"}\n${caption}`
                    : `📄 ${fileName || "document.pdf"}`;
                await onSend(displayMsg);
            }
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/5">
                {([
                    { key: "url" as const, label: "Paste URL", icon: <Link2 className="w-3.5 h-3.5" /> },
                    { key: "proposal" as const, label: "Proposal PDF", icon: <FileText className="w-3.5 h-3.5" /> },
                ]).map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setMode(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            mode === key ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>

            {mode === "url" && (
                <>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Document URL</label>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://storage.example.com/itinerary.pdf"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">File Name</label>
                            <input
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="itinerary.pdf"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Caption</label>
                            <input
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Your Kerala itinerary"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                            />
                        </div>
                    </div>
                </>
            )}

            {mode === "proposal" && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                        Go to a proposal → click &quot;Share PDF&quot; → copy the URL → paste above
                    </p>
                </div>
            )}

            <button
                onClick={() => { void handleSend(); }}
                disabled={!url.trim() || sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : `Send to ${contact.name}`}
            </button>
        </div>
    );
}
