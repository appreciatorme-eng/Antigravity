"use client";

import { QRCodeSVG } from "qrcode.react";
import { SocialTemplate } from "@/lib/social/types";

interface LayoutProps {
    templateData: any;
    preset: SocialTemplate;
}

// ── Service icon map ─────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, string> = {
    "Flights": "✈️", "Hotels": "🏨", "Holidays": "🏖️", "Visa": "📋",
    "Airport Transfers": "🚗", "City Tours": "🏙️", "Corporate Travel": "💼",
    "Night Out": "🌙", "Special Events": "🎉", "Bus": "🚌", "Cars": "🚘",
};
const getServiceIcon = (name: string) =>
    SERVICE_ICONS[name] ||
    SERVICE_ICONS[Object.keys(SERVICE_ICONS).find(k => name.toLowerCase().includes(k.toLowerCase())) ?? ""] ||
    "✦";

// ── Shared dark-blue contact footer with WhatsApp QR ────────────────────────
const PosterFooter = ({ templateData, absolute = true }: { templateData: any; absolute?: boolean }) => {
    const digits = (templateData.contactNumber || "").replace(/\D/g, "");
    const waUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";
    return (
        <div
            className={absolute ? "absolute bottom-0 left-0 right-0" : ""}
            style={{ background: "#1a2d5a", padding: "22px 48px", minHeight: 140, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
        >
            <div style={{ color: "#ffffff", lineHeight: 2, fontSize: 22 }}>
                <div>📞 {templateData.contactNumber || "+91 00000 00000"}</div>
                <div>✉ {templateData.email || "info@yourcompany.com"}</div>
                <div>🌐 {templateData.website || "www.yourcompany.com"}</div>
            </div>
            <div style={{ textAlign: "center", color: "#ffffff" }}>
                <QRCodeSVG value={waUrl} size={84} bgColor="#1a2d5a" fgColor="#ffffff" />
                <p style={{ fontSize: 14, marginTop: 4, opacity: 0.65 }}>Scan for WhatsApp</p>
            </div>
        </div>
    );
};

// ── Cinematic Hero (CenterLayout) ────────────────────────────────────────────
// Full-bleed hero image with layered gradient overlays and centered text composition.

export const CenterLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", width: "100%", height: "100%" }}>
        {/* Hero image background */}
        {templateData.heroImage && (
            <img src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        )}

        {/* Gradient overlay layer 1: bottom fade */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)" }} />
        {/* Gradient overlay layer 2: radial vignette */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)" }} />
        {/* Gradient overlay layer 3: top subtle */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%)" }} />

        {/* Corner accent: top-left */}
        <div style={{ position: "absolute", top: 40, left: 40, width: 80, height: 80, borderTop: "3px solid rgba(255,255,255,0.5)", borderLeft: "3px solid rgba(255,255,255,0.5)" }} />
        {/* Corner accent: bottom-right */}
        <div style={{ position: "absolute", bottom: 40, right: 40, width: 80, height: 80, borderBottom: "3px solid rgba(255,255,255,0.5)", borderRight: "3px solid rgba(255,255,255,0.5)" }} />

        {/* Logo centered at top */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 48, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 280), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
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
                <div style={{ display: "flex", alignItems: "center", background: "linear-gradient(135deg, #ff6b6b, #ff8c42)", color: "white", padding: "14px 40px", borderRadius: 9999, fontSize: 38, fontWeight: 900, boxShadow: "0 8px 32px rgba(255,107,107,0.4)", marginTop: 28 }}>
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

// ── Editorial Frame (ElegantLayout) ──────────────────────────────────────────
// Magazine editorial feel with thin inset border frame and elegant serif typography.

export const ElegantLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", width: "100%", height: "100%" }}>
        {/* Hero image background */}
        {templateData.heroImage && (
            <img src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        )}

        {/* Dark overlay concentrated where text sits */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.5) 100%)" }} />

        {/* Thin white inset border frame */}
        <div style={{ position: "absolute", top: 30, left: 30, right: 30, bottom: 30, border: "2px solid rgba(255,255,255,0.4)", zIndex: 5 }} />

        {/* Content inside the frame */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "60px 80px", textAlign: "center" }}>

            {/* Logo top-left inside frame */}
            {templateData.logoUrl && (
                <div style={{ position: "absolute", top: 50, left: 60 }}>
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 180, 200), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
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

// ── Dynamic Split (SplitLayout) ──────────────────────────────────────────────
// Hero image on the right side with a gradient-blended dark content panel on the left.

export const SplitLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || [];
    return (
        <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", fontFamily: "Inter, sans-serif", width: "100%", height: "100%" }}>
            {/* Dark panel left side (45%) */}
            <div style={{ position: "relative", width: "45%", height: "100%", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", zIndex: 5 }}>

                {/* Logo */}
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 28 }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "0.05em", marginBottom: 28, opacity: 0.9 }}>
                        {templateData.companyName}
                    </div>
                )}

                {/* Decorative line */}
                <div style={{ width: 50, height: 3, background: "linear-gradient(90deg, #ff6b6b, #ff8c42)", marginBottom: 24 }} />

                {/* Season */}
                {templateData.season && (
                    <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                        {templateData.season}
                    </div>
                )}

                {/* Destination */}
                <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.95, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.3)", marginBottom: 24 }}>
                    {templateData.destination || "Destination"}
                </div>

                {/* Offer pill frosted */}
                {templateData.offer && (
                    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 24px", borderLeft: "4px solid rgba(255,107,107,0.8)", marginBottom: 20, display: "flex" }}>
                        <span style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{templateData.offer}</span>
                    </div>
                )}

                {/* Price badge */}
                {templateData.price && (
                    <div style={{ display: "flex", alignItems: "center", background: "linear-gradient(135deg, #ff6b6b, #ff8c42)", color: "white", padding: "12px 32px", borderRadius: 9999, fontSize: 32, fontWeight: 900, boxShadow: "0 8px 32px rgba(255,107,107,0.4)", marginBottom: 28, alignSelf: "flex-start" }}>
                        {templateData.price}
                    </div>
                )}

                {/* Service icons row */}
                {services.length > 0 && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                        {services.slice(0, 4).map((s: string) => (
                            <div key={s} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", fontSize: 16, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                                {getServiceIcon(s)} {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.6)", fontSize: 18, marginTop: "auto" }}>
                    <span style={{ fontWeight: 700, color: "white" }}>{templateData.companyName}</span>
                    <span>|</span>
                    <span>{templateData.contactNumber}</span>
                </div>
            </div>

            {/* Hero image right side (55%) with gradient blend */}
            <div style={{ position: "relative", width: "55%", height: "100%" }}>
                {templateData.heroImage ? (
                    <img src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                ) : (
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }} />
                )}
                {/* Gradient edge blending from dark panel into the image */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(to right, #0f172a 0%, rgba(15,23,42,0.6) 40%, transparent 100%)" }} />
                {/* Bottom subtle gradient */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
            </div>
        </div>
    );
};

// ── Floating Card (BottomLayout) ─────────────────────────────────────────────
// Full-bleed hero image with an elevated white card overlaying the bottom portion.

export const BottomLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", width: "100%", height: "100%" }}>
        {/* Hero image background */}
        {templateData.heroImage && (
            <img src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        )}

        {/* Subtle top gradient for logo readability */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)", zIndex: 2 }} />

        {/* Logo centered at top */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 40, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 240), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            </div>
        )}

        {/* Rotated offer badge sticker */}
        {templateData.offer && (
            <div style={{ position: "absolute", top: 50, right: 30, background: "linear-gradient(135deg, #ff6b6b, #ff8c42)", color: "white", padding: "10px 28px", fontSize: 20, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", transform: "rotate(3deg)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 10 }}>
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
            <div style={{ width: 60, height: 4, background: "linear-gradient(90deg, #ff6b6b, #ff8c42)", borderRadius: 2, marginTop: 16, marginBottom: 16 }} />

            {/* Offer text */}
            {templateData.offer && (
                <div style={{ fontSize: 22, fontWeight: 500, color: "#64748b", marginBottom: 12 }}>
                    {templateData.offer}
                </div>
            )}

            {/* Price in accent color */}
            {templateData.price && (
                <div style={{ fontSize: 44, fontWeight: 900, color: "#ff6b6b", letterSpacing: "-0.01em" }}>
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

export const ReviewLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-24 text-center relative overflow-hidden text-slate-800">
        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-16">
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s: number) => <span key={s} className="text-amber-500 text-6xl">★</span>)}
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
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 180, 180), height: "auto", objectFit: "contain" }} alt="logo" />
                ) : (
                    <p className="text-3xl font-bold text-blue-600">{templateData.companyName}</p>
                )}
                <div className="h-8 w-[2px] bg-slate-200"></div>
                <p className="text-2xl text-slate-400 font-medium">{templateData.contactNumber}</p>
            </div>
        </div>
    </div>
);

