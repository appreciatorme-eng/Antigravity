import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { REPUTATION_BRAND_VOICE_SELECT } from "@/lib/reputation/selects";
import type { BrandVoiceTone, LanguagePreference, ReputationBrandVoice } from "@/lib/reputation/types";
import { safeErrorMessage } from "@/lib/security/safe-error";

const VALID_TONES: BrandVoiceTone[] = [
  "professional_warm",
  "casual_friendly",
  "formal",
  "luxury",
];

const VALID_LANGUAGES: LanguagePreference[] = ["en", "hi", "mixed"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    const organizationId = profile.organization_id;

    // Fetch existing brand voice
    const { data: existingData } = await supabase
      .from("reputation_brand_voice")
      .select(REPUTATION_BRAND_VOICE_SELECT)
      .eq("organization_id", organizationId)
      .maybeSingle();
    const existing = existingData as unknown as ReputationBrandVoice | null;

    if (existing) {
      return NextResponse.json({ brandVoice: existing });
    }

    // Create default if not exists
    const defaultVoice = {
      organization_id: organizationId,
      tone: "professional_warm" as const,
      language_preference: "en" as const,
      owner_name: null,
      sign_off: null,
      key_phrases: [] as string[],
      avoid_phrases: [] as string[],
      sample_responses: [] as string[],
      auto_respond_positive: false,
      auto_respond_min_rating: 4,
      escalation_threshold: 2,
    };

    const { data: createdData, error: insertError } = await supabase
      .from("reputation_brand_voice")
      .insert(defaultVoice)
      .select(REPUTATION_BRAND_VOICE_SELECT)
      .single();
    const created = createdData as unknown as ReputationBrandVoice | null;

    if (insertError) {
      // If insert fails (race condition), try to fetch again
      const { data: retryFetchData } = await supabase
        .from("reputation_brand_voice")
        .select(REPUTATION_BRAND_VOICE_SELECT)
        .eq("organization_id", organizationId)
        .maybeSingle();
      const retryFetch = retryFetchData as unknown as ReputationBrandVoice | null;

      if (retryFetch) {
        return NextResponse.json({ brandVoice: retryFetch });
      }

      throw insertError;
    }

    return NextResponse.json({ brandVoice: created });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Internal server error");
    console.error("Error fetching brand voice:", error);
    return apiError(message, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    const organizationId = profile.organization_id;
    const body = await req.json();

    // Validate fields
    const updateData: Record<string, unknown> = {};

    if (body.tone !== undefined) {
      if (!VALID_TONES.includes(body.tone)) {
        return apiError(`Invalid tone. Must be one of: ${VALID_TONES.join(", ")}`, 400);
      }
      updateData.tone = body.tone;
    }

    if (body.language_preference !== undefined) {
      if (!VALID_LANGUAGES.includes(body.language_preference)) {
        return apiError(`Invalid language preference. Must be one of: ${VALID_LANGUAGES.join(", ")}`, 400);
      }
      updateData.language_preference = body.language_preference;
    }

    if (body.owner_name !== undefined) {
      updateData.owner_name =
        typeof body.owner_name === "string" && body.owner_name.trim()
          ? body.owner_name.trim()
          : null;
    }

    if (body.sign_off !== undefined) {
      updateData.sign_off =
        typeof body.sign_off === "string" && body.sign_off.trim()
          ? body.sign_off.trim()
          : null;
    }

    if (body.key_phrases !== undefined) {
      if (!isStringArray(body.key_phrases)) {
        return apiError("key_phrases must be an array of strings", 400);
      }
      updateData.key_phrases = body.key_phrases;
    }

    if (body.avoid_phrases !== undefined) {
      if (!isStringArray(body.avoid_phrases)) {
        return apiError("avoid_phrases must be an array of strings", 400);
      }
      updateData.avoid_phrases = body.avoid_phrases;
    }

    if (body.sample_responses !== undefined) {
      if (!isStringArray(body.sample_responses)) {
        return apiError("sample_responses must be an array of strings", 400);
      }
      updateData.sample_responses = body.sample_responses;
    }

    if (body.auto_respond_positive !== undefined) {
      updateData.auto_respond_positive = Boolean(body.auto_respond_positive);
    }

    if (body.auto_respond_min_rating !== undefined) {
      const rating = Number(body.auto_respond_min_rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return apiError("auto_respond_min_rating must be between 1 and 5", 400);
      }
      updateData.auto_respond_min_rating = rating;
    }

    if (body.escalation_threshold !== undefined) {
      const threshold = Number(body.escalation_threshold);
      if (!Number.isFinite(threshold) || threshold < 1 || threshold > 5) {
        return apiError("escalation_threshold must be between 1 and 5", 400);
      }
      updateData.escalation_threshold = threshold;
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    updateData.updated_at = new Date().toISOString();

    // Upsert: update if exists, insert default + updates if not
    const { data: existing } = await supabase
      .from("reputation_brand_voice")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    let brandVoice: ReputationBrandVoice;

    if (existing) {
      const { data: updatedData, error: updateError } = await supabase
        .from("reputation_brand_voice")
        .update(updateData as Database['public']['Tables']['reputation_brand_voice']['Update'])
        .eq("organization_id", organizationId)
        .select(REPUTATION_BRAND_VOICE_SELECT)
        .single();
      const updated = updatedData as unknown as ReputationBrandVoice | null;

      if (updateError || !updated) {
        throw updateError;
      }
      brandVoice = updated;
    } else {
      const defaultWithUpdates = {
        organization_id: organizationId,
        tone: "professional_warm",
        language_preference: "en",
        owner_name: null,
        sign_off: null,
        key_phrases: [],
        avoid_phrases: [],
        sample_responses: [],
        auto_respond_positive: false,
        auto_respond_min_rating: 4,
        escalation_threshold: 2,
        ...updateData,
      };

      const { data: createdData, error: insertError } = await supabase
        .from("reputation_brand_voice")
        .insert(defaultWithUpdates as Database['public']['Tables']['reputation_brand_voice']['Insert'])
        .select(REPUTATION_BRAND_VOICE_SELECT)
        .single();
      const created = createdData as unknown as ReputationBrandVoice | null;

      if (insertError || !created) {
        throw insertError;
      }
      brandVoice = created;
    }

    return NextResponse.json({ brandVoice });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Internal server error");
    console.error("Error updating brand voice:", error);
    return apiError(message, 500);
  }
}
