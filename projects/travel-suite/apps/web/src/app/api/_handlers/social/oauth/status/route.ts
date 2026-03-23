import { NextRequest, NextResponse } from "next/server";

const PROVIDER_ENV_CHECKS: Record<string, () => boolean> = {
  google: () => !!process.env.GOOGLE_CLIENT_ID,
  facebook: () => !!process.env.META_APP_ID,
  linkedin: () => !!process.env.LINKEDIN_CLIENT_ID,
};

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") ?? "";
  const checker = PROVIDER_ENV_CHECKS[provider];
  const configured = checker ? checker() : false;

  return NextResponse.json({ provider, configured });
}
