/* ------------------------------------------------------------------
 * Quick Prompts API -- custom quick-prompt management for the assistant.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PREFERENCE_KEY = "custom_quick_prompts";
const MAX_PROMPTS = 8;
const MAX_PROMPT_LENGTH = 100;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticate(): Promise<
  | { readonly orgId: string; readonly userId: string; readonly response?: never }
  | { readonly orgId?: never; readonly userId?: never; readonly response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { response: jsonError("Unauthorized", 401) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { response: jsonError("No organization found", 400) };
  }

  return { orgId: profile.organization_id, userId: user.id };
}

function prefsTable() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (admin as any).from("assistant_preferences");
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function validatePrompts(
  prompts: unknown,
): { readonly valid: true; readonly value: readonly string[] } | { readonly valid: false; readonly error: string } {
  if (!isStringArray(prompts)) {
    return { valid: false, error: "prompts must be an array of strings" };
  }

  if (prompts.length > MAX_PROMPTS) {
    return { valid: false, error: `Maximum ${MAX_PROMPTS} prompts allowed` };
  }

  const tooLong = prompts.find((p) => p.length > MAX_PROMPT_LENGTH);
  if (tooLong !== undefined) {
    return { valid: false, error: `Each prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` };
  }

  return { valid: true, value: prompts };
}

export async function GET() {
  try {
    const auth = await authenticate();
    if (auth.response) return auth.response;

    const { data, error } = await prefsTable()
      .select("preference_value")
      .eq("organization_id", auth.orgId)
      .eq("user_id", auth.userId)
      .eq("preference_key", PREFERENCE_KEY)
      .maybeSingle();

    if (error) {
      console.error("Quick prompts read error:", error);
      return jsonError("Failed to load quick prompts", 500);
    }

    const rawValue = data?.preference_value ?? [];
    const prompts = isStringArray(rawValue) ? rawValue : [];

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Quick prompts GET error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticate();
    if (auth.response) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    if (typeof body !== "object" || body === null || !("prompts" in body)) {
      return jsonError("Request body must include a prompts field", 400);
    }

    const validation = validatePrompts((body as { prompts: unknown }).prompts);
    if (!validation.valid) {
      return jsonError(validation.error, 400);
    }

    const { error } = await prefsTable()
      .upsert(
        {
          organization_id: auth.orgId,
          user_id: auth.userId,
          preference_key: PREFERENCE_KEY,
          preference_value: validation.value,
        },
        { onConflict: "organization_id,user_id,preference_key" },
      );

    if (error) {
      console.error("Quick prompts write error:", error);
      return jsonError("Failed to save quick prompts", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quick prompts POST error:", error);
    return jsonError("Internal server error", 500);
  }
}
