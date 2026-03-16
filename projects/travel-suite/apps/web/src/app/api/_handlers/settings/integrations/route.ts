// Settings — integrations status endpoint.
// Returns enabled/configured state for each third-party integration.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
    isEmailIntegrationEnabled,
    isPaymentsIntegrationEnabled,
    isWhatsAppIntegrationEnabled,
} from "@/lib/integrations";
import { logError } from "@/lib/observability/logger";

function envConfigured(key: string): boolean {
    const val = process.env[key]?.trim();
    return Boolean(val && val.length > 0);
}

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        if (!admin.ok) return admin.response;

        const integrations = {
            payments: {
                enabled: isPaymentsIntegrationEnabled(),
                configured: envConfigured("RAZORPAY_KEY_ID") && envConfigured("RAZORPAY_KEY_SECRET"),
                provider: "razorpay",
            },
            email: {
                enabled: isEmailIntegrationEnabled(),
                configured: envConfigured("RESEND_API_KEY"),
                provider: "resend",
            },
            whatsapp: {
                enabled: isWhatsAppIntegrationEnabled(),
                configured: envConfigured("WHATSAPP_TOKEN") && envConfigured("WHATSAPP_PHONE_ID"),
                provider: "waha",
            },
            maps: {
                enabled: envConfigured("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
                configured: envConfigured("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
                provider: "google_maps",
            },
            ai: {
                enabled: envConfigured("GOOGLE_GEMINI_API_KEY") || envConfigured("OPENAI_API_KEY"),
                configured: envConfigured("GOOGLE_GEMINI_API_KEY") || envConfigured("OPENAI_API_KEY"),
                provider: envConfigured("GOOGLE_GEMINI_API_KEY") ? "gemini" : "openai",
            },
        };

        return NextResponse.json({ integrations });
    } catch (error) {
        logError("[/api/settings/integrations:GET] Unhandled error", error);
        return NextResponse.json(
            { data: null, error: "An unexpected error occurred. Please try again." },
            { status: 500 },
        );
    }
}
