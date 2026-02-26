"use client";

import { MessageCircle, Mail, Filter, Search, Phone, MoreVertical, Archive, PlayCircle } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";

const MOCK_MESSAGES = [
    {
        id: 1,
        name: "Rahul Sharma",
        trip: "Kerala 5N/6D Honeymoon",
        preview: "Yes, the pricing looks good. Can we proceed with the booking?",
        time: "10:42 AM",
        unread: 2,
        status: "Action Required"
    },
    {
        id: 2,
        name: "Neha Gupta",
        trip: "Dubai Group Tour",
        preview: "Please share the flight options once again.",
        time: "Yesterday",
        unread: 0,
        status: "Waiting for Info"
    },
    {
        id: 3,
        name: "Vikram Singh",
        trip: "Bali Adventure Planner",
        preview: "Thanks for the amazing itinerary! We loved it.",
        time: "Tue",
        unread: 0,
        status: "Closed Won"
    }
];

export default function InboxPage() {
    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4 w-full">
            {/* Thread List Sidebar */}
            <GlassCard className="w-full max-w-sm flex shrink-0 flex-col overflow-hidden h-full border-slate-200/60 shadow-lg relative p-0">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 space-y-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold font-serif text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span className="bg-whatsapp/10 text-whatsapp p-1.5 rounded-lg">
                                <MessageCircle className="w-5 h-5" />
                            </span>
                            Omni-Channel Inbox
                        </h1>
                        <GlassButton variant="secondary" size="sm" className="h-8 w-8 px-0 rounded-full border-none shadow-none text-slate-400 hover:text-slate-600">
                            <Filter className="w-4 h-4" />
                        </GlassButton>
                    </div>
                    <GlassInput icon={Search} placeholder="Search messages, clients..." className="bg-white/80" />

                    <div className="flex gap-2">
                        <span className="bg-whatsapp text-white text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer shadow-sm">WhatsApp (12)</span>
                        <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-slate-200 transition-colors">Emails</span>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {MOCK_MESSAGES.map((msg, i) => (
                        <div key={msg.id} className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${i === 0 ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-800/20"}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate pr-2">{msg.name}</h3>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{msg.time}</span>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 truncate">{msg.trip}</p>
                            <p className={`text-xs pl-4 border-l-2 ${msg.unread > 0 ? "text-slate-700 dark:text-slate-300 font-semibold border-whatsapp" : "text-slate-500 border-slate-200"} line-clamp-2 leading-relaxed`}>
                                {msg.preview}
                            </p>
                            {msg.unread > 0 && (
                                <div className="mt-2 inline-block px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold shadow-sm">
                                    {msg.unread} new
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Conversation View */}
            <GlassCard className="flex-1 hidden md:flex flex-col h-full overflow-hidden p-0 border-slate-200/60 shadow-lg relative bg-white/40">
                <div className="absolute inset-0 bg-gradient-to-br from-whatsapp/5 to-transparent pointer-events-none" />

                {/* Chat Header */}
                <div className="h-16 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between px-6 bg-white/60 backdrop-blur-md relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm relative">
                            RS
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">Rahul Sharma</h2>
                            <div className="flex gap-2 text-[11px] font-medium text-slate-500">
                                <span>+91 98765 43210</span>
                                <span>•</span>
                                <span className="text-blue-500 hover:underline cursor-pointer">Kerala 5N/6D Honeymoon</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <GlassButton variant="ghost" size="sm" className="rounded-full w-8 h-8 px-0"><Phone className="w-4 h-4" /></GlassButton>
                        <GlassButton variant="ghost" size="sm" className="rounded-full w-8 h-8 px-0"><Archive className="w-4 h-4" /></GlassButton>
                        <GlassButton variant="ghost" size="sm" className="rounded-full w-8 h-8 px-0"><MoreVertical className="w-4 h-4" /></GlassButton>
                    </div>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar flex flex-col">
                    <div className="text-center my-4">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Today</span>
                    </div>

                    <div className="flex justify-end">
                        <div className="bg-whatsapp/10 dark:bg-whatsapp/20 border border-whatsapp/20 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
                            <p className="text-sm">Hi Rahul, please find your revised quote link attached below for the Kerala package.</p>
                            <div className="flex justify-end gap-1 mt-1">
                                <span className="text-[9px] text-slate-400 font-medium">10:30 AM</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm w-64 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                                    <PlayCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">Kerala Escape</h4>
                                    <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">₹ 54,000 • 5N/6D</p>
                                </div>
                            </div>
                            <div className="text-center border-t border-blue-100 pt-2 text-[10px] uppercase tracking-wider font-bold text-blue-600">Open Itinerary</div>
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm block relative">
                            <div className="absolute -top-3 -left-2 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm">NEW</div>
                            <p className="text-sm text-slate-800 dark:text-slate-200">Yes, the pricing looks good. Can we proceed with the booking?</p>
                            <div className="flex justify-end gap-1 mt-1">
                                <span className="text-[9px] text-slate-400 font-medium">10:42 AM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50 relative z-10">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message or use / for templates..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none outline-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-whatsapp/20 placeholder:text-slate-400"
                        />
                        <button className="bg-whatsapp hover:bg-whatsapp-dark text-white p-3 rounded-xl transition-transform active:scale-95 shadow-sm font-semibold flex items-center shrink-0">
                            Send
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
