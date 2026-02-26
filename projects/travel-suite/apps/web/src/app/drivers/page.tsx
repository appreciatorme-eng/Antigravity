"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Car,
    Plus,
    Search,
    Phone,
    Edit2,
    Trash2,
    Check,
    AlertCircle,
    Link2,
    Link2Off,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassSelect } from "@/components/glass/GlassInput";
import { GlassTextarea } from "@/components/glass/GlassInput";
import { GlassModal, GlassConfirmModal } from "@/components/glass/GlassModal";
import { GlassTableSkeleton } from "@/components/glass/GlassSkeleton";

type ExternalDriver = Database["public"]["Tables"]["external_drivers"]["Row"];
type NewDriver = Database["public"]["Tables"]["external_drivers"]["Insert"];

interface DriverAccountLink {
    id: string;
    external_driver_id: string;
    profile_id: string;
    is_active: boolean | null;
    profile_email?: string | null;
    profile_name?: string | null;
}

interface DriverAccountJoinRow {
    id: string;
    external_driver_id: string;
    profile_id: string;
    is_active: boolean;
    profiles: {
        email: string | null;
        full_name: string | null;
    } | null;
}

const VEHICLE_TYPES = [
    { value: "", label: "Select type" },
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
    const [deleteConfirm, setDeleteConfirm] = useState<ExternalDriver | null>(null);
    const [editingDriver, setEditingDriver] = useState<ExternalDriver | null>(null);
    const [saving, setSaving] = useState(false);
    const [linking, setLinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [driverAccountLinks, setDriverAccountLinks] = useState<Record<string, DriverAccountLink>>({});
    const [linkEmailByDriver, setLinkEmailByDriver] = useState<Record<string, string>>({});
    const [organizationId, setOrganizationId] = useState<string | null>(null);

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

    const ensureOrganizationId = useCallback(async (): Promise<string> => {
        if (organizationId) return organizationId;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Please sign in again.");
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, organization_id")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            throw new Error(`Failed to load profile: ${profileError.message}`);
        }

        if (profile?.organization_id) {
            setOrganizationId(profile.organization_id);
            return profile.organization_id;
        }

        // Reuse an organization already owned by this user before creating a new one.
        const { data: existingOrg, error: existingOrgError } = await supabase
            .from("organizations")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (existingOrgError) {
            throw new Error(`Failed to resolve organization: ${existingOrgError.message}`);
        }

        let resolvedOrgId = existingOrg?.id || null;

        if (!resolvedOrgId) {
            const slug = `agency-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
            const { data: newOrg, error: newOrgError } = await supabase
                .from("organizations")
                .insert({
                    name: "My Travel Agency",
                    slug,
                    owner_id: user.id,
                })
                .select("id")
                .single();

            if (newOrgError || !newOrg?.id) {
                throw new Error(newOrgError?.message || "Organization setup failed. Please contact support.");
            }

            resolvedOrgId = newOrg.id;
        }

        const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({ organization_id: resolvedOrgId })
            .eq("id", user.id);

        if (profileUpdateError) {
            throw new Error(`Organization created but profile could not be linked: ${profileUpdateError.message}`);
        }

        setOrganizationId(resolvedOrgId);
        return resolvedOrgId;
    }, [organizationId, supabase]);

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const orgId = await ensureOrganizationId();
            const { data, error } = await supabase
                .from("external_drivers")
                .select("*")
                .eq("organization_id", orgId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching drivers:", error);
                setError("Failed to load drivers");
                return;
            }

            const list = data || [];
            setDrivers(list);

            const driverIds = list.map((driver) => driver.id);
            if (!driverIds.length) {
                setDriverAccountLinks({});
                return;
            }

            const { data: links } = await supabase
                .from("driver_accounts")
                .select(`
                id,
                external_driver_id,
                profile_id,
                is_active,
                profiles:profile_id (
                    email,
                    full_name
                )
            `);

            const mapping: Record<string, DriverAccountLink> = {};
            (links as DriverAccountJoinRow[] | null || [])
                .filter((item) => driverIds.includes(item.external_driver_id))
                .forEach((item) => {
                    mapping[item.external_driver_id] = {
                        id: item.id,
                        external_driver_id: item.external_driver_id,
                        profile_id: item.profile_id,
                        is_active: item.is_active,
                        profile_email: item.profiles?.email || null,
                        profile_name: item.profiles?.full_name || null,
                    };
                });
            setDriverAccountLinks(mapping);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load drivers");
        } finally {
            setLoading(false);
        }
    }, [ensureOrganizationId, supabase]);

    useEffect(() => {
        void fetchDrivers();
    }, [fetchDrivers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const resolvedOrganizationId = await ensureOrganizationId();

            if (editingDriver) {
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
                const { error } = await supabase.from("external_drivers").insert({
                    organization_id: resolvedOrganizationId,
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

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        const { error } = await supabase
            .from("external_drivers")
            .delete()
            .eq("id", deleteConfirm.id);

        if (error) {
            setError("Failed to delete driver");
            setDeleteConfirm(null);
            return;
        }

        setSuccess("Driver deleted successfully");
        setDeleteConfirm(null);
        fetchDrivers();
    };

    const handleLinkDriverAccount = async (driver: ExternalDriver) => {
        const email = (linkEmailByDriver[driver.id] || "").trim().toLowerCase();
        if (!email) {
            setError("Enter app user email to link this driver.");
            return;
        }

        setLinking(true);
        setError(null);

        try {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id,email,full_name,role")
                .eq("email", email)
                .maybeSingle();

            if (profileError || !profile) {
                throw new Error("No app user found with that email.");
            }

            const { data: upserted, error: upsertError } = await supabase
                .from("driver_accounts")
                .upsert(
                    {
                        external_driver_id: driver.id,
                        profile_id: profile.id,
                        is_active: true,
                    },
                    { onConflict: "external_driver_id" }
                )
                .select("id,external_driver_id,profile_id,is_active")
                .single();

            if (upsertError || !upserted) {
                throw upsertError ?? new Error("Failed to link driver account.");
            }

            if (profile.role !== "driver") {
                const { error: roleError } = await supabase
                    .from("profiles")
                    .update({ role: "driver" })
                    .eq("id", profile.id);

                if (roleError) {
                    throw new Error(`Linked account but failed to set driver role: ${roleError.message}`);
                }
            }

            setDriverAccountLinks((prev) => ({
                ...prev,
                [driver.id]: {
                    id: upserted.id,
                    external_driver_id: upserted.external_driver_id,
                    profile_id: upserted.profile_id,
                    is_active: upserted.is_active,
                    profile_email: profile.email,
                    profile_name: profile.full_name,
                },
            }));
            setSuccess("Driver linked to app account and role synced.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to link driver account.");
        } finally {
            setLinking(false);
        }
    };

    const handleUnlinkDriverAccount = async (driver: ExternalDriver) => {
        const existing = driverAccountLinks[driver.id];
        if (!existing) return;

        setLinking(true);
        setError(null);

        try {
            const { error } = await supabase
                .from("driver_accounts")
                .delete()
                .eq("id", existing.id);

            if (error) throw error;

            setDriverAccountLinks((prev) => {
                const clone = { ...prev };
                delete clone[driver.id];
                return clone;
            });
            setSuccess("Driver link removed.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to unlink driver account.");
        } finally {
            setLinking(false);
        }
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Drivers</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white mt-2">Drivers</h1>
                    <p className="text-text-secondary">
                        Manage your partner drivers for trip assignments
                    </p>
                </div>
                <GlassButton
                    variant="primary"
                    onClick={() => {
                        resetForm();
                        setEditingDriver(null);
                        setShowModal(true);
                    }}
                >
                    <Plus className="w-5 h-5" />
                    Add Driver
                </GlassButton>
            </div>

            {/* Notifications */}
            {success && (
                <GlassCard className="bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Check className="w-5 h-5" />
                        {success}
                    </div>
                </GlassCard>
            )}
            {error && (
                <GlassCard className="bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                </GlassCard>
            )}

            {/* Search */}
            <GlassInput
                icon={Search}
                type="text"
                placeholder="Search by name, phone, or plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth={false}
                className="max-w-md"
            />

            {/* Drivers Table */}
            <GlassCard padding="none">
                {loading ? (
                    <GlassTableSkeleton rows={5} />
                ) : filteredDrivers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Car className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                        <p className="text-text-secondary">
                            {searchQuery
                                ? "No drivers match your search"
                                : "No drivers added yet"}
                        </p>
                        {!searchQuery && (
                            <GlassButton
                                variant="ghost"
                                onClick={() => setShowModal(true)}
                                className="mt-4"
                            >
                                Add your first driver
                            </GlassButton>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-white/20">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Driver
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Vehicle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Capacity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        App Link
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredDrivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                                                    <span className="text-primary font-medium">
                                                        {driver.full_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Link href={`/drivers/${driver.id}`} className="font-medium text-secondary dark:text-white hover:text-primary flex items-center gap-1">
                                                        {driver.full_name}
                                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                                    </Link>
                                                    {driver.languages && driver.languages.length > 0 && (
                                                        <p className="text-sm text-text-secondary">
                                                            {driver.languages.join(", ")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={`tel:${driver.phone}`}
                                                className="flex items-center gap-2 text-text-secondary hover:text-primary"
                                            >
                                                <Phone className="w-4 h-4" />
                                                {driver.phone}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-secondary dark:text-white capitalize">
                                                    {driver.vehicle_type || "-"}
                                                </p>
                                                {driver.vehicle_plate && (
                                                    <p className="text-sm text-text-secondary">
                                                        {driver.vehicle_plate}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {driver.vehicle_capacity} seats
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${driver.is_active
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400"
                                                    }`}
                                            >
                                                {driver.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {driverAccountLinks[driver.id] ? (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                                        Linked: {driverAccountLinks[driver.id].profile_email || "app user"}
                                                    </div>
                                                    <button
                                                        onClick={() => void handleUnlinkDriverAccount(driver)}
                                                        disabled={linking}
                                                        className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-60"
                                                    >
                                                        <Link2Off className="w-3.5 h-3.5" />
                                                        Unlink
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input
                                                        type="email"
                                                        placeholder="driver app email"
                                                        value={linkEmailByDriver[driver.id] || ""}
                                                        onChange={(e) =>
                                                            setLinkEmailByDriver((prev) => ({
                                                                ...prev,
                                                                [driver.id]: e.target.value,
                                                            }))
                                                        }
                                                        className="w-44 rounded-lg border border-white/20 px-2 py-1 text-xs bg-white/50 dark:bg-white/10 text-secondary dark:text-white"
                                                    />
                                                    <button
                                                        onClick={() => void handleLinkDriverAccount(driver)}
                                                        disabled={linking}
                                                        className="inline-flex items-center gap-1 text-xs text-secondary dark:text-white hover:underline disabled:opacity-60"
                                                    >
                                                        <Link2 className="w-3.5 h-3.5" />
                                                        Link
                                                    </button>
                                                </div>
                                            )}
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
                                                    onClick={() => setDeleteConfirm(driver)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                    </div>
                )}
            </GlassCard>

            {/* Add/Edit Modal */}
            <GlassModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingDriver(null);
                    resetForm();
                }}
                title={editingDriver ? "Edit Driver" : "Add New Driver"}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassInput
                            label="Full Name"
                            type="text"
                            required
                            value={formData.full_name || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, full_name: e.target.value })
                            }
                            placeholder="John Doe"
                        />

                        <GlassInput
                            label="Phone Number"
                            type="tel"
                            required
                            value={formData.phone || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="+1234567890"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassSelect
                            label="Vehicle Type"
                            value={formData.vehicle_type || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    vehicle_type: e.target.value as ExternalDriver["vehicle_type"],
                                })
                            }
                            options={VEHICLE_TYPES}
                        />

                        <GlassInput
                            label="Vehicle Plate"
                            type="text"
                            value={formData.vehicle_plate || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, vehicle_plate: e.target.value })
                            }
                            placeholder="ABC-1234"
                        />
                    </div>

                    <GlassInput
                        label="Passenger Capacity"
                        type="number"
                        min={1}
                        max={50}
                        value={formData.vehicle_capacity || 4}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                vehicle_capacity: parseInt(e.target.value),
                            })
                        }
                    />

                    <GlassInput
                        label="Languages (comma-separated)"
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
                        placeholder="English, Spanish, French"
                    />

                    <GlassTextarea
                        label="Notes"
                        value={formData.notes || ""}
                        onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                        placeholder="Any additional notes about this driver..."
                    />

                    <div className="flex items-center gap-3 pt-4">
                        <GlassButton
                            type="button"
                            variant="ghost"
                            fullWidth
                            onClick={() => {
                                setShowModal(false);
                                setEditingDriver(null);
                                resetForm();
                            }}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={saving}
                        >
                            {editingDriver ? "Update Driver" : "Add Driver"}
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            {/* Delete Confirmation */}
            <GlassConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Driver"
                message={`Are you sure you want to delete ${deleteConfirm?.full_name}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