export const CarouselSlideLayout = ({ templateData }: LayoutProps) => (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#faf6f0" }}>
        {/* Hero image as faded background texture */}
        {templateData.heroImage && (
            <img src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.12, filter: "sepia(40%)" }} alt="" />
        )}

        {/* Vintage paper texture overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(139,115,85,0.15) 100%)" }} />

        {/* Outer stamp border */}
        <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: "3px solid #8b7355", opacity: 0.6 }} />
        {/* Inner stamp border */}
        <div style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, border: "1px solid #8b7355", opacity: 0.35 }} />

        {/* Corner decorative stamps */}
        <div style={{ position: "absolute", top: 48, left: 48, width: 60, height: 60, borderTop: "3px solid #c4956a", borderLeft: "3px solid #c4956a" }} />
        <div style={{ position: "absolute", top: 48, right: 48, width: 60, height: 60, borderTop: "3px solid #c4956a", borderRight: "3px solid #c4956a" }} />
        <div style={{ position: "absolute", bottom: 48, left: 48, width: 60, height: 60, borderBottom: "3px solid #c4956a", borderLeft: "3px solid #c4956a" }} />
        <div style={{ position: "absolute", bottom: 48, right: 48, width: 60, height: 60, borderBottom: "3px solid #c4956a", borderRight: "3px solid #c4956a" }} />

        {/* Logo at top */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 64, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 200), height: "auto", objectFit: "contain", opacity: 0.7 }} alt="logo" />
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 28, border: "3px solid #c4956a", borderRadius: 9999, padding: "12px 36px", background: "rgba(196,149,106,0.1)" }}>
                    <span style={{ fontSize: 38, fontWeight: 700, color: "#8b5e34", letterSpacing: "0.02em" }}>
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

