"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ThemeOverlay } from "./ThemeDecorations";
import { type LayoutProps, getPalette } from "./layout-helpers";

// ── Floating Card (BottomLayout) ─────────────────────────────────────────────
// Full-bleed hero image with an elevated white card overlaying the bottom portion.

export const BottomLayout = ({ templateData, preset }: LayoutProps) => {
    const palette = getPalette(preset);
    return (
    <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", width: "100%", height: "100%" }}>
        {/* Hero image background */}
        {templateData.heroImage && (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        )}

        {/* Subtle top gradient for logo readability */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)", zIndex: 2 }} />

        {/* Theme-specific decorative elements */}
        <ThemeOverlay templateId={preset.id} accent={palette.accent} />

        {/* Logo centered at top */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 40, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 240), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            </div>
        )}

        {/* Rotated offer badge sticker */}
        {templateData.offer && (
            <div style={{ position: "absolute", top: 50, right: 30, background: palette.accent, color: "white", padding: "10px 28px", fontSize: 20, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", transform: "rotate(3deg)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 10 }}>
                {templateData.offer}
            </div>
        )}

        {/* White floating card at bottom */}
        <div style={{ position: "absolute", bottom: 36, left: 36, right: 36, background: "white", borderRadius: 24, padding: "36px 44px", boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)", zIndex: 10 }}>
            {/* Destination name */}
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, color: "#1a2d5a", letterSpacing: "-0.02em" }}>
                {templateData.destination || "Destination"}
            </div>

            {/* Accent line */}
            <div style={{ width: 60, height: 4, background: palette.accent, borderRadius: 2, marginTop: 16, marginBottom: 16 }} />

            {/* Offer text */}
            {templateData.offer && (
                <div style={{ fontSize: 22, fontWeight: 500, color: "#64748b", marginBottom: 12 }}>
                    {templateData.offer}
                </div>
            )}

            {/* Price in accent color */}
            {templateData.price && (
                <div style={{ fontSize: 44, fontWeight: 900, color: palette.accent, letterSpacing: "-0.01em" }}>
                    {templateData.price}
                </div>
            )}

            {/* Divider */}
            <div style={{ width: "100%", height: 1, background: "#e2e8f0", marginTop: 20, marginBottom: 16 }} />

            {/* Company and contact */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2d5a", letterSpacing: "0.05em" }}>
                    {templateData.companyName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: 9999, background: "#cbd5e1" }} />
                    <div style={{ fontSize: 18, color: "#64748b", fontWeight: 500 }}>
                        {templateData.contactNumber}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};
