"use client";

import { Car, Clock, MapPin, MessageCircle } from "lucide-react";
import type { Driver, DriverAssignment } from "./types";

interface DriverAssignmentCardProps {
    activeDay: number;
    assignment: DriverAssignment | undefined;
    drivers: Driver[];
    busyDriverIds: string[];
    whatsAppLink: string | null;
    onUpdateAssignment: (dayNumber: number, field: keyof DriverAssignment, value: string) => void;
}

export function DriverAssignmentCard({
    activeDay,
    assignment,
    drivers,
    busyDriverIds,
    whatsAppLink,
    onUpdateAssignment,
}: DriverAssignmentCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Car className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Driver Assignment</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Driver
                    </label>
                    <select
                        value={assignment?.external_driver_id || ""}
                        onChange={(e) =>
                            onUpdateAssignment(activeDay, "external_driver_id", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="">No driver assigned</option>
                        {drivers.map((driver) => {
                            const isBusy = busyDriverIds.includes(driver.id);
                            return (
                                <option
                                    key={driver.id}
                                    value={driver.id}
                                    disabled={isBusy}
                                    className={isBusy ? "text-red-500" : ""}
                                >
                                    {driver.full_name}
                                    {driver.vehicle_type ? ` - ${driver.vehicle_type}` : ""}
                                    {driver.vehicle_plate ? ` (${driver.vehicle_plate})` : ""}
                                    {isBusy ? " (Unavailable - Assigned to another trip)" : ""}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Pickup Time
                        </label>
                        <input
                            type="time"
                            value={assignment?.pickup_time || ""}
                            onChange={(e) =>
                                onUpdateAssignment(activeDay, "pickup_time", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            Pickup Location
                        </label>
                        <input
                            type="text"
                            value={assignment?.pickup_location || ""}
                            onChange={(e) =>
                                onUpdateAssignment(activeDay, "pickup_location", e.target.value)
                            }
                            placeholder="Hotel lobby, airport..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes for Driver
                    </label>
                    <textarea
                        value={assignment?.notes || ""}
                        onChange={(e) => onUpdateAssignment(activeDay, "notes", e.target.value)}
                        placeholder="Special instructions..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {assignment?.external_driver_id && (
                    <div className="pt-4 border-t border-gray-100">
                        <a
                            href={whatsAppLink || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Send to Driver via WhatsApp
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