// ── NEW: ServiceShowcaseLayout ───────────────────────────────────────────────
// Matches real "Luxury Car Service" poster: white bg, logo top-center, navy+purple
// headline, teal pill offer, "Why Choose Us" icon grid, services list, hero image, footer.
export const ServiceShowcaseLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays"];
    const bullets: string[] = templateData.bulletPoints || [];
    const words = (templateData.destination || "Service").split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");

    return (
        <div className="w-full h-full overflow-hidden bg-white" style={{ fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* ── Logo / Company header ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32, flexShrink: 0 }}>
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 240), height: 72, objectFit: "contain" }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 44, fontWeight: 900, color: "#1a2d5a", letterSpacing: 1 }}>
                        {templateData.companyName}
                    </div>
                )}
                {templateData.season && (
                    <div style={{ fontSize: 22, color: "#6b7280", marginTop: 4 }}>{templateData.season}</div>
                )}
            </div>

            {/* ── Headline ── */}
            <div style={{ padding: "12px 60px 0", flexShrink: 0 }}>
                <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.05, color: "#1a2d5a" }}>{line1}</div>
                {line2 && (
                    <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.05, color: "#6b21a8" }}>{line2}</div>
                )}
                <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
                    {templateData.offer && (
                        <div style={{ background: "#0d9488", color: "white", borderRadius: 9999, padding: "8px 28px", fontSize: 30, fontWeight: 700 }}>
                            {templateData.offer}
                        </div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 34, fontWeight: 800, color: "#1a2d5a" }}>Starting @ {templateData.price}</div>
                    )}
                </div>
            </div>

            {/* ── Why Choose Us icon grid ── */}
            <div style={{ padding: "18px 60px 0", flexShrink: 0 }}>
                <div style={{ fontSize: 25, fontWeight: 800, color: "#1a2d5a", marginBottom: 10 }}>Why Choose Us?</div>
                <div style={{ display: "flex", gap: 14 }}>
                    {services.slice(0, 3).map((s: string) => (
                        <div key={s} style={{
                            flex: 1,
                            border: "2px solid #e2e8f0",
                            borderRadius: 14,
                            padding: "14px 8px",
                            textAlign: "center",
                            background: "#f8faff",
                        }}>
                            <div style={{ fontSize: 36 }}>{getServiceIcon(s)}</div>
                            <div style={{ fontSize: 19, fontWeight: 700, color: "#1a2d5a", marginTop: 6 }}>{s}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Bullet services list ── */}
            {bullets.length > 0 && (
                <div style={{ padding: "14px 60px 0", flexShrink: 0 }}>
                    <div style={{ fontSize: 21, fontWeight: 800, color: "#1a2d5a", marginBottom: 8 }}>Services Offered</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                        {bullets.map((b: string) => (
                            <div key={b} style={{ fontSize: 21, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ color: "#0d9488", fontWeight: 900, fontSize: 16 }}>✓</span> {b}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Hero image + footer section ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 0 }}>
                {templateData.heroImage && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                        <img
                            src={templateData.heroImage}
                            style={{ height: 180, objectFit: "contain", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))" }}
                            alt="hero"
                        />
                    </div>
                )}
                <PosterFooter templateData={templateData} absolute={false} />
            </div>
        </div>
    );
};

// ── NEW: HeroServicesLayout ──────────────────────────────────────────────────
// Matches real "Wonders of India" poster: light blue bg, logo top, bold navy+red
// headline with left border accent, full-width hero image, service icon row, footer.
export const HeroServicesLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays", "Visa"];
    const words = (templateData.destination || "Destination").split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");

    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#d4eaf7", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* ── Header: Logo + Company ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 50px", flexShrink: 0 }}>
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: 60, objectFit: "contain" }} alt="logo" />
                ) : null}
                <div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: "#1a3a6b" }}>{templateData.companyName}</div>
                    {templateData.season && (
                        <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600 }}>{templateData.season}</div>
                    )}
                </div>
            </div>

            {/* ── Headline with left border accent ── */}
            <div style={{ marginLeft: 50, marginRight: 50, paddingLeft: 24, borderLeft: "10px solid #1a3a6b", flexShrink: 0 }}>
                <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.05, color: "#1a3a6b" }}>{line1}</div>
                {line2 && <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.05, color: "#dc2626" }}>{line2}</div>}
                <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {templateData.offer && (
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#1a3a6b" }}>{templateData.offer}</div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 32, fontWeight: 800, color: "#16a34a" }}>@ {templateData.price}</div>
                    )}
                </div>
            </div>

            {/* ── Hero image ── */}
            {templateData.heroImage && (
                <div style={{ marginTop: 16, flexShrink: 0 }}>
                    <img
                        src={templateData.heroImage}
                        style={{ width: "100%", height: 320, objectFit: "cover" }}
                        alt="destination"
                    />
                </div>
            )}

            {/* ── Services icon row ── */}
            <div style={{ display: "flex", justifyContent: "center", gap: 18, padding: "14px 50px", flexWrap: "wrap", flexShrink: 0 }}>
                {services.slice(0, 5).map((s: string) => (
                    <div key={s} style={{
                        background: "white",
                        borderRadius: 12,
                        padding: "10px 16px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        minWidth: 90,
                    }}>
                        <div style={{ fontSize: 32 }}>{getServiceIcon(s)}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a6b", marginTop: 4 }}>{s}</div>
                    </div>
                ))}
            </div>

            {/* ── Footer pushed to bottom ── */}
            <div style={{ flex: 1 }} />
            <PosterFooter templateData={templateData} absolute={false} />
        </div>
    );
};

