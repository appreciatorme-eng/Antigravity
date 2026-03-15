import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";

// This route is intentionally a direct route (not a catch-all handler) because it
// requires the Edge runtime (`export const runtime = "edge"`) for ImageResponse.
// Edge functions cannot be registered through the Node.js-based catch-all dispatcher.
export const runtime = "edge";

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function sanitizeOgText(value: string | null, fallback: string, maxLength: number): string {
  const normalized = (value || fallback).replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit({
    identifier: getRequestIp(request),
    limit: 60,
    windowMs: 60_000,
    prefix: "api:og:get",
  });
  if (!rateLimit.success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const title = sanitizeOgText(searchParams.get("title"), "TravelBuilt", 120);
  const subtitle = sanitizeOgText(
    searchParams.get("subtitle"),
    "Build Your Travel Empire",
    180,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "linear-gradient(135deg, #0A0A0F 0%, #1a0a2e 50%, #0A0A0F 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            background:
              "radial-gradient(circle, rgba(255,107,44,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "100px",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(0,212,170,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #FF6B2C, #00D4AA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: 900,
            }}
          >
            T
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.5px",
            }}
          >
            TravelBuilt
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 900,
            color: "white",
            lineHeight: 1.1,
            maxWidth: "900px",
            letterSpacing: "-2px",
            marginBottom: "20px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "6px",
            background: "linear-gradient(90deg, #FF6B2C, #00D4AA, #FF6B2C)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
