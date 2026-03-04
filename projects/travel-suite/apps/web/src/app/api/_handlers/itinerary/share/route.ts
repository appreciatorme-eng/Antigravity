
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
    getIntegrationDisabledMessage,
    isWhatsAppIntegrationEnabled,
} from "@/lib/integrations";

const ShareSchema = z.object({
    phoneNumber: z.string().min(10, "Phone number must be valid"),
    tripTitle: z.string().min(1),
    shareUrl: z.string().url().optional(),
    pdfUrl: z.string().url().optional(),
}).refine((value) => Boolean(value.shareUrl || value.pdfUrl), {
    message: "Provide shareUrl or pdfUrl",
});

export async function POST(req: NextRequest) {
    try {
        if (!isWhatsAppIntegrationEnabled()) {
            return NextResponse.json(
                {
                    success: false,
                    disabled: true,
                    error: getIntegrationDisabledMessage("whatsapp"),
                },
                { status: 202 }
            );
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { phoneNumber, tripTitle, shareUrl, pdfUrl } = ShareSchema.parse(body);
        const itineraryUrl = shareUrl || pdfUrl;

        const result = await sendWhatsAppText(
            phoneNumber,
            `Your itinerary "${tripTitle}" is ready. View details here: ${itineraryUrl}`
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to send WhatsApp message" },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Sent successfully",
            provider: result.provider,
            messageId: result.messageId,
        });

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
