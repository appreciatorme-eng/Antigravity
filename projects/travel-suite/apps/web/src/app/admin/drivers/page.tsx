"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Car,
    Plus,
    Search,
    Phone,
    Edit2,
    Trash2,
    X,
    Loader2,
    Check,
    AlertCircle,
} from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type ExternalDriver = Database["public"]["Tables"]["external_drivers"]["Row"];
type NewDriver = Database["public"]["Tables"]["external_drivers"]["Insert"];

const VEHICLE_TYPES = [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "van", label: "Van" },
    { value: "minibus", label: "Minibus" },
    { value: "bus", label: "Bus" },
];

export default function DriversPage() {
    const supabase = createClient();
    const [drivers, setDrivers] = useState<ExternalDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState<ExternalDriver | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<NewDriver>>({
        full_name: "",
        phone: "",
        vehicle_type: null,
        vehicle_plate: "",
        vehicle_capacity: 4,
        languages: [],
        notes: "",
    });

    const fetchDrivers = async () => {
        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .single();

        if (!profile?.organization_id) {
            // If no org, create one for this admin
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: newOrg } = await supabase
                    .from("organizations")
                    .insert({
                        name: "My Travel Agency",
                        slug: `agency-${user.id.slice(0, 8)}`,
                        owner_id: user.id,
                    })
                    .select()
                    .single();

                if (newOrg) {
                    await supabase
                        .from("profiles")
                        .update({ organization_id: newOrg.id })
                        .eq("id", user.id);
                }
            }
        }

        const { data, error } = await supabase
            .from("external_drivers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching drivers:", error);
            return;
        }

        setDrivers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Get organization ID
            const { data: profile } = await supabase
                .from("profiles")
                .select("organization_id")
                .single();

            if (!profile?.organization_id) {
                throw new Error("No organization found. Please refresh and try again.");
            }

            if (editingDriver) {
                // Update existing driver
                const { error } = await supabase
                    .from("external_drivers")
                    .update({
                        full_name: formData.full_name,
                        phone: formData.phone,
                        vehicle_type: formData.vehicle_type as ExternalDriver["vehicle_type"],
                        vehicle_plate: formData.vehicle_plate,
                        vehicle_capacity: formData.vehicle_capacity,
                        languages: formData.languages,
                        notes: formData.notes,
                    })
                    .eq("id", editingDriver.id);

                if (error) throw error;
                setSuccess("Driver updated successfully");
            } else {
                // Create new driver
                const { error } = await supabase.from("external_drivers").insert({
                    organization_id: profile.organization_id,
                    full_name: formData.full_name!,
                    phone: formData.phone!,
                    vehicle_type: formData.vehicle_type as ExternalDriver["vehicle_type"],
                    vehicle_plate: formData.vehicle_plate,
                    vehicle_capacity: formData.vehicle_capacity || 4,
                    languages: formData.languages,
                    notes: formData.notes,
                });

                if (error) throw error;
                setSuccess("Driver added successfully");
            }

            setShowModal(false);
            setEditingDriver(null);
            resetForm();
            fetchDrivers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save driver");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (driver: ExternalDriver) => {
        if (!confirm(`Are you sure you want to delete ${driver.full_name}?`)) {
            return;
        }

        const { error } = await supabase
            .from("external_drivers")
            .delete()
            .eq("id", driver.id);

        if (error) {
            setError("Failed to delete driver");
            return;
        }

        setSuccess("Driver deleted successfully");
        fetchDrivers();
    };

    const handleEdit = (driver: ExternalDriver) => {
        setEditingDriver(driver);
        setFormData({
            full_name: driver.full_name,
            phone: driver.phone,
            vehicle_type: driver.vehicle_type,
            vehicle_plate: driver.vehicle_plate,
            vehicle_capacity: driver.vehicle_capacity,
            languages: driver.languages,
            notes: driver.notes,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            phone: "",
            vehicle_type: null,
            vehicle_plate: "",
            vehicle_capacity: 4,
            languages: [],
            notes: "",
        });
    };

    const filteredDrivers = drivers.filter(
        (driver) =>
            driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.phone.includes(searchQuery) ||
            driver.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Clear messages after 3 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif text-gray-900 mb-1">Drivers</h1>
                    <p className="text-gray-600">
                        Manage your partner drivers for trip assignments
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingDriver(null);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Driver
                </button>
            </div>

            {/* Notifications */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5" />
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or plate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
            </div>

            {/* Drivers Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Loading drivers...</p>
                    </div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                            {searchQuery
                                ? "No drivers match your search"
                                : "No drivers added yet"}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 text-primary hover:underline"
                            >
                                Add your first driver
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Driver
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Capacity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredDrivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-primary font-medium">
                                                    {driver.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {driver.full_name}
                                                </p>
                                                {driver.languages && driver.languages.length > 0 && (
                                                    <p className="text-sm text-gray-500">
                                                        {driver.languages.join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <a
                                            href={`tel:${driver.phone}`}
                                            className="flex items-center gap-2 text-gray-600 hover:text-primary"
                                        >
                                            <Phone className="w-4 h-4" />
                                            {driver.phone}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-gray-900 capitalize">
                                                {driver.vehicle_type || "-"}
                                            </p>
                                            {driver.vehicle_plate && (
                                                <p className="text-sm text-gray-500">
                                                    {driver.vehicle_plate}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {driver.vehicle_capacity} seats
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                driver.is_active
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {driver.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(driver)}
                                                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Edit driver"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(driver)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete driver"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingDriver ? "Edit Driver" : "Add New Driver"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingDriver(null);
                                    resetForm();
                                }}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="+1234567890"
                                />
                            </div>

                            {/* Vehicle Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vehicle Type
                                </label>
                                <select
                                    value={formData.vehicle_type || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            vehicle_type: e.target.value as ExternalDriver["vehicle_type"],
                                        })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">Select type</option>
                                    {VEHICLE_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Vehicle Plate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vehicle Plate
                                </label>
                                <input
                                    type="text"
                                    value={formData.vehicle_plate || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, vehicle_plate: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="ABC-1234"
                                />
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Passenger Capacity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.vehicle_capacity || 4}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            vehicle_capacity: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            {/* Languages */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Languages (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.languages?.join(", ") || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            languages: e.target.value
                                                .split(",")
                                                .map((l) => l.trim())
                                                .filter(Boolean),
                                        })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="English, Spanish, French"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    placeholder="Any additional notes about this driver..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingDriver(null);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : editingDriver ? (
                                        "Update Driver"
                                    ) : (
                                        "Add Driver"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
