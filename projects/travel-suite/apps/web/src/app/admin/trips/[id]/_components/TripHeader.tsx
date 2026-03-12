"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    User,
    MapPin,
    MessageCircle,
    Link2,
    Save,
    Bell,
    CopyPlus,
} from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput, GlassTextarea } from "@/components/glass/GlassInput";
import { GlassModal } from "@/components/glass/GlassModal";
import { useToast } from "@/components/ui/toast";
import { getDriverWhatsAppLink, formatClientWhatsAppMessage } from "@/lib/notifications.shared";
import type { Trip } from "./types";
import { formatDate } from "./utils";

interface TripHeaderProps {
    trip: Trip;
    durationDays: number;
    saving: boolean;
    liveLocationUrl: string;
    creatingLiveLink: boolean;
    onSave: () => void;
    onCreateLiveLink: () => void;
    onRevokeLiveLink: () => void;
}

export function TripHeader({
    trip,
    durationDays,
    saving,
    liveLocationUrl,
    creatingLiveLink,
    onSave,
    onCreateLiveLink,
    onRevokeLiveLink,
}: TripHeaderProps) {
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationTitle, setNotificationTitle] = useState("Trip Update");
    const [notificationBody, setNotificationBody] = useState("");
    const [notificationEmail, setNotificationEmail] = useState("");
    const [useEmailTarget, setUseEmailTarget] = useState(false);
    const { toast } = useToast();

    const clientWhatsAppLink = trip.profiles?.phone
        ? getDriverWhatsAppLink(
            trip.profiles.phone,
            formatClientWhatsAppMessage({
                clientName: trip.profiles?.full_name || "there",
                tripTitle: trip.itineraries?.trip_title,
                destination: trip.destination,
                startDate: trip.start_date ? formatDate(trip.start_date) : "",
                body: notificationBody || "",
            })
        )
        : null;

    const sendNotificationToClient = async () => {
        if (!trip.profiles?.id && !notificationEmail.trim()) return;

        try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const payload: Record<string, unknown> = {
                tripId: trip.id,
                type: "itinerary_update",
                title: notificationTitle,
                body: notificationBody || `Your trip to ${trip.destination || "Unknown Destination"} has been updated with new details.`,
            };

            if (useEmailTarget) {
                payload.email = notificationEmail.trim();
            } else {
                payload.userId = trip.profiles?.id;
            }

            const response = await fetch("/api/notifications/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({
                    title: "Notification sent",
                    description: "Update was sent to the client.",
                    variant: "success",
                });
                setNotificationOpen(false);
                setNotificationBody("");
                setNotificationEmail("");
                setUseEmailTarget(false);
            } else {
                const error = await response.json();
                toast({
                    title: "Notification failed",
                    description: `Failed to send notification: ${error.error || "Unknown error"}`,
                    variant: "error",
                });
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            toast({
                title: "Notification failed",
                description: "Error sending notification",
                variant: "error",
            });
        }
    };

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/trips"
                    className="p-2 hover:bg-white/40 dark:bg-white/5 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-text-secondary" />
                </Link>
                <div>
                    <h1 className="text-2xl font-[var(--font-display)] text-secondary dark:text-white">
                        {trip.itineraries?.trip_title || trip.destination}
                    </h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {trip.profiles?.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(trip.start_date || "")}
                        </span>
                        <span>{durationDays} days</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link
                    href={`/admin/trips/${trip.id}/clone`}
                    className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/40 dark:bg-white/5 transition-colors text-text-secondary"
                >
                    <CopyPlus className="h-4 w-4" />
                    Clone Trip
                </Link>
                <button
                    onClick={onCreateLiveLink}
                    disabled={creatingLiveLink}
                    className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/40 dark:bg-white/5 transition-colors text-text-secondary disabled:opacity-60"
                >
                    <Link2 className="h-4 w-4" />
                    {creatingLiveLink ? "Creating..." : "Live Link"}
                </button>
                <GlassButton variant="secondary" onClick={() => setNotificationOpen(true)}>
                    <Bell className="h-4 w-4" />
                    Notify Client
                </GlassButton>
                <GlassModal
                    isOpen={notificationOpen}
                    onClose={() => setNotificationOpen(false)}
                    title="Send Notification"
                    description="Send a push notification to the client regarding this trip. You can target by email to ensure it matches the mobile login."
                >
                    <div className="grid gap-4">
                        <label className="flex items-center gap-2 text-sm text-text-secondary">
                            <input
                                type="checkbox"
                                checked={useEmailTarget}
                                onChange={(e) => {
                                    setUseEmailTarget(e.target.checked);
                                    if (e.target.checked && !notificationEmail) {
                                        setNotificationEmail(trip.profiles?.email || "");
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            Send by email instead of user ID
                        </label>
                        {useEmailTarget && (
                            <GlassInput
                                label="Client Email"
                                type="email"
                                value={notificationEmail}
                                onChange={(e) => setNotificationEmail(e.target.value)}
                                placeholder={trip.profiles?.email || "client@example.com"}
                            />
                        )}
                        <GlassInput
                            label="Title"
                            value={notificationTitle}
                            onChange={(e) => setNotificationTitle(e.target.value)}
                            placeholder="Notification Title"
                        />
                        <GlassTextarea
                            label="Message"
                            value={notificationBody}
                            onChange={(e) => setNotificationBody(e.target.value)}
                            placeholder={`Your trip to ${trip.destination} has been updated...`}
                            rows={3}
                        />
                        <div className="flex justify-end mt-4">
                            <GlassButton variant="primary" onClick={sendNotificationToClient}>
                                Send Notification
                            </GlassButton>
                        </div>
                    </div>
                </GlassModal>
                {clientWhatsAppLink ? (
                    <a
                        href={clientWhatsAppLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 text-secondary dark:text-white rounded-lg hover:bg-white/40 dark:bg-white/5 transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Client
                    </a>
                ) : (
                    <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 text-primary rounded-lg cursor-not-allowed"
                        title="Client phone not available"
                    >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Client
                    </button>
                )}
                {liveLocationUrl ? (
                    <>
                        <a
                            href={liveLocationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 text-secondary dark:text-white rounded-lg hover:bg-white/40 dark:bg-white/5 transition-colors"
                            title="Open live location page"
                        >
                            <MapPin className="h-4 w-4" />
                            Open Live
                        </a>
                        <button
                            onClick={onRevokeLiveLink}
                            className="flex items-center gap-2 px-4 py-2 border border-white/20 dark:border-white/10 text-text-secondary rounded-lg hover:bg-white/40 dark:bg-white/5 transition-colors"
                            title="Disable active live links"
                        >
                            Revoke Live
                        </button>
                    </>
                ) : null}
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary dark:bg-white/20 text-white rounded-lg hover:bg-secondary/90 dark:hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
