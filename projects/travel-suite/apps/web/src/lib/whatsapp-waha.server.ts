// WPPConnect (wppconnect-server) client — server-only.
// Replaced WAHA Core (single-session only) with WPPConnect (unlimited sessions, free).
// API reference: https://github.com/wppconnect-team/wppconnect-server
import "server-only";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WPPCONNECT_URL = process.env.WPPCONNECT_URL;
const WPPCONNECT_SECRET_KEY = process.env.WHATSAPP_API_KEY;

// ---------------------------------------------------------------------------
// Types — exported so route handlers can type-check responses
// ---------------------------------------------------------------------------

export type WahaStatus =
    | "CONNECTED"
    | "DISCONNECTED"
    | "SCAN_QR_CODE"
    | "STARTING"
    | "FAILED";

export interface WahaSession {
    readonly name: string;
    readonly status: WahaStatus;
    readonly me?: {
        readonly id: string;
        readonly pushName: string;
    };
}

interface WppTokenResponse {
    readonly status?: string;
    readonly token?: string;
}

interface WppQrResponse {
    readonly qrcode?: string;
    readonly status?: string;
}

interface WppStatusResponse {
    readonly status?: string;
}

// ---------------------------------------------------------------------------
// Session naming — deterministic, stable per org, ≤ 20 chars
// ---------------------------------------------------------------------------

export function sessionNameFromOrgId(orgId: string): string {
    return "org_" + orgId.replace(/-/g, "").slice(0, 8);
}

// ---------------------------------------------------------------------------
// Internal fetch helper — attaches Bearer token when provided
// ---------------------------------------------------------------------------

async function wppFetch(
    path: string,
    token?: string,
    options?: RequestInit,
): Promise<Response> {
    if (!WPPCONNECT_URL) throw new Error("WPPCONNECT_URL env var is not configured");

    const base = WPPCONNECT_URL.replace(/\/$/, "");
    const url = `${base}${path}`;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (options?.body) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options?.headers as Record<string, string> | undefined),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(
            `WPPConnect ${options?.method ?? "GET"} ${path} → ${res.status}: ${text}`,
        );
    }

    return res;
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

/**
 * Generate (or retrieve cached) a WPPConnect session token.
 * Idempotent: WPPConnect returns the same token for an existing session.
 */
async function generateSessionToken(sessionName: string): Promise<string> {
    if (!WPPCONNECT_SECRET_KEY) {
        throw new Error("WHATSAPP_API_KEY env var is not configured");
    }

    const res = await wppFetch(
        `/api/${sessionName}/${WPPCONNECT_SECRET_KEY}/generate-token`,
        undefined,
        { method: "POST" },
    );

    const json = (await res.json()) as WppTokenResponse;
    if (!json.token) {
        throw new Error(
            `WPPConnect generate-token returned no token: ${JSON.stringify(json)}`,
        );
    }

    return json.token;
}

// ---------------------------------------------------------------------------
// Public API — same export names as the old WAHA library for easy refactoring
// ---------------------------------------------------------------------------

/**
 * Create (or resume) a named WPPConnect session for an org.
 * Returns the session Bearer token — caller MUST store it in whatsapp_connections.session_token.
 * Idempotent: safe to call multiple times; existing sessions are reused.
 *
 * Changed from void → Promise<string> to return token for storage.
 */
export async function createWahaSession(
    orgId: string,
    webhookUrl: string,
): Promise<string> {
    const sessionName = sessionNameFromOrgId(orgId);
    const token = await generateSessionToken(sessionName);

    try {
        await wppFetch(`/api/${sessionName}/start-session`, token, {
            method: "POST",
            body: JSON.stringify({ webhook: webhookUrl, waitQrCode: false }),
        });
    } catch (err) {
        // 400 / 409 / 422 = session already started or exists — treat as success
        if (
            err instanceof Error &&
            (err.message.includes("400") ||
                err.message.includes("409") ||
                err.message.includes("422"))
        ) {
            return token;
        }
        throw err;
    }

    return token;
}

/**
 * Fetch the current QR code as a raw base64 PNG string (without data: prefix).
 * Returns empty string if QR is not yet ready.
 */
export async function getWahaQR(sessionName: string, token: string): Promise<string> {
    const res = await wppFetch(`/api/${sessionName}/qrcode-session`, token);
    const json = (await res.json()) as WppQrResponse;

    const dataUrl = json.qrcode ?? "";
    if (dataUrl.includes(",")) {
        return dataUrl.split(",")[1] ?? "";
    }

    return dataUrl;
}

/**
 * Fetch the current session status mapped to a WahaSession-compatible shape.
 * CONNECTED / DISCONNECTED are the two main states; FAILED on network error.
 * During QR phase, WPPConnect reports "Disconnected" — callers should check
 * the DB row status to distinguish "connecting" from "disconnected".
 */
export async function getWahaStatus(
    sessionName: string,
    token: string,
): Promise<WahaSession> {
    try {
        const res = await wppFetch(
            `/api/${sessionName}/check-connection-session`,
            token,
        );
        const json = (await res.json()) as WppStatusResponse;

        const rawStatus = (json.status ?? "").toLowerCase();
        const isConnected = rawStatus === "connected" || rawStatus === "true";

        return {
            name: sessionName,
            status: isConnected ? "CONNECTED" : "DISCONNECTED",
        };
    } catch {
        return { name: sessionName, status: "FAILED" };
    }
}

/**
 * Send a plain-text WhatsApp message from a session.
 * phoneDigits — E.164 digits without "+", e.g. "919876543210"
 */
export async function sendWahaText(
    sessionName: string,
    token: string,
    phoneDigits: string,
    text: string,
): Promise<void> {
    const digits = phoneDigits.replace(/\D/g, "");
    const phone = `${digits}@c.us`;

    await wppFetch(`/api/${sessionName}/send-message`, token, {
        method: "POST",
        body: JSON.stringify({ phone, isGroup: false, message: text }),
    });
}

/**
 * Close a WPPConnect session. Errors are swallowed — session may already be gone.
 */
export async function disconnectWahaSession(
    sessionName: string,
    token?: string,
): Promise<void> {
    if (!token) return;
    try {
        await wppFetch(`/api/${sessionName}/close-session`, token, { method: "POST" });
    } catch {
        // Intentional: safe to ignore — session already gone
    }
}
