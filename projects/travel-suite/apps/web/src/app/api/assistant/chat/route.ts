import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleMessage } from "@/lib/assistant/orchestrator";
import type { ConversationMessage } from "@/lib/assistant/types";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get organization ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // 3. Parse request body
    const body = (await req.json()) as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
    };

    const { message, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // 4. Normalize history to ConversationMessage format
    const normalizedHistory: ConversationMessage[] = history
      .slice(-20)
      .map((msg) => ({
        role: msg.role as ConversationMessage["role"],
        content: msg.content,
      }));

    // 5. Call the orchestrator
    const response = await handleMessage({
      message: message.trim(),
      history: normalizedHistory,
      channel: "web",
      organizationId: profile.organization_id,
      userId: user.id,
    });

    // 6. Return orchestrator response
    return NextResponse.json(response);
  } catch (error) {
    console.error("Assistant chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
