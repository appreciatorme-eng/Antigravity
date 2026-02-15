"use client";

import { Wand2, Bell, MessageCircle, Save } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";

const templates = [
    {
        id: "tmpl-1",
        title: "Itinerary Update",
        channel: "Push",
        subject: "Your itinerary is ready",
        body: "Hi {{client_name}}, your updated itinerary for {{destination}} is ready.",
    },
    {
        id: "tmpl-2",
        title: "Driver Assigned",
        channel: "WhatsApp",
        subject: "Driver confirmation",
        body: "Your driver {{driver_name}} will pick you up at {{pickup_time}}.",
    },
    {
        id: "tmpl-3",
        title: "Payment Reminder",
        channel: "Email",
        subject: "Deposit due soon",
        body: "This is a reminder that your deposit is due on {{due_date}}.",
    },
];

export default function TemplatesPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Templates</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Notification Templates</h1>
                    <p className="text-text-secondary mt-1">Mock templates for push, email, and WhatsApp.</p>
                </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <GlassCard key={template.id} padding="lg" rounded="2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-semibold text-secondary dark:text-white">{template.title}</p>
                                <GlassBadge variant="info" size="sm" className="mt-1">
                                    {template.channel}
                                </GlassBadge>
                            </div>
                            {template.channel === "Push" ? (
                                <Bell className="w-5 h-5 text-primary" />
                            ) : (
                                <MessageCircle className="w-5 h-5 text-primary" />
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-primary mb-1">Subject</div>
                                <div className="text-sm text-secondary dark:text-white">{template.subject}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wide text-primary mb-1">Body</div>
                                <div className="text-sm text-text-secondary rounded-lg border border-white/20 bg-white/40 dark:bg-white/5 p-3">
                                    {template.body}
                                </div>
                            </div>
                        </div>

                        <GlassButton variant="ghost" fullWidth className="mt-4">
                            <Save className="w-4 h-4" />
                            Save Template
                        </GlassButton>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
