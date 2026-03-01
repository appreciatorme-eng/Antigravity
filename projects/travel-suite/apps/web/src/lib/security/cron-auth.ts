import { createHmac, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";

export interface CronAuthOptions {
    secretHeaderName?: string;
    idempotencyHeaderName?: string;
    maxClockSkewMs?: number;
    replayWindowMs?: number;
}

export interface CronAuthResult {
    authorized: boolean;
    status: number;
    reason: string;
    mode?: "bearer" | "header" | "signature";
    replayKey?: string;
}

const DEFAULT_MAX_CLOCK_SKEW_MS = 5 * 60_000;
const DEFAULT_REPLAY_WINDOW_MS = 10 * 60_000;
const localReplayKeys = new Map<string, number>();
let replayRedis: Redis | null | undefined;

function safeEqual(left: string, right: string): boolean {
    const leftBuf = Buffer.from(left, "utf8");
    const rightBuf = Buffer.from(right, "utf8");
    if (leftBuf.length !== rightBuf.length) return false;
    return timingSafeEqual(leftBuf, rightBuf);
}

function getSigningSecret(): string {
    return (
        process.env.CRON_SIGNING_SECRET?.trim() ||
        process.env.NOTIFICATION_SIGNING_SECRET?.trim() ||
        ""
    );
}

function getCronSecrets(): string[] {
    const secrets = [
        process.env.CRON_SECRET || "",
        process.env.NOTIFICATION_CRON_SECRET || "",
    ]
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    return Array.from(new Set(secrets));
}

function getReplayRedis(): Redis | null {
    if (replayRedis !== undefined) return replayRedis;

    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) {
        replayRedis = null;
        return null;
    }

    replayRedis = new Redis({ url, token });
    return replayRedis;
}

function matchesAnyCronSecret(value: string | null | undefined): boolean {
    const candidate = (value || "").trim();
    if (!candidate) return false;

    for (const secret of getCronSecrets()) {
        if (safeEqual(candidate, secret)) {
            return true;
        }
    }

    return false;
}

function cleanupExpiredLocalReplay(now: number): void {
    if (localReplayKeys.size < 4096) return;
    for (const [key, expiresAt] of localReplayKeys.entries()) {
        if (expiresAt <= now) {
            localReplayKeys.delete(key);
        }
    }
}

async function claimReplayKey(key: string, replayWindowMs: number): Promise<boolean> {
    const ttlSeconds = Math.max(1, Math.ceil(replayWindowMs / 1000));
    const redis = getReplayRedis();

    if (redis) {
        try {
            const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
            return result === "OK";
        } catch {
            // Fall back to local memory if Redis is temporarily unavailable.
        }
    }

    const now = Date.now();
    const existingExpiry = localReplayKeys.get(key);
    if (existingExpiry && existingExpiry > now) {
        return false;
    }

    localReplayKeys.set(key, now + replayWindowMs);
    cleanupExpiredLocalReplay(now);
    return true;
}

export function isCronSecretHeader(headerValue: string | null | undefined): boolean {
    return matchesAnyCronSecret(headerValue);
}

export function isCronSecretBearer(authHeader: string | null): boolean {
    if (!authHeader?.startsWith("Bearer ")) return false;
    return matchesAnyCronSecret(authHeader.substring(7));
}

function isSignedCronRequest(request: Request, maxClockSkewMs: number): boolean {
    const signingSecret = getSigningSecret();
    if (!signingSecret) return false;

    const ts = request.headers.get("x-cron-ts") || request.headers.get("x-cron-timestamp") || "";
    const signature = request.headers.get("x-cron-signature") || "";
    const nonce = request.headers.get("x-cron-nonce") || "";
    const tsMs = Number(ts);
    if (!ts || !signature || !nonce || !Number.isFinite(tsMs)) {
        return false;
    }

    const now = Date.now();
    if (Math.abs(now - tsMs) > maxClockSkewMs) {
        return false;
    }

    const { pathname } = new URL(request.url);
    const payload = `${ts}:${nonce}:${request.method}:${pathname}`;
    const expected = createHmac("sha256", signingSecret).update(payload).digest("hex");

    return safeEqual(signature, expected);
}

function hasAnyCronCredentialConfigured(): boolean {
    return getCronSecrets().length > 0 || Boolean(getSigningSecret());
}

function getReplayFingerprint(
    request: Request,
    mode: "bearer" | "header" | "signature",
    idempotencyHeaderName: string
): string {
    const explicitKey = request.headers.get(idempotencyHeaderName)?.trim();
    const nonce = request.headers.get("x-cron-nonce")?.trim();
    const ts = request.headers.get("x-cron-ts") || request.headers.get("x-cron-timestamp") || "";
    const { pathname } = new URL(request.url);

    if (explicitKey) {
        return `${mode}:${pathname}:${explicitKey}`;
    }

    if (nonce) {
        return `${mode}:${pathname}:${nonce}`;
    }

    const minuteBucket = Math.floor(Date.now() / 60_000);
    return `${mode}:${pathname}:${request.method}:${ts || minuteBucket}`;
}

export async function authorizeCronRequest(
    request: Request,
    options: CronAuthOptions = {}
): Promise<CronAuthResult> {
    const secretHeaderName = options.secretHeaderName || "x-cron-secret";
    const idempotencyHeaderName = options.idempotencyHeaderName || "x-cron-idempotency-key";
    const maxClockSkewMs = options.maxClockSkewMs ?? DEFAULT_MAX_CLOCK_SKEW_MS;
    const replayWindowMs = options.replayWindowMs ?? DEFAULT_REPLAY_WINDOW_MS;

    if (!hasAnyCronCredentialConfigured()) {
        return {
            authorized: false,
            status: 401,
            reason: "Unauthorized cron request",
        };
    }

    const authHeader = request.headers.get("authorization");
    const headerSecret = request.headers.get(secretHeaderName);

    let mode: "bearer" | "header" | "signature" | null = null;

    if (isCronSecretBearer(authHeader)) {
        mode = "bearer";
    } else if (isCronSecretHeader(headerSecret)) {
        mode = "header";
    } else if (isSignedCronRequest(request, maxClockSkewMs)) {
        mode = "signature";
    }

    if (!mode) {
        return {
            authorized: false,
            status: 401,
            reason: "Unauthorized cron request",
        };
    }

    const replayKey = getReplayFingerprint(request, mode, idempotencyHeaderName);
    const claimed = await claimReplayKey(`cron-replay:${replayKey}`, replayWindowMs);
    if (!claimed) {
        return {
            authorized: false,
            status: 409,
            reason: "Replay detected",
            mode,
            replayKey,
        };
    }

    return {
        authorized: true,
        status: 200,
        reason: "Authorized",
        mode,
        replayKey,
    };
}
