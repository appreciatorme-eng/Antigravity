"use client";

import { ClipboardList, Bell, MapPin, User, MessageCircle } from "lucide-react";

const activityFeed = [
    {
        id: "mock-activity-01",
        type: "trip",
        title: "Trip confirmed",
        detail: "Kyoto Blossom Trail is now confirmed.",
        time: "2 hours ago",
        icon: MapPin,
        tone: "bg-blue-100 text-blue-600",
    },
    {
        id: "mock-activity-02",
        type: "notification",
        title: "Push sent",
        detail: "Client notified about updated itinerary.",
        time: "4 hours ago",
        icon: Bell,
        tone: "bg-amber-100 text-amber-600",
    },
    {
        id: "mock-activity-03",
        type: "client",
        title: "New client inquiry",
        detail: "Sofia Ramirez requested a quote for Lisbon.",
        time: "Yesterday",
        icon: User,
        tone: "bg-emerald-100 text-emerald-600",
    },
    {
        id: "mock-activity-04",
        type: "support",
        title: "Support message",
        detail: "Liam Walker asked about luggage limits.",
        time: "2 days ago",
        icon: MessageCircle,
        tone: "bg-purple-100 text-purple-600",
    },
];

export default function AdminActivityPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Activity Feed</h1>
                    <p className="text-sm text-gray-500">Mock timeline for operational activity.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="space-y-6">
                    {activityFeed.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.tone}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                    <span className="text-xs text-gray-400">{item.time}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{item.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
