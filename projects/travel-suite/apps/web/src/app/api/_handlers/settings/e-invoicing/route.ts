// Settings — E-invoicing configuration endpoint.
// Returns configured state and settings for GST e-invoicing integration.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { encryptIRPCredential } from "@/lib/security/irp-crypto";

function envConfigured(key: string): boolean {
    const val = process.env[key]?.trim();
    return Boolean(val && val.length > 0);
}

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        if (!admin.ok) return admin.response;

        const { adminClient, organizationId } = admin;

        if (!organizationId) {
            return NextResponse.json(
                { data: null, error: "Organization not configured" },
                { status: 400 }
            );
        }

        // Fetch e-invoice settings for the organization
        const { data: settings, error } = await adminClient
            .from("e_invoice_settings")
            .select("*")
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (error) {
            logError("[/api/settings/e-invoicing:GET] Database error", error);
            return NextResponse.json(
                { data: null, error: "Failed to fetch e-invoice settings" },
                { status: 500 }
            );
        }

        // Check if IRP encryption key is configured
        const encryptionConfigured = envConfigured("IRP_ENCRYPTION_KEY") || process.env.NODE_ENV !== "production";

        const response = {
            enabled: Boolean(settings && settings.auto_generate_enabled),
            configured: Boolean(
                settings &&
                settings.gstin &&
                settings.irp_username &&
                settings.irp_password_encrypted
            ),
            encryptionConfigured,
            settings: settings ? {
                gstin: settings.gstin || "",
                irp_username: settings.irp_username || "",
                threshold_amount: settings.threshold_amount || 0,
                auto_generate_enabled: settings.auto_generate_enabled || false,
                sandbox_mode: settings.sandbox_mode ?? true,
                hasPassword: Boolean(settings.irp_password_encrypted),
            } : null,
        };

        return NextResponse.json(response);
    } catch (error) {
        logError("[/api/settings/e-invoicing:GET] Unhandled error", error);
        return NextResponse.json(
            { data: null, error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        if (!admin.ok) return admin.response;

        const { adminClient, organizationId } = admin;

        if (!organizationId) {
            return NextResponse.json(
                { data: null, error: "Organization not configured" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            gstin,
            irp_username,
            irp_password,
            threshold_amount,
            auto_generate_enabled,
            sandbox_mode,
        } = body;

        // Validate required fields
        if (!gstin || !irp_username) {
            return NextResponse.json(
                { data: null, error: "GSTIN and IRP username are required" },
                { status: 400 }
            );
        }

        // Validate GSTIN format (15 characters alphanumeric)
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
            return NextResponse.json(
                { data: null, error: "Invalid GSTIN format" },
                { status: 400 }
            );
        }

        // Prepare data for upsert
        const settingsData: Record<string, unknown> = {
            organization_id: organizationId,
            gstin: gstin.toUpperCase(),
            irp_username: irp_username.trim(),
            threshold_amount: threshold_amount || 0,
            auto_generate_enabled: auto_generate_enabled ?? false,
            sandbox_mode: sandbox_mode ?? true,
            updated_at: new Date().toISOString(),
        };

        // Encrypt password if provided
        if (irp_password && irp_password.trim()) {
            try {
                settingsData.irp_password_encrypted = encryptIRPCredential(irp_password.trim());
            } catch (encryptError) {
                logError("[/api/settings/e-invoicing:POST] Encryption error", encryptError);
                return NextResponse.json(
                    { data: null, error: "Failed to encrypt credentials. Ensure IRP_ENCRYPTION_KEY is configured." },
                    { status: 500 }
                );
            }
        }

        // Upsert settings (insert or update)
        const { data, error } = await adminClient
            .from("e_invoice_settings")
            .upsert(settingsData, {
                onConflict: "organization_id",
            })
            .select()
            .single();

        if (error) {
            logError("[/api/settings/e-invoicing:POST] Database error", error);
            return NextResponse.json(
                { data: null, error: "Failed to save e-invoice settings" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "E-invoice settings saved successfully",
            settings: {
                gstin: data.gstin,
                irp_username: data.irp_username,
                threshold_amount: data.threshold_amount,
                auto_generate_enabled: data.auto_generate_enabled,
                sandbox_mode: data.sandbox_mode,
            },
        });
    } catch (error) {
        logError("[/api/settings/e-invoicing:POST] Unhandled error", error);
        return NextResponse.json(
            { data: null, error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
