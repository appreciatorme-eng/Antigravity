import { Redis } from "@upstash/redis";
import { env } from "@/lib/config/env";

export type RuntimeHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type RuntimeProbe = {
    status: RuntimeHealthStatus;
    latency_ms: number;
    detail: string;
    configured: boolean;
};

type DatabaseProbeClient = {
    from: (table: string) => {
        select: (columns: string) => {
            limit: (count: number) => PromiseLike<unknown> | unknown;
        };
    };
};

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
    if (redisClient !== undefined) return redisClient;
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) {
        redisClient = null;
        return null;
    }
    redisClient = new Redis({ url, token });
    return redisClient;
}

function mapHttpStatus(code: number, healthyCodes: number[], degradedCodes: number[] = []): RuntimeHealthStatus {
    if (healthyCodes.includes(code)) return "healthy";
    if (degradedCodes.includes(code)) return "degraded";
    if (code >= 500) return "down";
    return "degraded";
}

async function timedFetch(url: string, init: RequestInit, timeoutMs = 5000): Promise<{ code: number | null; latencyMs: number; error: string | null }> {
    const controller = new AbortController();
    const startedAt = Date.now();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        return { code: response.status, latencyMs: Date.now() - startedAt, error: null };
    } catch (err) {
        return { code: null, latencyMs: Date.now() - startedAt, error: err instanceof Error ? err.message : "probe failed" };
    } finally {
        clearTimeout(timer);
    }
}

export async function checkDatabaseRuntime(client: DatabaseProbeClient): Promise<RuntimeProbe> {
    const startedAt = Date.now();
    try {
        await client.from("profiles").select("id").limit(1);
        return { status: "healthy", latency_ms: Date.now() - startedAt, detail: "Read query succeeded", configured: true };
    } catch {
        return { status: "down", latency_ms: Date.now() - startedAt, detail: "Read query failed", configured: true };
    }
}

export async function checkRedisRuntime(): Promise<RuntimeProbe> {
    const redis = getRedisClient();
    if (!redis) {
        return { status: "unknown", latency_ms: -1, detail: "Redis env missing", configured: false };
    }
    const startedAt = Date.now();
    try {
        await redis.ping();
        return { status: "healthy", latency_ms: Date.now() - startedAt, detail: "Ping ok", configured: true };
    } catch {
        return { status: "down", latency_ms: Date.now() - startedAt, detail: "Ping failed", configured: true };
    }
}

export async function checkFirebaseFcmRuntime(): Promise<RuntimeProbe> {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FCM_PROJECT_ID;
    if (!projectId) {
        return { status: "unknown", latency_ms: -1, detail: "FIREBASE_PROJECT_ID missing", configured: false };
    }
    const result = await timedFetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        },
    );
    if (result.error) {
        return { status: "down", latency_ms: result.latencyMs, detail: result.error, configured: true };
    }
    const status = mapHttpStatus(result.code ?? 0, [200, 400, 401, 403], [404]);
    return { status, latency_ms: result.latencyMs, detail: `HTTP ${result.code}`, configured: true };
}

export async function checkWhatsappRuntime(): Promise<RuntimeProbe> {
    const token = process.env.WHATSAPP_API_TOKEN ?? process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneNumberId) {
        return { status: "unknown", latency_ms: -1, detail: "WhatsApp env vars missing", configured: false };
    }
    const result = await timedFetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=id`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        },
    );
    if (result.error) {
        return { status: "down", latency_ms: result.latencyMs, detail: result.error, configured: true };
    }
    const status = mapHttpStatus(result.code ?? 0, [200], [400, 401, 403, 404]);
    return { status, latency_ms: result.latencyMs, detail: `HTTP ${result.code}`, configured: true };
}

export async function checkSentryRuntime(): Promise<RuntimeProbe> {
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || env.sentry.dsn;
    if (!dsn) {
        return { status: "unknown", latency_ms: -1, detail: "SENTRY_DSN missing", configured: false };
    }
    let endpoint = "";
    try {
        const parsed = new URL(dsn);
        endpoint = `${parsed.protocol}//${parsed.host}/api/0/`;
    } catch {
        return { status: "degraded", latency_ms: -1, detail: "Invalid DSN format", configured: true };
    }
    const result = await timedFetch(endpoint, { method: "GET" });
    if (result.error) {
        return { status: "down", latency_ms: result.latencyMs, detail: result.error, configured: true };
    }
    const status = mapHttpStatus(result.code ?? 0, [200, 301, 302, 401, 403], [404]);
    return { status, latency_ms: result.latencyMs, detail: `HTTP ${result.code}`, configured: true };
}

export async function checkPosthogRuntime(): Promise<RuntimeProbe> {
    const key = process.env.POSTHOG_PROJECT_API_KEY || process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || env.posthog.key;
    const host = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
    if (!key) {
        return { status: "unknown", latency_ms: -1, detail: "POSTHOG key missing", configured: false };
    }
    const normalizedHost = host.replace(/\/$/, "");
    const result = await timedFetch(
        `${normalizedHost}/api/projects/@current`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${key}` },
        },
    );
    if (result.error) {
        return { status: "down", latency_ms: result.latencyMs, detail: result.error, configured: true };
    }
    const status = mapHttpStatus(result.code ?? 0, [200, 401, 403], [404]);
    return { status, latency_ms: result.latencyMs, detail: `HTTP ${result.code}`, configured: true };
}