// ── NEW: InfoSplitLayout ────────────────────────────────────────────────────
// Matches real "Get Your Visa Now" poster: teal bg, split right-panel hero image,
// left-panel italic intro + bold headline, yellow band with services, bullet list, footer.
export const InfoSplitLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays", "Visa"];
    const bullets: string[] = templateData.bulletPoints || [];
    const words = (templateData.destination || "Destination").split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");

    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#0e7490", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* ── Top section: left panel + right hero image ── */}
            <div style={{ position: "relative", flexShrink: 0, minHeight: "48%" }}>
                {/* Right panel: hero image */}
                {templateData.heroImage && (
                    <div style={{ position: "absolute", right: 0, top: 0, width: "44%", height: "100%" }}>
                        <img
                            src={templateData.heroImage}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            alt="destination"
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 55%, #0e7490)" }} />
                    </div>
                )}

                {/* Left panel */}
                <div style={{ position: "relative", zIndex: 2, width: "60%", padding: "34px 50px" }}>
                    {templateData.logoUrl ? (
                        <img
                            src={templateData.logoUrl}
                            style={{ width: Math.min(templateData.logoWidth || 160, 200), height: 60, objectFit: "contain", marginBottom: 18, filter: "brightness(0) invert(1)" }}
                            alt="logo"
                        />
                    ) : (
                        <div style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 18, opacity: 0.9 }}>
                            {templateData.companyName}
                        </div>
                    )}
                    <div style={{ fontSize: 26, fontStyle: "italic", color: "#90e0ef", marginBottom: 4, fontWeight: 300 }}>
                        Dream to
                    </div>
                    <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.05, color: "white" }}>{line1}</div>
                    {line2 && (
                        <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.05, color: "#fde68a" }}>{line2}</div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 44, fontWeight: 900, color: "#fde68a", marginTop: 10 }}>{templateData.price}</div>
                    )}
                </div>
            </div>

            {/* ── Yellow band ── */}
            <div style={{
                background: "#facc15",
                padding: "14px 50px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
                flexShrink: 0,
            }}>
                {templateData.offer && (
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#1a2d5a" }}>{templateData.offer}</div>
                )}
                <div style={{ fontSize: 20, color: "#374151", fontWeight: 600 }}>
                    {services.join(" | ")}
                </div>
            </div>

            {/* ── Bullet points ── */}
            <div style={{ padding: "18px 50px", flexShrink: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                    {bullets.map((b: string) => (
                        <div key={b} style={{ fontSize: 22, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#facc15", fontWeight: 900 }}>—</span> {b}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer pushed to bottom ── */}
            <div style={{ flex: 1 }} />
            <PosterFooter templateData={templateData} absolute={false} />
        </div>
    );
};

// ── NEW: GradientHeroLayout ─────────────────────────────────────────────────
// Full-bleed hero image with cinematic gradient fade and bold white text at bottom.
// Inspired by professional visa/destination posters with atmospheric hero imagery.
export const GradientHeroLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Full-bleed hero */}
        {templateData.heroImage ? (
            <img src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0e7490 100%)" }} />
        )}
        {/* Cinematic gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.95) 100%)" }} />
        {/* Radial vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center top, transparent 40%, rgba(0,0,0,0.3) 100%)" }} />

        {/* Logo top-left */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 40, left: 50, zIndex: 10 }}>
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 200), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            </div>
        )}

        {/* Content at bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 60px 60px", zIndex: 10 }}>
            {templateData.season && (
                <div style={{ fontSize: 28, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 300, marginBottom: 12 }}>
                    {templateData.season}
                </div>
            )}
            <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 0.95, color: "white", textShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
                {templateData.destination || "Dream Destination"}
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
                {templateData.price && (
                    <div style={{ background: "#f59e0b", color: "#000", padding: "10px 32px", borderRadius: 12, fontSize: 36, fontWeight: 900 }}>
                        {templateData.price}
                    </div>
                )}
                {templateData.offer && (
                    <div style={{ fontSize: 34, color: "rgba(255,255,255,0.85)", fontWeight: 300 }}>
                        {templateData.offer}
                    </div>
                )}
            </div>
            <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "white" }}>{templateData.companyName}</div>
                <div style={{ width: 2, height: 24, background: "rgba(255,255,255,0.3)" }} />
                <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>{templateData.contactNumber}</div>
                {templateData.website && (
                    <>
                        <div style={{ width: 2, height: 24, background: "rgba(255,255,255,0.3)" }} />
                        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)" }}>{templateData.website}</div>
                    </>
                )}
            </div>
        </div>
    </div>
);

// ── NEW: DiagonalSplitLayout ────────────────────────────────────────────────
// Diagonal slash dividing hero image from content. Modern, dynamic feel.
export const DiagonalSplitLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays"];
    return (
        <div className="w-full h-full relative overflow-hidden" style={{ background: "#1a2d5a", fontFamily: "Arial, sans-serif" }}>
            {/* Hero image on right diagonal */}
            {templateData.heroImage ? (
                <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)" }}>
                    <img src={templateData.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #1a2d5a 0%, transparent 40%)" }} />
                </div>
            ) : (
                <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)", background: "linear-gradient(135deg, #2563eb, #7c3aed)" }} />
            )}

            {/* Left content */}
            <div style={{ position: "relative", zIndex: 2, width: "55%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 60px 60px 60px" }}>
                {templateData.logoUrl && (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: "auto", objectFit: "contain", marginBottom: 24, filter: "brightness(0) invert(1)" }} alt="logo" />
                )}
                {templateData.season && (
                    <div style={{ fontSize: 22, color: "#60a5fa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
                        {templateData.season}
                    </div>
                )}
                <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 0.95, color: "white" }}>
                    {templateData.destination || "Destination"}
                </div>
                {templateData.offer && (
                    <div style={{ fontSize: 28, color: "#fde68a", fontWeight: 700, marginTop: 20 }}>{templateData.offer}</div>
                )}
                {templateData.price && (
                    <div style={{ fontSize: 52, fontWeight: 900, color: "#34d399", marginTop: 16 }}>{templateData.price}</div>
                )}

                {/* Services pills */}
                <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
                    {services.slice(0, 4).map((s: string) => (
                        <div key={s} style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 9999,
                            padding: "8px 20px",
                            fontSize: 20,
                            color: "white",
                            fontWeight: 600,
                        }}>
                            {getServiceIcon(s)} {s}
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div style={{ marginTop: 36, display: "flex", gap: 16, alignItems: "center", color: "rgba(255,255,255,0.7)", fontSize: 20 }}>
                    <span style={{ fontWeight: 700, color: "white" }}>{templateData.companyName}</span>
                    <span>|</span>
                    <span>📞 {templateData.contactNumber}</span>
                </div>
            </div>
        </div>
    );
};

