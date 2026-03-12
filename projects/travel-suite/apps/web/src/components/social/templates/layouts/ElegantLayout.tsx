"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ThemeOverlay } from "./ThemeDecorations";
import { type LayoutProps, getPalette } from "./layout-helpers";

// ── Editorial Frame (ElegantLayout) ──────────────────────────────────────────
// Magazine editorial feel with thin inset border frame and elegant serif typography.

export const ElegantLayout = ({ templateData, preset }: LayoutProps) => {
    const palette = getPalette(preset);
    return (
    <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", width: "100%", height: "100%" }}>
        {/* Hero image background */}
        {templateData.heroImage && (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        )}

        {/* Dark overlay concentrated where text sits */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.5) 100%)" }} />
        {/* Palette overlay tint */}
        {palette.overlay && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: palette.overlay }} />
        )}

        {/* Theme-specific decorative elements */}
        <ThemeOverlay templateId={preset.id} accent={palette.accent} />

        {/* Thin white inset border frame */}
        <div style={{ position: "absolute", top: 30, left: 30, right: 30, bottom: 30, border: "2px solid rgba(255,255,255,0.4)", zIndex: 5 }} />

        {/* Content inside the frame */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "60px 80px", textAlign: "center" }}>

            {/* Logo top-left inside frame */}
            {templateData.logoUrl && (
                <div style={{ position: "absolute", top: 50, left: 60 }}>
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 180, 200), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
                </div>
            )}

            {/* Season tag top-right */}
            {templateData.season && (
                <div style={{ position: "absolute", top: 56, right: 60, fontSize: 18, fontWeight: 400, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.6)", fontFamily: "Inter, sans-serif" }}>
                    {templateData.season}
                </div>
            )}

            {/* Thin line above destination */}
            <div style={{ width: 100, height: 1, background: "rgba(255,255,255,0.4)", marginBottom: 28 }} />

            {/* Destination in serif */}
            <div style={{ fontSize: 100, fontWeight: 700, lineHeight: 0.95, color: "white", fontStyle: "italic", textShadow: "0 4px 30px rgba(0,0,0,0.4)", letterSpacing: "-0.01em" }}>
                {templateData.destination || "Destination"}
            </div>

            {/* Thin line below destination */}
            <div style={{ width: 100, height: 1, background: "rgba(255,255,255,0.4)", marginTop: 28 }} />

            {/* Offer text - italic elegant */}
            {templateData.offer && (
                <div style={{ fontSize: 30, fontWeight: 400, fontStyle: "italic", color: "rgba(255,255,255,0.85)", marginTop: 28, letterSpacing: "0.03em" }}>
                    {templateData.offer}
                </div>
            )}

            {/* Price in bold serif */}
            {templateData.price && (
                <div style={{ fontSize: 56, fontWeight: 700, color: "white", marginTop: 20, letterSpacing: "0.02em" }}>
                    {templateData.price}
                </div>
            )}

            {/* Bottom contact row */}
            <div style={{ position: "absolute", bottom: 50, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: "white", fontFamily: "Inter, sans-serif", letterSpacing: "0.1em" }}>
                        {templateData.companyName}
                    </div>
                    <div style={{ width: 4, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.5)" }} />
                    <div style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif" }}>
                        {templateData.contactNumber}
                    </div>
                </div>
                {templateData.website && (
                    <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif" }}>
                        {templateData.website}
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};
