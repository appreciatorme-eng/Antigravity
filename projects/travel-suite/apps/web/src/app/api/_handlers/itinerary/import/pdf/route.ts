import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { extractTourFromPDF } from "@/lib/import/pdf-extractor";
import { normalizeImportedItineraryDraft } from "@/lib/import/trip-draft";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const rateLimitResult = await enforceRateLimit({
      identifier: user.id,
      limit: 10,
      windowMs: 60 * 1000,
      prefix: "auth:import:pdf",
    });
    if (!rateLimitResult.success) {
      return apiError("Too many import requests. Please try again later.", 429);
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return apiError("PDF file is required (multipart/form-data)", 400);
    }

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return apiError("PDF file is required", 400);
    }

    const file = fileEntry;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return apiError("Only PDF files are supported", 400);
    }

    const extraction = await extractTourFromPDF(file);
    if (!extraction.success || !extraction.data) {
      return apiError(extraction.error || "Failed to extract itinerary from PDF", 422);
    }

    const draft = normalizeImportedItineraryDraft(extraction.data, {
      filename: file.name,
      source: "pdf",
    });

    return NextResponse.json({
      success: true,
      draft,
      warnings: draft.warnings,
      missing_sections: draft.missing_sections,
      source_meta: draft.source_meta,
    });
  } catch (error: unknown) {
    console.error("PDF Import Error:", error);
    const message = safeErrorMessage(error, "Request failed");
    return apiError(message, 500);
  }
}