// ── NEW: MagazineCoverLayout ────────────────────────────────────────────────
// Full hero image with tasteful, magazine-style text overlay. Minimal, elegant.
export const MagazineCoverLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
        {/* Full cover image */}
        {templateData.heroImage ? (
            <img src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }} />
        )}
        {/* Subtle dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Top bar: logo + company */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "36px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
            {templateData.logoUrl ? (
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            ) : (
                <div style={{ fontSize: 30, fontWeight: 700, color: "white", letterSpacing: "0.1em" }}>{templateData.companyName}</div>
            )}
            {templateData.season && (
                <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", padding: "8px 24px", borderRadius: 9999, fontSize: 20, color: "white", fontWeight: 600 }}>
                    {templateData.season}
                </div>
            )}
        </div>

        {/* Center destination - large serif */}
        <div style={{ position: "absolute", top: "50%", left: 50, right: 50, transform: "translateY(-50%)", zIndex: 10, textAlign: "center" }}>
            <div style={{ fontSize: 24, letterSpacing: "0.6em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontWeight: 400, marginBottom: 20 }}>
                Discover
            </div>
            <div style={{ fontSize: 110, fontWeight: 700, color: "white", lineHeight: 0.9, textShadow: "0 6px 40px rgba(0,0,0,0.4)", fontStyle: "italic" }}>
                {templateData.destination || "Paradise"}
            </div>
            <div style={{ width: 80, height: 3, background: "white", margin: "28px auto", opacity: 0.6 }} />
            {templateData.offer && (
                <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)", fontWeight: 400, fontStyle: "italic" }}>
                    {templateData.offer}
                </div>
            )}
        </div>

        {/* Bottom bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 50px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 10 }}>
            <div>
                {templateData.price && (
                    <div style={{ fontSize: 56, fontWeight: 700, color: "white" }}>{templateData.price}</div>
                )}
                <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginTop: 4, fontFamily: "Arial, sans-serif" }}>
                    Starting from
                </div>
            </div>
            <div style={{ textAlign: "right", fontFamily: "Arial, sans-serif" }}>
                <div style={{ fontSize: 22, color: "white", fontWeight: 600 }}>{templateData.contactNumber}</div>
                {templateData.website && (
                    <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{templateData.website}</div>
                )}
            </div>
        </div>
    </div>
);

// ── NEW: DuotoneLayout ──────────────────────────────────────────────────────
// Hero image with a bold duotone color filter using brand colors. Modern, eye-catching.
export const DuotoneLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Hero with duotone effect (using mix-blend-mode layers) */}
        {templateData.heroImage ? (
            <img src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) contrast(1.1)" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "#1e293b" }} />
        )}
        {/* Color overlay for duotone effect */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", mixBlendMode: "color", opacity: 0.85 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Large typography */}
        <div style={{ position: "absolute", top: 50, left: 50, right: 50, zIndex: 10 }}>
            {templateData.logoUrl && (
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 20 }} alt="logo" />
            )}
            {templateData.season && (
                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", padding: "6px 20px", borderRadius: 8, fontSize: 20, color: "white", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {templateData.season}
                </div>
            )}
        </div>

        {/* Center/bottom content */}
        <div style={{ position: "absolute", bottom: 50, left: 50, right: 50, zIndex: 10 }}>
            <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.95, color: "white", marginBottom: 16 }}>
                {templateData.destination || "Explore"}
            </div>
            {templateData.offer && (
                <div style={{ fontSize: 30, color: "#fbbf24", fontWeight: 700, marginBottom: 16 }}>{templateData.offer}</div>
            )}
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                {templateData.price && (
                    <div style={{ background: "white", color: "#1e3a8a", padding: "12px 36px", borderRadius: 14, fontSize: 40, fontWeight: 900 }}>
                        {templateData.price}
                    </div>
                )}
                <div style={{ fontSize: 22, color: "rgba(255,255,255,0.8)" }}>
                    <div style={{ fontWeight: 700 }}>{templateData.companyName}</div>
                    <div style={{ opacity: 0.7, marginTop: 2 }}>{templateData.contactNumber}</div>
                </div>
            </div>
        </div>
    </div>
);

