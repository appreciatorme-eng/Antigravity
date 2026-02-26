"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { MessageSquare, Send, Stars, ListTodo, Users, ArrowRight, BarChart, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function MarketingPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("broadcast");

    const handleSendBroadcast = () => {
        toast({ title: "Broadcast Initiated", description: "Your WhatsApp campaign has been queued for delivery to 1,240 clients.", variant: "success" });
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Marketing Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Client <span className="text-primary">Engagement</span>
                    </h1>
                </div>

                <div className="flex bg-white/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-white/20">
                    <button
                        onClick={() => setActiveTab("broadcast")}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "broadcast" ? "bg-white dark:bg-slate-700 shadow-sm text-secondary dark:text-white" : "text-text-muted hover:text-secondary"}`}
                    >
                        Broadcast Studio
                    </button>
                    <button
                        onClick={() => setActiveTab("sequences")}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "sequences" ? "bg-white dark:bg-slate-700 shadow-sm text-secondary dark:text-white" : "text-text-muted hover:text-secondary"}`}
                    >
                        Automated Sequences
                    </button>
                    <button
                        onClick={() => setActiveTab("csat")}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "csat" ? "bg-white dark:bg-slate-700 shadow-sm text-secondary dark:text-white" : "text-text-muted hover:text-secondary"}`}
                    >
                        CSAT Analytics
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === "broadcast" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard padding="lg">
                            <h3 className="text-lg font-black text-secondary dark:text-white mb-6">WhatsApp Broadcast Studio</h3>

                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted">Target Audience</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-sm">Past 12 Months Clients</p>
                                            <p className="text-xs text-text-muted">1,240 contacts</p>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-primary/30 cursor-pointer flex justify-between items-center transition-colors">
                                        <div>
                                            <p className="font-bold text-sm">High Value (VIPs)</p>
                                            <p className="text-xs text-text-muted">142 contacts</p>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-600"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted">Broadcast Template</label>
                                <textarea
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px]"
                                    defaultValue={"Hi {{client_name}}, we just unlocked exclusive rates for cherry blossom season in Kyoto. Let me know if you want priority access for a quick getaway! 🌸"}
                                />
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-[10px] font-bold text-text-muted cursor-pointer hover:bg-gray-200">{"{{client_name}}"}</span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-[10px] font-bold text-text-muted cursor-pointer hover:bg-gray-200">{"{{last_destination}}"}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                <GlassButton variant="primary" className="h-12 px-8" onClick={handleSendBroadcast}>
                                    <Send className="w-4 h-4 mr-2" /> Dispatch Campaign
                                </GlassButton>
                            </div>
                        </GlassCard>
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="bg-gradient-to-br from-primary to-emerald-600 border-none relative overflow-hidden text-white" padding="lg">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                                <Stars className="w-12 h-12 text-white/80 mb-4" />
                                <h4 className="font-black text-2xl mb-2">Omnichannel AI Engagement</h4>
                                <p className="text-sm text-white/80">Upgrade your tier to unlock behavior-triggered WhatsApp and Email sequences driven by generative AI.</p>
                                <GlassButton className="mt-6 w-full bg-white/20 hover:bg-white text-white hover:text-primary border-none shadow-none">
                                    Unlock Features
                                </GlassButton>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {activeTab === "sequences" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: "Pre-Trip Countdown", trigger: "7 Days Before Trip", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10", active: true },
                        { title: "Welcome & Check-in", trigger: "Day 1 of Trip", icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-500/10", active: true },
                        { title: "Post-Trip Review (CSAT)", trigger: "2 Days After Trip", icon: Stars, color: "text-amber-500", bg: "bg-amber-500/10", active: true },
                        { title: "Reactivation Campaign", trigger: "180 Days After Trip", icon: Users, color: "text-rose-500", bg: "bg-rose-500/10", active: false },
                    ].map((seq, i) => (
                        <GlassCard key={i} className="hover:border-primary/30 transition-colors cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${seq.bg} ${seq.color}`}>
                                    <seq.icon className="w-5 h-5" />
                                </div>
                                <div className={`w-8 h-4 rounded-full border-2 ${seq.active ? "bg-primary border-primary flex justify-end" : "bg-gray-100 border-gray-200 flex justify-start"} p-0.5`}>
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                            </div>
                            <h3 className="font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">{seq.title}</h3>
                            <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-black">Trigger: {seq.trigger}</p>
                            <div className="mt-4 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Edit Sequence <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {activeTab === "csat" && (
                <div className="grid grid-cols-1 gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassCard className="text-center p-8">
                            <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Avg. Satisfaction</p>
                            <p className="text-6xl font-black text-secondary dark:text-white tabular-nums">4.9</p>
                            <p className="text-sm text-emerald-500 font-bold mt-2">↑ +0.2 this month</p>
                        </GlassCard>
                        <GlassCard className="text-center p-8">
                            <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Net Promoter Score</p>
                            <p className="text-6xl font-black text-secondary dark:text-white tabular-nums">78</p>
                            <p className="text-sm text-emerald-500 font-bold mt-2">Excellent (Top 5%)</p>
                        </GlassCard>
                        <GlassCard className="text-center p-8">
                            <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Survey Response Rate</p>
                            <p className="text-6xl font-black text-secondary dark:text-white tabular-nums">42<span className="text-3xl">%</span></p>
                            <p className="text-sm text-amber-500 font-bold mt-2">Could be optimized</p>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
}
