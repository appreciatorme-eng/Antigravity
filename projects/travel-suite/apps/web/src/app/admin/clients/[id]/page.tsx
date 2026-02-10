"use client";

import { useParams } from "next/navigation";
import { Mail, Phone, MapPin, CalendarDays, BadgeCheck } from "lucide-react";

const mockClientProfiles = {
    "mock-client-1": {
        name: "Ava Chen",
        email: "ava.chen@example.com",
        phone: "+1 (415) 555-1122",
        loyalty: "Gold",
        preferences: {
            destination: "Kyoto, Japan",
            travelers: 2,
            budget: "$2,500 - $4,000",
            travelStyle: "Cultural + Food",
            interests: ["Onsen", "Tea ceremony", "Street food"],
            homeAirport: "SFO",
            leadStatus: "qualified",
            lifecycleStage: "active",
        },
        trips: [
            { id: "mock-trip-001", destination: "Kyoto, Japan", dates: "Mar 12 - Mar 17, 2026", status: "confirmed" },
            { id: "mock-trip-003", destination: "Osaka, Japan", dates: "Oct 02 - Oct 05, 2025", status: "completed" },
        ],
    },
    "mock-client-2": {
        name: "Liam Walker",
        email: "liam.walker@example.com",
        phone: "+44 20 7946 0901",
        loyalty: "Silver",
        preferences: {
            destination: "Reykjavik, Iceland",
            travelers: 1,
            budget: "$3,000 - $5,000",
            travelStyle: "Adventure",
            interests: ["Northern lights", "Hiking"],
            homeAirport: "LHR",
            leadStatus: "contacted",
            lifecycleStage: "prospect",
        },
        trips: [
            { id: "mock-trip-002", destination: "Reykjavik, Iceland", dates: "Feb 20 - Feb 27, 2026", status: "in_progress" },
        ],
    },
    "mock-client-3": {
        name: "Sofia Ramirez",
        email: "sofia.ramirez@example.com",
        phone: "+34 91 123 4567",
        loyalty: "Bronze",
        preferences: {
            destination: "Lisbon, Portugal",
            travelers: 4,
            budget: "$1,200 - $2,500",
            travelStyle: "Family",
            interests: ["History", "Beaches"],
            homeAirport: "MAD",
            leadStatus: "new",
            lifecycleStage: "lead",
        },
        trips: [
            { id: "mock-trip-004", destination: "Lisbon, Portugal", dates: "Jun 10 - Jun 14, 2025", status: "completed" },
        ],
    },
};

export default function ClientProfilePage() {
    const params = useParams();
    const clientId = params.id as string;
    const profile = mockClientProfiles[clientId as keyof typeof mockClientProfiles] ?? mockClientProfiles["mock-client-1"];

    return (
        <div className="p-8 space-y-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{profile.name}</h1>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {profile.email}
                            </span>
                            <span className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {profile.phone}
                            </span>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                        <BadgeCheck className="w-4 h-4" />
                        {profile.loyalty} tier
                    </span>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Trips</h2>
                <div className="space-y-3">
                    {profile.trips.map((trip) => (
                        <div key={trip.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{trip.destination}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <CalendarDays className="w-3 h-3" />
                                    {trip.dates}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="capitalize text-gray-600">{trip.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
                <div className="grid gap-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                        <span>Destination</span>
                        <span className="font-medium text-gray-900">{profile.preferences.destination}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Travelers</span>
                        <span className="font-medium text-gray-900">{profile.preferences.travelers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Budget Range</span>
                        <span className="font-medium text-gray-900">{profile.preferences.budget}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Travel Style</span>
                        <span className="font-medium text-gray-900">{profile.preferences.travelStyle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Home Airport</span>
                        <span className="font-medium text-gray-900">{profile.preferences.homeAirport}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Lead Status</span>
                        <span className="font-medium text-gray-900 capitalize">{profile.preferences.leadStatus}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Lifecycle Stage</span>
                        <span className="font-medium text-gray-900 capitalize">{profile.preferences.lifecycleStage}</span>
                    </div>
                    <div>
                        <span className="block mb-2">Interests</span>
                        <div className="flex flex-wrap gap-2">
                            {profile.preferences.interests.map((interest: string) => (
                                <span
                                    key={interest}
                                    className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
