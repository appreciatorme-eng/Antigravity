"use client";

import React from "react";

// ── Theme resolution — maps template ID patterns to visual themes ───────────

export function resolveTheme(id: string): string | null {
    if (id.includes("holi") || id.includes("navratri")) return "colorFest";
    if (id.includes("diwali") || id.includes("new_year")) return "lightFest";
    if (id.includes("christmas") || id.includes("xmas")) return "christmas";
    if (id.includes("eid")) return "eid";
    if (id.includes("independence")) return "independence";
    if (id.includes("summer") || id.includes("beach")) return "tropical";
    if (id.includes("bali")) return "tropical";
    if (id.includes("maldives")) return "tropical";
    if (id.includes("kerala")) return "tropical";
    if (id.includes("monsoon")) return "monsoon";
    if (id.includes("winter") || id.includes("hills")) return "mountain";
    if (id.includes("kashmir")) return "mountain";
    if (id.includes("dubai")) return "dubai";
    if (id.includes("europe") || id.includes("paris")) return "europe";
    if (id.includes("thailand")) return "thailand";
    if (id.includes("honeymoon") || id.includes("romantic")) return "honeymoon";
    if (id.includes("family")) return "family";
    if (id.includes("adventure")) return "adventure";
    if (id.includes("luxury")) return "luxury";
    if (id.includes("corporate")) return "corporate";
    if (id.includes("flash_sale") || id.includes("last_minute")) return "urgency";
    if (id.includes("early_bird")) return "earlyBird";
    if (id.includes("group")) return "group";
    return null;
}

// ── Theme decoration renders ────────────────────────────────────────────────