// ── NEW: BoldTypographyLayout ───────────────────────────────────────────────
// Oversized typography as the main design element with a subtle background. Clean, impactful.
export const BoldTypographyLayout = ({ templateData }: LayoutProps) => {
    const words = (templateData.destination || "Travel").split(" ");
    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#fafafa", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Subtle hero image as texture */}
            {templateData.heroImage && (
                <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "60%", opacity: 0.12 }}>
                    <img src={templateData.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                </div>
            )}

            {/* Header */}
            <div style={{ padding: "40px 60px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, position: "relative", zIndex: 2 }}>
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain" }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#1a2d5a", letterSpacing: 1 }}>{templateData.companyName}</div>
                )}
                {templateData.season && (
                    <div style={{ background: "#1a2d5a", color: "white", padding: "8px 24px", borderRadius: 9999, fontSize: 20, fontWeight: 700 }}>
                        {templateData.season}
                    </div>
                )}
            </div>

            {/* Giant typography */}
            <div style={{ padding: "20px 60px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 2 }}>
                {words.map((word: string, i: number) => (
                    <div key={i} style={{
                        fontSize: Math.min(140, 900 / Math.max(word.length, 3)),
                        fontWeight: 900,
                        lineHeight: 0.95,
                        color: i % 2 === 0 ? "#1a2d5a" : "#7c3aed",
                        textTransform: "uppercase",
                        letterSpacing: "-0.02em",
                    }}>
                        {word}
                    </div>
                ))}

                <div style={{ display: "flex", gap: 16, marginTop: 28, alignItems: "center", flexWrap: "wrap" }}>
                    {templateData.offer && (
                        <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 28px", borderRadius: 10, fontSize: 26, fontWeight: 800 }}>
                            {templateData.offer}
                        </div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 48, fontWeight: 900, color: "#059669" }}>{templateData.price}</div>
                    )}
                </div>
            </div>

            {/* Bottom bar */}
            <div style={{ background: "#1a2d5a", padding: "24px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, position: "relative", zIndex: 2 }}>
                <div style={{ color: "white", fontSize: 22, fontWeight: 700 }}>
                    {templateData.companyName} <span style={{ opacity: 0.5, margin: "0 12px" }}>|</span>
                    <span style={{ fontWeight: 400, opacity: 0.8 }}>{templateData.contactNumber}</span>
                </div>
                {templateData.website && (
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}>{templateData.website}</div>
                )}
            </div>
        </div>
    );
};

