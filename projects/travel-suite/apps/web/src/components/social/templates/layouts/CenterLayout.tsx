"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ThemeOverlay } from "./ThemeDecorations";
import { type LayoutProps, getPalette } from "./layout-helpers";

// ── Cinematic Hero (CenterLayout) ────────────────────────────────────────────
// Full-bleed hero image with layered gradient overlays and centered text composition.

export const CenterLayout = ({ templateData, preset }: LayoutProps) => {
    const palette = getPalette(preset);
    return (
    <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", width: "100%", height: "100%" }}>
        {/* Hero image background */}
        {templateData.heroImage && (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        )}

        {/* Gradient overlay layer 1: bottom fade */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)" }} />
        {/* Gradient overlay layer 2: radial vignette */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)" }} />
        {/* Gradient overlay layer 3: top subtle */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%)" }} />
        {/* Palette overlay tint */}
        {palette.overlay && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: palette.overlay }} />
        )}

        {/* Theme-specific decorative elements */}
        <ThemeOverlay templateId={preset.id} accent={palette.accent} />

        {/* Corner accent: top-left */}
        <div style={{ position: "absolute", top: 40, left: 40, width: 80, height: 80, borderTop: "3px solid rgba(255,255,255,0.5)", borderLeft: "3px solid rgba(255,255,255,0.5)" }} />
        {/* Corner accent: bottom-right */}
        <div style={{ position: "absolute", bottom: 40, right: 40, width: 80, height: 80, borderBottom: "3px solid rgba(255,255,255,0.5)", borderRight: "3px solid rgba(255,255,255,0.5)" }} />

        {/* Logo centered at top */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 48, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 280), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            </div>
        )}

        {/* Center content stack */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 60px" }}>
            {/* Decorative line top */}
            <div style={{ width: 60, height: 3, background: "linear-gradient(90deg, transparent, #ffffff, transparent)", marginBottom: 20 }} />

            {/* Destination name */}
            <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 0.95, color: "white", textShadow: "0 6px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)", letterSpacing: "-0.02em" }}>
                {templateData.destination || "Destination"}
            </div>

            {/* Decorative line bottom */}
            <div style={{ width: 60, height: 3, background: "linear-gradient(90deg, transparent, #ffffff, transparent)", marginTop: 20 }} />

            {/* Season edition */}
            {templateData.season && (
                <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.7)", marginTop: 16 }}>
                    {templateData.season} Edition
                </div>
            )}

            {/* Offer pill with frosted glass */}
            {templateData.offer && (
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 9999, padding: "14px 40px", marginTop: 32, border: "1px solid rgba(255,255,255,0.25)" }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{templateData.offer}</span>
                </div>
            )}

            {/* Price badge */}
            {templateData.price && (
                <div style={{ display: "flex", alignItems: "center", background: palette.accent, color: "white", padding: "14px 40px", borderRadius: 9999, fontSize: 38, fontWeight: 900, boxShadow: `0 8px 32px ${palette.accentGlow}`, marginTop: 28 }}>
                    Starting @ {templateData.price}
                </div>
            )}
        </div>

        {/* Bottom contact bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "20px 48px", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                {templateData.companyName}
            </div>
            <div style={{ width: 6, height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.5)", margin: "0 20px" }} />
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                {templateData.contactNumber}
            </div>
        </div>
    </div>
    );
};
