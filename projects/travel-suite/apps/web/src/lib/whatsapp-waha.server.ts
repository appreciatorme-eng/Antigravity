// WPPConnect (wppconnect-server) client -- server-only.
// Replaced WAHA Core (single-session only) with WPPConnect (unlimited sessions, free).
// API reference: https://github.com/wppconnect-team/wppconnect-server
/** @deprecated Use whatsapp-evolution.server.ts instead. WPPConnect is being replaced by Evolution API. */
import "server-only";
console.warn("[DEPRECATED] whatsapp-waha.server.ts -- use whatsapp-evolution.server.ts instead");
import { env } from "@/lib/config/env";
import { fetchWithRetry } from "@/lib/network/retry";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WPPCONNECT_URL = env.wppconnect.baseUrl;
const WPPCONNECT_SECRET_KEY = env.wppconnect.token;

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
    if (!WPPCONNECT_URL) throw new Error("WPPCONNECT_BASE_URL env var is not configured");

    const base = WPPCONNECT_URL.replace(/\/$/, "");
    const url = `${base}${path}`;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (options?.body) headers["Content-Type"] = "application/json";

    const res = await fetchWithRetry(url, {
        ...options,
        headers: {
            ...headers,
            ...(options?.headers as Record<string, string> | undefined),
        },
        cache: "no-store",
    }, {
        retries: 2,
        timeoutMs: 9000,
        baseDelayMs: 300,
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
        throw new Error("WPPCONNECT_TOKEN env var is not configured");
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
 *
 * Strategy: check the live session state first.
 * - CLOSED / null  → start fresh (close any lingering Chrome first)
 * - Any other state (UNPAIRED, CONNECTING, CONNECTED) → session is alive; return
 *   the token without touching it.  Calling logout-session while a QR scan is in
 *   progress triggers "req.client.logout is not a function" which partially
 *   destroys the session state, causing "Login with success" in the WPPConnect
 *   logs but an immediately-Disconnected check-connection — i.e. the phone shows
 *   "couldn't link device" even though the handshake completed on the server.
 */
export async function createWahaSession(
    orgId: string,
    webhookUrl: string,
): Promise<string> {
    const sessionName = sessionNameFromOrgId(orgId);
    const token = await generateSessionToken(sessionName);

    // Check live session state before deciding to restart.
    let needsStart = true;
    try {
        const statusRes = await wppFetch(`/api/${sessionName}/status-session`, token);
        const body = (await statusRes.json()) as WppStatusResponse;
        // CLOSED = never started or explicitly closed.
        // Any other value (UNPAIRED, CONNECTING, CONNECTED …) = alive — leave it.
        needsStart = !body.status || body.status === "CLOSED";
    } catch {
        // 4xx / network error — session doesn't exist yet, needs to be started.
        needsStart = true;
    }

    if (needsStart) {
        // Soft-close any lingering Chrome process before a fresh start.
        // close-session is safe to call in any state; logout-session is NOT
        // (it throws when called while Chrome is in QR state).
        try {
            await wppFetch(`/api/${sessionName}/close-session`, token, {
                method: "POST",
            });
        } catch {
            // Session may not exist yet — safe to ignore.
        }

        await wppFetch(`/api/${sessionName}/start-session`, token, {
            method: "POST",
            body: JSON.stringify({ webhook: webhookUrl, waitQrCode: false, autoClose: 0 }),
        });
    }

    return token;
}

/**
 * Fetch the current QR code as a raw base64 PNG string (without data: prefix).
 * Returns empty string if QR is not yet ready.
 *
 * WPPConnect getQrCode sends a raw PNG binary (Content-Type: image/png) when
 * the QR is ready, and a JSON status object when the session is still booting.
 * Callers that assume JSON will get a parse error and silently miss the QR.
 */
export async function getWahaQR(sessionName: string, token: string): Promise<string> {
    const res = await wppFetch(`/api/${sessionName}/qrcode-session`, token);

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("image/png") || contentType.includes("image/jpeg")) {
        // QR is ready — response is raw PNG binary, convert to base64
        const buf = await res.arrayBuffer();
        return Buffer.from(buf).toString("base64");
    }

    // Not ready yet — response is a JSON status object
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
        // Use status-session (returns {status: string}) rather than
        // check-connection-session (returns {status: boolean}) — the boolean
        // form throws when passed to .toLowerCase(), making every call return FAILED.
        const res = await wppFetch(`/api/${sessionName}/status-session`, token);
        const json = (await res.json()) as WppStatusResponse & {
            wid?: string;
            pushName?: string;
        };
        const isConnected = json.status === "CONNECTED";

        // When connected, try to get the phone number from session info
        let me: { id: string; pushName: string } | undefined;
        if (isConnected) {
            try {
                const contactRes = await wppFetch(
                    `/api/${sessionName}/host-device`,
                    token,
                );
                const contactJson = (await contactRes.json()) as {
                    response?: { phoneNumber?: string; pushname?: string; id?: string };
                };
                const rawPhone = contactJson.response?.phoneNumber ?? "";
                const userId = rawPhone.replace(/@c\.us$/, "");
                if (userId && userId.length >= 7) {
                    me = {
                        id: userId,
                        pushName: contactJson.response?.pushname ?? "",
                    };
                }
            } catch {
                // host-device not supported or failed — leave me undefined
            }
        }

        return {
            name: sessionName,
            status: isConnected ? "CONNECTED" : "DISCONNECTED",
            me,
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