// ── LayoutRenderer (used by CarouselBuilder / other non-gallery consumers) ──
interface LayoutRendererProps {
    layout: string;
    data: any;
}

export const LayoutRenderer = ({ layout, data }: LayoutRendererProps) => {
    const props = { templateData: data, preset: {} as SocialTemplate };
    switch (layout) {
        case "Elegant":            return <ElegantLayout {...props} />;
        case "Split":              return <SplitLayout {...props} />;
        case "Bottom":             return <BottomLayout {...props} />;
        case "Center":             return <CenterLayout {...props} />;
        case "Creative":           return <CarouselSlideLayout {...props} />;
        case "Review":             return <ReviewLayout {...props} />;
        case "ServiceShowcase":    return <ServiceShowcaseLayout {...props} />;
        case "HeroServices":       return <HeroServicesLayout {...props} />;
        case "InfoSplit":          return <InfoSplitLayout {...props} />;
        case "GradientHero":       return <GradientHeroLayout {...props} />;
        case "DiagonalSplit":      return <DiagonalSplitLayout {...props} />;
        case "MagazineCover":      return <MagazineCoverLayout {...props} />;
        case "Duotone":            return <DuotoneLayout {...props} />;
        case "BoldTypography":     return <BoldTypographyLayout {...props} />;
        default:                   return <ElegantLayout {...props} />;
    }
};
