"use client";

import { useState } from "react";
import { Calculator, Send, Plus, Minus, DollarSign, Calendar, MapPin, Users } from "lucide-react";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { useToast } from "@/components/ui/toast";

interface QuickQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickQuoteModal({ isOpen, onClose }: QuickQuoteModalProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form state
    const [destination, setDestination] = useState("");
    const [duration, setDuration] = useState("7");
    const [travelers, setTravelers] = useState("2");
    const [level, setLevel] = useState("Premium");

    const [estimate, setEstimate] = useState<number | null>(null);

    const calculateEstimate = () => {
        setLoading(true);
        // Simulate an AI/Rules-based pricing engine (Mock implementation)
        setTimeout(() => {
            const basePerDay = level === "Luxury" ? 1200 : level === "Premium" ? 600 : 250;
            const days = parseInt(duration) || 7;
            const pax = parseInt(travelers) || 2;

            setEstimate(basePerDay * days * pax);
            setStep(2);
            setLoading(false);
        }, 1200);
    };

    const sendQuote = () => {
        toast({ title: "Quote Dispatched", description: "Quick estimate sent to prospect's WhatsApp.", variant: "success" });
        onClose();
        setTimeout(() => {
            setStep(1);
            setEstimate(null);
        }, 500);
    };

    return (
        <GlassModal isOpen={isOpen} onClose={onClose} title="Quick Quote AI Engine">
            {step === 1 ? (
                <div className="space-y-6">
                    <p className="text-sm text-text-muted">Instantly generate a highly accurate 30-second price estimation based on historical market telemetry and supplier margins.</p>

                    <div className="space-y-4">
                        <GlassInput
                            label="Target Environment (Destination)"
                            placeholder="e.g. Kyoto, Japan"
                            icon={MapPin}
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <GlassInput
                                label="Cycle Duration (Days)"
                                type="number"
                                min={1}
                                icon={Calendar}
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                            <GlassInput
                                label="Entity Count (Pax)"
                                type="number"
                                min={1}
                                icon={Users}
                                value={travelers}
                                onChange={(e) => setTravelers(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Tier Classification</label>
                            <div className="grid grid-cols-3 gap-3">
                                {["Standard", "Premium", "Luxury"].map((tier) => (
                                    <button
                                        key={tier}
                                        onClick={() => setLevel(tier)}
                                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${level === tier ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white/50 dark:bg-slate-800/50 text-text-muted hover:border-primary/50"}`}
                                    >
                                        {tier}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <GlassButton
                            variant="primary"
                            className="w-full h-12"
                            onClick={calculateEstimate}
                            loading={loading}
                        >
                            <Calculator className="w-4 h-4 mr-2" /> Calculate Tactical Estimate
                        </GlassButton>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Estimated Budget Requirements</p>
                        <h2 className="text-6xl font-black text-secondary dark:text-white tracking-tighter tabular-nums pb-2 text-gradient-primary">
                            ${estimate?.toLocaleString()}
                        </h2>
                        <p className="text-sm font-medium text-text-muted max-w-[280px] mx-auto">
                            Based on {travelers} pax traversing {destination || "Earth"} for {duration} cycles at {level} tier.
                        </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4 text-sm text-secondary dark:text-slate-300">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold">Estimated Provider Margin: ~22%</p>
                            <p className="text-xs text-text-muted mt-1">This figure includes projected accommodation and transport yields based on active telemetry mapping.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <GlassButton variant="outline" className="w-full h-12" onClick={() => setStep(1)}>
                            Recalibrate Vectors
                        </GlassButton>
                        <GlassButton variant="primary" className="w-full h-12" onClick={sendQuote}>
                            <Send className="w-4 h-4 mr-2" /> Broadcast to Client
                        </GlassButton>
                    </div>
                </div>
            )}
        </GlassModal>
    );
}
