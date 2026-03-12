"use client";

import { QRCodeSVG } from "qrcode.react";
import type { TemplateDataForRender } from "@/lib/social/types";

// ── Shared dark-blue contact footer with WhatsApp QR ────────────────────────
export const PosterFooter = ({ templateData, absolute = true, accentColor }: { templateData: TemplateDataForRender; absolute?: boolean; accentColor?: string }) => {
    const contactNumber = templateData.contactNumber || "";
    const email = templateData.email || "info@yourcompany.com";
    const website = templateData.website || "www.yourcompany.com";
    const digits = contactNumber.replace(/\D/g, "");
    const waUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";
    return (
        <div
            className={absolute ? "absolute bottom-0 left-0 right-0" : ""}
            style={{ background: accentColor || "#1a2d5a", padding: "22px 48px", minHeight: 140, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
        >
            <div style={{ color: "#ffffff", lineHeight: 2, fontSize: 22 }}>
                <div>📞 {contactNumber || "+91 00000 00000"}</div>
                <div>✉ {email}</div>
                <div>🌐 {website}</div>
            </div>
            <div style={{ textAlign: "center", color: "#ffffff" }}>
                <QRCodeSVG value={waUrl} size={84} bgColor={accentColor || "#1a2d5a"} fgColor="#ffffff" />
                <p style={{ fontSize: 14, marginTop: 4, opacity: 0.65 }}>Scan for WhatsApp</p>
            </div>
        </div>
    );
};