function renderTheme(theme: string, accent: string): React.ReactNode {
    switch (theme) {

        // ── colorFest: Holi, Navratri — rainbow paint splashes ──────────
        case "colorFest":
            return (
                <>
                    <div style={{ position: "absolute", top: -40, left: -40, width: 240, height: 240, borderRadius: "50%", background: "#ec4899", opacity: 0.2 }} />
                    <div style={{ position: "absolute", top: 60, right: -30, width: 180, height: 180, borderRadius: "50%", background: "#f97316", opacity: 0.18 }} />
                    <div style={{ position: "absolute", top: "35%", left: -20, width: 160, height: 160, borderRadius: "50%", background: "#eab308", opacity: 0.15 }} />
                    <div style={{ position: "absolute", bottom: 220, left: 60, width: 200, height: 200, borderRadius: "50%", background: "#22c55e", opacity: 0.16 }} />
                    <div style={{ position: "absolute", top: "45%", right: 40, width: 140, height: 140, borderRadius: "50%", background: "#3b82f6", opacity: 0.17 }} />
                    <div style={{ position: "absolute", bottom: 280, right: -20, width: 190, height: 190, borderRadius: "50%", background: "#a855f7", opacity: 0.18 }} />
                    <div style={{ position: "absolute", top: 180, left: 200, width: 55, height: 55, borderRadius: "50%", background: "#f43f5e", opacity: 0.25 }} />
                    <div style={{ position: "absolute", top: 300, right: 200, width: 45, height: 45, borderRadius: "50%", background: "#06b6d4", opacity: 0.22 }} />
                    <div style={{ position: "absolute", bottom: 380, left: 320, width: 38, height: 38, borderRadius: "50%", background: "#fbbf24", opacity: 0.25 }} />
                    <div style={{ position: "absolute", top: 120, left: 420, width: 50, height: 50, borderRadius: "50%", background: "#8b5cf6", opacity: 0.2 }} />
                </>
            );

        // ── lightFest: Diwali, New Year — golden sparkles & mandala rings ─
        case "lightFest":
            return (
                <>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)" }} />
                    <div style={{ position: "absolute", top: 50, right: 80, fontSize: 48, color: "#fbbf24", opacity: 0.4 }}>✦</div>
                    <div style={{ position: "absolute", top: 170, left: 50, fontSize: 36, color: "#f59e0b", opacity: 0.3 }}>✦</div>
                    <div style={{ position: "absolute", bottom: 220, right: 120, fontSize: 42, color: "#fbbf24", opacity: 0.35 }}>✦</div>
                    <div style={{ position: "absolute", top: "38%", left: 130, fontSize: 30, color: "#f59e0b", opacity: 0.25 }}>✦</div>
                    <div style={{ position: "absolute", bottom: 330, left: 260, fontSize: 38, color: "#fbbf24", opacity: 0.3 }}>✦</div>
                    <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", border: "2px solid rgba(251,191,36,0.2)" }} />
                    <div style={{ position: "absolute", top: -55, right: -55, width: 270, height: 270, borderRadius: "50%", border: "1.5px solid rgba(251,191,36,0.13)" }} />
                    <div style={{ position: "absolute", top: -30, right: -30, width: 220, height: 220, borderRadius: "50%", border: "1px solid rgba(251,191,36,0.08)" }} />
                    <div style={{ position: "absolute", top: 110, right: 210, width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", opacity: 0.4 }} />
                    <div style={{ position: "absolute", bottom: 300, left: 190, width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", opacity: 0.35 }} />
                    <div style={{ position: "absolute", top: 260, left: 370, width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", opacity: 0.3 }} />
                </>
            );

        // ── christmas: Snowflakes & ornaments ───────────────────────────
        case "christmas":
            return (
                <>
                    <div style={{ position: "absolute", top: 40, right: 100, fontSize: 60, color: "rgba(255,255,255,0.22)" }}>✶</div>
                    <div style={{ position: "absolute", top: 210, left: 50, fontSize: 44, color: "rgba(255,255,255,0.16)" }}>✶</div>
                    <div style={{ position: "absolute", bottom: 300, right: 60, fontSize: 52, color: "rgba(255,255,255,0.19)" }}>✶</div>
                    <div style={{ position: "absolute", top: "38%", left: 220, fontSize: 36, color: "rgba(255,255,255,0.12)" }}>✶</div>
                    <div style={{ position: "absolute", top: 90, left: 130, width: 30, height: 30, borderRadius: "50%", background: "#dc2626", opacity: 0.25 }} />
                    <div style={{ position: "absolute", top: 320, right: 180, width: 24, height: 24, borderRadius: "50%", background: "#dc2626", opacity: 0.22 }} />
                    <div style={{ position: "absolute", bottom: 370, left: 300, width: 28, height: 28, borderRadius: "50%", background: "#ef4444", opacity: 0.2 }} />
                    <div style={{ position: "absolute", top: 170, right: 260, width: 26, height: 26, borderRadius: "50%", background: "#16a34a", opacity: 0.22 }} />
                    <div style={{ position: "absolute", bottom: 320, right: 320, width: 22, height: 22, borderRadius: "50%", background: "#22c55e", opacity: 0.18 }} />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #dc2626, #16a34a, #dc2626, #16a34a)", opacity: 0.25 }} />
                </>
            );

        // ── eid: Crescent moon, stars, geometric ────────────────────────
        case "eid":
            return (
                <>
                    <div style={{ position: "absolute", top: 35, right: 55, width: 110, height: 110, borderRadius: "50%", boxShadow: "22px -12px 0 0 rgba(255,255,255,0.2)" }} />
                    <div style={{ position: "absolute", top: 25, right: 190, fontSize: 40, color: "rgba(255,255,255,0.25)" }}>★</div>
                    <div style={{ position: "absolute", top: 105, right: 95, fontSize: 22, color: "rgba(255,255,255,0.2)" }}>★</div>
                    <div style={{ position: "absolute", top: 55, right: 260, fontSize: 18, color: "rgba(255,255,255,0.16)" }}>★</div>
                    <div style={{ position: "absolute", top: 80, left: 60, fontSize: 14, color: "rgba(255,255,255,0.12)" }}>★</div>
                    <div style={{ position: "absolute", bottom: 220, left: 40, width: 130, height: 130, border: "1px solid rgba(255,255,255,0.1)", transform: "rotate(45deg)" }} />
                    <div style={{ position: "absolute", top: 220, right: 30, width: 90, height: 90, border: "1px solid rgba(255,255,255,0.08)", transform: "rotate(45deg)" }} />
                    <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)" }} />
                </>
            );

        // ── independence: Tricolor stripes & Ashoka Chakra ──────────────
        case "independence":
            return (
                <>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "#ff9933", opacity: 0.45 }} />
                    <div style={{ position: "absolute", top: 8, left: 0, right: 0, height: 8, background: "#ffffff", opacity: 0.3 }} />
                    <div style={{ position: "absolute", top: 16, left: 0, right: 0, height: 8, background: "#138808", opacity: 0.45 }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 220, height: 220, borderRadius: "50%", border: "3px solid rgba(0,0,128,0.08)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 180, height: 180, borderRadius: "50%", border: "2px solid rgba(0,0,128,0.06)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 140, height: 140, borderRadius: "50%", border: "1px solid rgba(0,0,128,0.04)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -48%)", width: 2, height: 90, background: "rgba(0,0,128,0.04)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(90deg)", width: 2, height: 90, background: "rgba(0,0,128,0.04)" }} />
                </>
            );

        // ── tropical: Summer, Bali, Maldives, Kerala — waves, sun, palms ─
        case "tropical":
            return (
                <>
                    <svg style={{ position: "absolute", bottom: 170, left: 0, width: "100%", height: 100 }} viewBox="0 0 1080 100" preserveAspectRatio="none">
                        <path d="M0,50 C120,100 240,0 360,50 C480,100 600,0 720,50 C840,100 960,0 1080,50 L1080,100 L0,100 Z" fill="white" fillOpacity="0.1" />
                    </svg>
                    <svg style={{ position: "absolute", bottom: 155, left: 0, width: "100%", height: 80 }} viewBox="0 0 1080 80" preserveAspectRatio="none">
                        <path d="M0,40 C150,80 300,0 450,40 C600,80 750,0 900,40 C1050,80 1080,20 1080,40 L1080,80 L0,80 Z" fill="white" fillOpacity="0.06" />
                    </svg>
                    <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 65%)" }} />
                    <div style={{ position: "absolute", top: 30, right: 50, width: 8, height: 130, background: "rgba(255,255,255,0.08)", borderRadius: 4, transform: "rotate(-20deg)" }} />
                    <div style={{ position: "absolute", top: 15, right: 85, width: 6, height: 110, background: "rgba(255,255,255,0.06)", borderRadius: 3, transform: "rotate(-38deg)" }} />
                    <div style={{ position: "absolute", top: 40, right: 30, width: 5, height: 90, background: "rgba(255,255,255,0.05)", borderRadius: 3, transform: "rotate(-5deg)" }} />
                    <div style={{ position: "absolute", bottom: 260, right: 100, width: 130, height: 130, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", bottom: 240, right: 80, width: 170, height: 170, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)" }} />
                </>
            );

        // ── monsoon: Raindrops, clouds, lush green ──────────────────────
        case "monsoon":
            return (
                <>
                    <div style={{ position: "absolute", top: 40, left: 100, width: 8, height: 26, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.16)" }} />
                    <div style={{ position: "absolute", top: 85, left: 260, width: 7, height: 22, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.13)" }} />
                    <div style={{ position: "absolute", top: 30, left: 420, width: 8, height: 24, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.11)" }} />
                    <div style={{ position: "absolute", top: 100, left: 620, width: 9, height: 28, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.14)" }} />
                    <div style={{ position: "absolute", top: 55, right: 200, width: 7, height: 20, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.12)" }} />
                    <div style={{ position: "absolute", top: 120, right: 100, width: 8, height: 24, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.15)" }} />
                    <div style={{ position: "absolute", top: 70, left: 800, width: 6, height: 18, borderRadius: "0 0 50% 50%", background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ position: "absolute", top: -25, left: "28%", width: 320, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ position: "absolute", top: -35, left: "38%", width: 220, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ position: "absolute", bottom: 220, left: 25, width: 65, height: 110, borderRadius: "50%", background: "rgba(16,185,129,0.1)", transform: "rotate(-30deg)" }} />
                </>
            );

        // ── mountain: Winter, Kashmir — peaks, pines, snowflakes ────────
        case "mountain":
            return (
                <>
                    <svg style={{ position: "absolute", bottom: 160, left: 0, width: "100%", height: 240 }} viewBox="0 0 1080 240" preserveAspectRatio="none">
                        <polygon points="0,240 100,110 200,160 350,40 500,130 660,60 780,110 920,25 1020,90 1080,55 1080,240" fill="white" fillOpacity="0.08" />
                    </svg>
                    <svg style={{ position: "absolute", bottom: 160, left: 0, width: "100%", height: 200 }} viewBox="0 0 1080 200" preserveAspectRatio="none">
                        <polygon points="0,200 160,130 300,170 460,80 600,140 750,50 900,120 1080,70 1080,200" fill="white" fillOpacity="0.05" />
                    </svg>
                    <div style={{ position: "absolute", bottom: 240, left: 80, width: 0, height: 0, borderLeft: "22px solid transparent", borderRight: "22px solid transparent", borderBottom: "55px solid rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", bottom: 225, left: 150, width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderBottom: "44px solid rgba(255,255,255,0.06)" }} />
                    <div style={{ position: "absolute", bottom: 250, right: 120, width: 0, height: 0, borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderBottom: "50px solid rgba(255,255,255,0.07)" }} />
                    <div style={{ position: "absolute", top: 50, right: 85, fontSize: 40, color: "rgba(255,255,255,0.16)" }}>✶</div>
                    <div style={{ position: "absolute", top: 190, left: 60, fontSize: 30, color: "rgba(255,255,255,0.11)" }}>✶</div>
                    <div style={{ position: "absolute", top: "38%", right: 160, fontSize: 26, color: "rgba(255,255,255,0.13)" }}>✶</div>
                </>
            );

        // ── dubai: Geometric Islamic patterns, skyline, gold ────────────
        case "dubai":
            return (
                <>
                    <div style={{ position: "absolute", top: 45, right: 45, width: 110, height: 110, border: "1.5px solid rgba(212,160,23,0.18)", transform: "rotate(45deg)" }} />
                    <div style={{ position: "absolute", top: 67, right: 67, width: 66, height: 66, border: "1px solid rgba(212,160,23,0.12)", transform: "rotate(22.5deg)" }} />
                    <div style={{ position: "absolute", top: 80, right: 80, width: 40, height: 40, background: "rgba(212,160,23,0.06)", transform: "rotate(45deg)" }} />
                    <svg style={{ position: "absolute", bottom: 160, left: 0, width: "100%", height: 190 }} viewBox="0 0 1080 190" preserveAspectRatio="none">
                        <path d="M0,190 L0,170 L60,170 L60,130 L80,130 L80,170 L200,170 L200,110 L212,85 L224,110 L224,170 L360,170 L360,150 L380,150 L380,35 L390,18 L400,35 L400,150 L420,150 L420,170 L560,170 L560,120 L580,120 L580,170 L720,170 L720,140 L750,140 L750,170 L910,170 L910,150 L930,150 L930,170 L1080,170 L1080,190 Z" fill="white" fillOpacity="0.06" />
                    </svg>
                    <div style={{ position: "absolute", top: 28, left: 28, width: 110, height: 2, background: "rgba(212,160,23,0.2)" }} />
                    <div style={{ position: "absolute", top: 28, left: 28, width: 2, height: 110, background: "rgba(212,160,23,0.2)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 65%)" }} />
                </>
            );

        // ── europe: Architectural arches, classical elements ────────────
        case "europe":
            return (
                <>
                    <div style={{ position: "absolute", top: 35, right: 55, width: 130, height: 65, borderRadius: "65px 65px 0 0", border: "2px solid rgba(255,255,255,0.1)", borderBottom: "none" }} />
                    <div style={{ position: "absolute", top: 35, left: 55, width: 90, height: 45, borderRadius: "45px 45px 0 0", border: "1.5px solid rgba(255,255,255,0.07)", borderBottom: "none" }} />
                    <div style={{ position: "absolute", top: 100, right: 85, width: 2, height: 210, background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ position: "absolute", top: 100, right: 150, width: 2, height: 210, background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ position: "absolute", top: 80, left: 80, width: 2, height: 160, background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ position: "absolute", bottom: 220, left: 40, width: 65, height: 65, borderLeft: "2px solid rgba(255,255,255,0.12)", borderBottom: "2px solid rgba(255,255,255,0.12)" }} />
                    <div style={{ position: "absolute", top: 210, left: 210, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                    <div style={{ position: "absolute", top: 230, left: 230, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ position: "absolute", top: 250, left: 210, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                </>
            );

        // ── thailand: Temple spires, lotus, golden accents ──────────────
        case "thailand":
            return (
                <>
                    <div style={{ position: "absolute", top: 25, right: 50, width: 0, height: 0, borderLeft: "28px solid transparent", borderRight: "28px solid transparent", borderBottom: "70px solid rgba(245,158,11,0.12)" }} />
                    <div style={{ position: "absolute", top: 15, right: 72, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: "45px solid rgba(245,158,11,0.08)" }} />
                    <div style={{ position: "absolute", top: 35, right: 35, width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderBottom: "35px solid rgba(245,158,11,0.06)" }} />
                    <div style={{ position: "absolute", bottom: 270, left: 50, width: 65, height: 45, borderRadius: "50%", background: "rgba(245,158,11,0.1)" }} />
                    <div style={{ position: "absolute", bottom: 290, left: 35, width: 45, height: 32, borderRadius: "50%", background: "rgba(245,158,11,0.07)", transform: "rotate(-35deg)" }} />
                    <div style={{ position: "absolute", bottom: 290, left: 75, width: 45, height: 32, borderRadius: "50%", background: "rgba(245,158,11,0.07)", transform: "rotate(35deg)" }} />
                    <div style={{ position: "absolute", top: 105, right: 40, width: 85, height: 1, background: "rgba(245,158,11,0.16)" }} />
                    <div style={{ position: "absolute", top: 115, right: 50, width: 65, height: 1, background: "rgba(245,158,11,0.1)" }} />
                    <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)" }} />
                </>
            );

        // ── honeymoon: Hearts, rose petals, romantic glow ───────────────
        case "honeymoon":
            return (
                <>
                    <div style={{ position: "absolute", top: 40, right: 80, fontSize: 52, color: "rgba(236,72,153,0.22)" }}>♥</div>
                    <div style={{ position: "absolute", top: 160, left: 50, fontSize: 40, color: "rgba(244,114,182,0.16)" }}>♥</div>
                    <div style={{ position: "absolute", bottom: 320, right: 130, fontSize: 46, color: "rgba(236,72,153,0.19)" }}>♥</div>
                    <div style={{ position: "absolute", top: "42%", left: 160, fontSize: 30, color: "rgba(244,114,182,0.13)" }}>♥</div>
                    <div style={{ position: "absolute", bottom: 270, left: 270, fontSize: 36, color: "rgba(236,72,153,0.15)" }}>♥</div>
                    <div style={{ position: "absolute", top: 280, right: 260, fontSize: 24, color: "rgba(251,113,133,0.12)" }}>♥</div>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 65%)" }} />
                    <div style={{ position: "absolute", top: 210, right: 210, width: 22, height: 22, borderRadius: "50%", background: "rgba(244,114,182,0.16)" }} />
                    <div style={{ position: "absolute", bottom: 370, left: 190, width: 18, height: 18, borderRadius: "50%", background: "rgba(251,113,133,0.13)" }} />
                    <div style={{ position: "absolute", top: 300, left: 370, width: 15, height: 15, borderRadius: "50%", background: "rgba(236,72,153,0.11)" }} />
                </>
            );

        // ── family: Colorful balloons, playful shapes ───────────────────
        case "family":
            return (
                <>
                    <div style={{ position: "absolute", top: 25, right: 80, width: 55, height: 65, borderRadius: "50%", background: "rgba(239,68,68,0.16)" }} />
                    <div style={{ position: "absolute", top: 50, right: 150, width: 48, height: 58, borderRadius: "50%", background: "rgba(59,130,246,0.16)" }} />
                    <div style={{ position: "absolute", top: 65, right: 25, width: 42, height: 52, borderRadius: "50%", background: "rgba(34,197,94,0.16)" }} />
                    <div style={{ position: "absolute", top: 85, left: 35, width: 50, height: 62, borderRadius: "50%", background: "rgba(251,191,36,0.16)" }} />
                    <div style={{ position: "absolute", bottom: 300, left: 110, width: 44, height: 54, borderRadius: "50%", background: "rgba(168,85,247,0.13)" }} />
                    <div style={{ position: "absolute", bottom: 320, right: 190, width: 48, height: 60, borderRadius: "50%", background: "rgba(14,165,233,0.13)" }} />
                    <div style={{ position: "absolute", top: 160, left: 210, fontSize: 30, color: "rgba(251,191,36,0.22)" }}>★</div>
                    <div style={{ position: "absolute", bottom: 370, right: 110, fontSize: 26, color: "rgba(34,197,94,0.2)" }}>★</div>
                    <div style={{ position: "absolute", top: 250, right: 300, fontSize: 22, color: "rgba(59,130,246,0.18)" }}>★</div>
                </>
            );

        // ── adventure: Mountain peaks, compass, rugged ──────────────────
        case "adventure":
            return (
                <>
                    <svg style={{ position: "absolute", bottom: 160, left: 0, width: "100%", height: 270 }} viewBox="0 0 1080 270" preserveAspectRatio="none">
                        <polygon points="0,270 200,90 350,170 540,0 700,130 850,55 1080,150 1080,270" fill="white" fillOpacity="0.1" />
                    </svg>
                    <div style={{ position: "absolute", top: 45, right: 45, width: 88, height: 88, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.14)" }} />
                    <div style={{ position: "absolute", top: 67, right: 67, width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 55, right: 88, width: 2, height: 68, background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", top: 88, right: 55, width: 68, height: 2, background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", bottom: 240, left: 55, width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderBottom: "45px solid rgba(255,255,255,0.07)" }} />
                    <div style={{ position: "absolute", bottom: 250, right: 95, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: "40px solid rgba(255,255,255,0.06)" }} />
                </>
            );

        // ── luxury: Diamond shapes, gold grid, premium glow ─────────────
        case "luxury":
            return (
                <>
                    <div style={{ position: "absolute", top: 38, right: 38, width: 55, height: 55, transform: "rotate(45deg)", border: "2px solid rgba(212,160,23,0.22)" }} />
                    <div style={{ position: "absolute", top: 55, right: 55, width: 22, height: 22, transform: "rotate(45deg)", background: "rgba(212,160,23,0.1)" }} />
                    <div style={{ position: "absolute", bottom: 260, left: 38, width: 44, height: 44, transform: "rotate(45deg)", border: "1.5px solid rgba(212,160,23,0.16)" }} />
                    <div style={{ position: "absolute", bottom: 270, left: 50, width: 20, height: 20, transform: "rotate(45deg)", background: "rgba(212,160,23,0.06)" }} />
                    <div style={{ position: "absolute", top: 28, left: 28, width: 160, height: 1, background: "rgba(212,160,23,0.18)" }} />
                    <div style={{ position: "absolute", top: 28, left: 28, width: 1, height: 160, background: "rgba(212,160,23,0.18)" }} />
                    <div style={{ position: "absolute", bottom: 200, right: 28, width: 130, height: 1, background: "rgba(212,160,23,0.14)" }} />
                    <div style={{ position: "absolute", bottom: 200, right: 28, width: 1, height: 130, background: "rgba(212,160,23,0.14)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 65%)" }} />
                </>
            );

        // ── corporate: Clean dot grid, diagonal lines ───────────────────
        case "corporate":
            return (
                <>
                    <div style={{ position: "absolute", top: 40, right: 40, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 40, right: 100, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 40, right: 160, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 100, right: 40, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 100, right: 100, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 100, right: 160, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 160, right: 40, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 160, right: 100, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 160, right: 160, width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 0, right: 220, width: 1, height: 340, background: "rgba(255,255,255,0.05)", transform: "rotate(35deg)", transformOrigin: "top" }} />
                    <div style={{ position: "absolute", top: 0, right: 270, width: 1, height: 340, background: "rgba(255,255,255,0.04)", transform: "rotate(35deg)", transformOrigin: "top" }} />
                </>
            );

        // ── urgency: Flash Sale, Last Minute — starburst, lightning ─────
        case "urgency":
            return (
                <>
                    <div style={{ position: "absolute", top: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.16) 0%, transparent 60%)" }} />
                    <svg style={{ position: "absolute", top: 25, right: 25, width: 65, height: 110 }} viewBox="0 0 60 100">
                        <polygon points="30,0 45,40 35,40 50,100 20,55 30,55 10,0" fill="rgba(251,191,36,0.3)" />
                    </svg>
                    <div style={{ position: "absolute", top: 45, left: 40, width: 18, height: 18, borderRadius: "50%", background: accent, opacity: 0.22 }} />
                    <div style={{ position: "absolute", bottom: 270, right: 60, width: 14, height: 14, borderRadius: "50%", background: accent, opacity: 0.17 }} />
                    <div style={{ position: "absolute", top: -25, right: -25, width: 220, height: 44, background: `${accent}1a`, transform: "rotate(-45deg)" }} />
                    <div style={{ position: "absolute", top: 15, right: 15, width: 180, height: 28, background: `${accent}10`, transform: "rotate(-45deg)" }} />
                    <div style={{ position: "absolute", bottom: 200, left: 30, fontSize: 28, color: accent, opacity: 0.2 }}>✦</div>
                </>
            );

        // ── earlyBird: Sunrise arc, bird shapes, dawn rays ──────────────
        case "earlyBird":
            return (
                <>
                    <div style={{ position: "absolute", bottom: 180, left: "50%", transform: "translateX(-50%)", width: 820, height: 420, borderRadius: "50% 50% 0 0", background: "radial-gradient(ellipse at bottom center, rgba(251,191,36,0.1) 0%, rgba(251,146,60,0.04) 40%, transparent 65%)" }} />
                    <svg style={{ position: "absolute", top: 75, left: 200, width: 44, height: 22, opacity: 0.16 }} viewBox="0 0 40 20">
                        <path d="M0,20 L20,0 L40,20" stroke="white" strokeWidth="2" fill="none" />
                    </svg>
                    <svg style={{ position: "absolute", top: 55, left: 270, width: 32, height: 16, opacity: 0.12 }} viewBox="0 0 30 15">
                        <path d="M0,15 L15,0 L30,15" stroke="white" strokeWidth="1.5" fill="none" />
                    </svg>
                    <svg style={{ position: "absolute", top: 95, left: 155, width: 28, height: 14, opacity: 0.09 }} viewBox="0 0 25 12">
                        <path d="M0,12 L12.5,0 L25,12" stroke="white" strokeWidth="1.5" fill="none" />
                    </svg>
                    <div style={{ position: "absolute", bottom: 210, left: "47%", width: 2, height: 110, background: "rgba(251,191,36,0.08)", transform: "rotate(-12deg)" }} />
                    <div style={{ position: "absolute", bottom: 210, left: "53%", width: 2, height: 110, background: "rgba(251,191,36,0.08)", transform: "rotate(12deg)" }} />
                    <div style={{ position: "absolute", bottom: 200, left: "50%", width: 2, height: 120, background: "rgba(251,191,36,0.06)" }} />
                </>
            );

        // ── group: Person silhouettes, connected dots ───────────────────
        case "group":
            return (
                <>
                    <div style={{ position: "absolute", top: 48, right: 60, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.11)" }} />
                    <div style={{ position: "absolute", top: 75, right: 48, width: 54, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", top: 38, right: 105, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
                    <div style={{ position: "absolute", top: 65, right: 93, width: 54, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ position: "absolute", top: 48, right: 150, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ position: "absolute", top: 75, right: 138, width: 54, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ position: "absolute", bottom: 270, left: 60, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.13)" }} />
                    <div style={{ position: "absolute", bottom: 270, left: 115, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.13)" }} />
                    <div style={{ position: "absolute", bottom: 270, left: 170, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.13)" }} />
                    <div style={{ position: "absolute", bottom: 274, left: 70, width: 100, height: 2, background: "rgba(255,255,255,0.06)" }} />
                </>
            );

        default:
            return null;
    }
}

// ── Main overlay component ──────────────────────────────────────────────────

export const ThemeOverlay = ({ templateId, accent }: { templateId: string; accent: string }) => {
    const theme = resolveTheme(templateId);
    if (!theme) return null;

    const elements = renderTheme(theme, accent);
    if (!elements) return null;

    return (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", zIndex: 3 }}>
            {elements}
        </div>
    );
};
