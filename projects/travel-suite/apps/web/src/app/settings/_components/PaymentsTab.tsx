"use client";

import { IndianRupee } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";

interface PaymentsTabProps {
    upiId: string;
    isUpiSaved: boolean;
    isUpiSaving: boolean;
    setUpiId: (v: string) => void;
    handleSaveUpi: () => Promise<void>;
}

export function PaymentsTab({
    upiId,
    isUpiSaved,
    isUpiSaving,
    setUpiId,
    handleSaveUpi,
}: PaymentsTabProps) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Payments</p>
            <div className="p-5 border border-white/10 rounded-2xl bg-white/5">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <IndianRupee className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-secondary dark:text-white">UPI</h4>
                            {isUpiSaved && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Saved</span>
                            )}
                        </div>
                        <p className="text-xs text-text-muted">Add your UPI ID to include payment links in WhatsApp messages and proposals.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={upiId}
                        onChange={(event) => setUpiId(event.target.value)}
                        placeholder="yourname@upi or yourname@bank"
                        aria-label="UPI ID"
                        className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                    <GlassButton
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => { void handleSaveUpi(); }}
                        disabled={isUpiSaving || !upiId.trim()}
                        className="text-xs px-5"
                    >
                        {isUpiSaving ? "Saving\u2026" : "Save"}
                    </GlassButton>
                </div>
            </div>
        </div>
    );
}
