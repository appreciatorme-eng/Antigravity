"use client";

import { Inbox, MessageCircle, UserCircle2 } from "lucide-react";

const tickets = [
    {
        id: "SUP-1042",
        requester: "Liam Walker",
        subject: "Luggage allowance for day 3 flight",
        status: "open",
        updated: "2 hours ago",
    },
    {
        id: "SUP-1037",
        requester: "Ava Chen",
        subject: "Can we add a tea ceremony?",
        status: "pending",
        updated: "Yesterday",
    },
    {
        id: "SUP-1029",
        requester: "Sofia Ramirez",
        subject: "Invoice correction requested",
        status: "resolved",
        updated: "3 days ago",
    },
];

export default function SupportPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Support Inbox</h1>
                    <p className="text-sm text-gray-500">Mock client requests and internal notes.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="grid grid-cols-12 border-b border-gray-100 px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    <div className="col-span-3">Requester</div>
                    <div className="col-span-6">Subject</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Updated</div>
                </div>
                <div className="divide-y divide-gray-100">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="grid grid-cols-12 items-center px-6 py-4">
                            <div className="col-span-3 flex items-center gap-3">
                                <UserCircle2 className="w-8 h-8 text-gray-300" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{ticket.requester}</p>
                                    <p className="text-xs text-gray-400">{ticket.id}</p>
                                </div>
                            </div>
                            <div className="col-span-6 text-sm text-gray-700 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-300" />
                                {ticket.subject}
                            </div>
                            <div className="col-span-2">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    ticket.status === "open"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : ticket.status === "pending"
                                            ? "bg-amber-50 text-amber-700"
                                            : "bg-gray-100 text-gray-600"
                                }`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div className="col-span-1 text-right text-xs text-gray-400">{ticket.updated}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
