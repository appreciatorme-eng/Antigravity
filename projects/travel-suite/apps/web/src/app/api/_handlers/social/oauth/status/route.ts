import { NextRequest, NextResponse } from "next/server";

const PROVIDER_ENV_KEYS: Record<string, string[]> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  facebook: ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"],
  linkedin: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
};

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") ?? "";
  const requiredKeys = PROVIDER_ENV_KEYS[provider] ?? [];
  const missing = requiredKeys.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });
  const configured = requiredKeys.length > 0 && missing.length === 0;

  return NextResponse.json({ provider, configured, missing });
}
