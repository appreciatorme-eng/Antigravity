"use client";

import { AppImage } from "@/components/ui/AppImage";
import { PosterFooter } from "./PosterFooter";
import { type LayoutProps, getServiceIcon } from "./layout-helpers";

// ── ServiceShowcaseLayout ───────────────────────────────────────────────────
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

            {/* Logo / Company header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32, flexShrink: 0 }}>
                {templateData.logoUrl ? (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 240), height: 72, objectFit: "contain" }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 44, fontWeight: 900, color: "#1a2d5a", letterSpacing: 1 }}>
                        {templateData.companyName}
                    </div>
                )}
                {templateData.season && (
                    <div style={{ fontSize: 22, color: "#6b7280", marginTop: 4 }}>{templateData.season}</div>
                )}
            </div>

            {/* Headline */}
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

            {/* Why Choose Us icon grid */}
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

            {/* Bullet services list */}
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

            {/* Hero image + footer section */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 0 }}>
                {templateData.heroImage && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                        <AppImage
                            src={templateData.heroImage}
                            style={{ height: 180, objectFit: "contain", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))" }}
                            alt="hero"
                            width={320}
                            height={180}
                        />
                    </div>
                )}
                <PosterFooter templateData={templateData} absolute={false} />
            </div>
        </div>
    );
};

// ── HeroServicesLayout ──────────────────────────────────────────────────────
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

            {/* Header: Logo + Company */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 50px", flexShrink: 0 }}>
                {templateData.logoUrl ? (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: 60, objectFit: "contain" }} alt="logo" />
                ) : null}
                <div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: "#1a3a6b" }}>{templateData.companyName}</div>
                    {templateData.season && (
                        <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600 }}>{templateData.season}</div>
                    )}
                </div>
            </div>

            {/* Headline with left border accent */}
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

            {/* Hero image */}
            {templateData.heroImage && (
                <div style={{ marginTop: 16, flexShrink: 0 }}>
                    <AppImage
                        src={templateData.heroImage}
                        style={{ width: "100%", height: 320, objectFit: "cover" }}
                        alt="destination"
                    />
                </div>
            )}

            {/* Services icon row */}
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

            {/* Footer pushed to bottom */}
            <div style={{ flex: 1 }} />
            <PosterFooter templateData={templateData} absolute={false} />
        </div>
    );
};
