"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ThemeOverlay } from "./ThemeDecorations";
import { type LayoutProps, getPalette } from "./layout-helpers";

export const ReviewLayout = ({ templateData, preset }: LayoutProps) => {
    const palette = getPalette(preset);
    return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-24 text-center relative overflow-hidden text-slate-800">
        {/* Hero image as subtle background */}
        {templateData.heroImage && (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.06 }} alt="" />
        )}
        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-16">
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s: number) => <span key={s} className="text-6xl" style={{ color: palette.accent }}>★</span>)}
            </div>
            <h2 className="text-7xl font-serif italic text-slate-800 leading-tight">
                &ldquo;{templateData.reviewText || 'The most incredible experience of our lives! Every detail was planned perfectly.'}&rdquo;
            </h2>
            <div className="pt-12 flex flex-col items-center">
                <div className="h-1 bg-slate-200 w-32 mb-12"></div>
                <p className="text-4xl font-black uppercase tracking-[0.2em]">{templateData.reviewerName || "Sarah Jenkins"}</p>
                <p className="text-2xl text-slate-500 mt-4 font-medium">{templateData.reviewerTrip || "Maldives Honeymoon"}</p>
            </div>
            <div className="pt-16 flex justify-center items-center gap-12">
                {templateData.logoUrl ? (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 180, 180), height: "auto", objectFit: "contain" }} alt="logo" />
                ) : (
                    <p className="text-3xl font-bold" style={{ color: palette.accent }}>{templateData.companyName}</p>
                )}
                <div className="h-8 w-[2px] bg-slate-200"></div>
                <p className="text-2xl text-slate-400 font-medium">{templateData.contactNumber}</p>
            </div>
        </div>
    </div>
    );
};

export const CarouselSlideLayout = ({ templateData, preset }: LayoutProps) => {
    const palette = getPalette(preset);
    return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#faf6f0" }}>
        {/* Hero image as faded background texture */}
        {templateData.heroImage && (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.12, filter: "sepia(40%)" }} alt="" />
        )}

        {/* Vintage paper texture overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(139,115,85,0.15) 100%)" }} />

        {/* Theme-specific decorative elements */}
        <ThemeOverlay templateId={preset.id} accent={palette.accent} />

        {/* Outer stamp border */}
        <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: "3px solid #8b7355", opacity: 0.6 }} />
        {/* Inner stamp border */}
        <div style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, border: "1px solid #8b7355", opacity: 0.35 }} />

        {/* Corner decorative stamps */}
        <div style={{ position: "absolute", top: 48, left: 48, width: 60, height: 60, borderTop: `3px solid ${palette.accent}`, borderLeft: `3px solid ${palette.accent}` }} />
        <div style={{ position: "absolute", top: 48, right: 48, width: 60, height: 60, borderTop: `3px solid ${palette.accent}`, borderRight: `3px solid ${palette.accent}` }} />
        <div style={{ position: "absolute", bottom: 48, left: 48, width: 60, height: 60, borderBottom: `3px solid ${palette.accent}`, borderLeft: `3px solid ${palette.accent}` }} />
        <div style={{ position: "absolute", bottom: 48, right: 48, width: 60, height: 60, borderBottom: `3px solid ${palette.accent}`, borderRight: `3px solid ${palette.accent}` }} />

        {/* Logo at top */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 64, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 200), height: "auto", objectFit: "contain", opacity: 0.7 }} alt="logo" />
            </div>
        )}

        {/* Center content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 80px" }}>
            {/* Small serif label */}
            <div style={{ fontSize: 20, fontWeight: 400, letterSpacing: "0.5em", textTransform: "uppercase" as const, color: "#8b7355", marginBottom: 16 }}>
                {templateData.season || "Travel Collection"}
            </div>

            {/* Decorative line */}
            <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, transparent, #8b7355, transparent)", marginBottom: 24 }} />

            {/* Destination in large serif */}
            <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 0.95, color: "#2c1810", fontStyle: "italic", letterSpacing: "-0.01em", textShadow: "0 2px 12px rgba(44,24,16,0.1)" }}>
                {templateData.destination || "Destination"}
            </div>

            {/* Decorative line */}
            <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, transparent, #8b7355, transparent)", marginTop: 24 }} />

            {/* Offer text */}
            {templateData.offer && (
                <div style={{ fontSize: 26, fontWeight: 400, fontStyle: "italic", color: "#6b5744", marginTop: 24, letterSpacing: "0.05em" }}>
                    {templateData.offer}
                </div>
            )}

            {/* Vintage price stamp */}
            {templateData.price && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 28, border: `3px solid ${palette.accent}`, borderRadius: 9999, padding: "12px 36px", background: palette.accentTint }}>
                    <span style={{ fontSize: 38, fontWeight: 700, color: palette.accent, letterSpacing: "0.02em" }}>
                        {templateData.price}
                    </span>
                </div>
            )}
        </div>

        {/* Bottom contact bar - vintage style */}
        <div style={{ position: "absolute", bottom: 56, left: 60, right: 60, display: "flex", justifyContent: "center", alignItems: "center", gap: 20, zIndex: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#5c4433", fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}>
                {templateData.companyName}
            </div>
            <div style={{ width: 4, height: 4, borderRadius: 9999, background: "#8b7355" }} />
            <div style={{ fontSize: 18, color: "#8b7355", fontFamily: "Inter, sans-serif" }}>
                {templateData.contactNumber}
            </div>
        </div>
    </div>
    );
};
