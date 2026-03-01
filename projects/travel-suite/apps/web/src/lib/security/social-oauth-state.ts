import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";

const DEFAULT_MAX_AGE_MS = 10 * 60_000;
const localConsumedNonces = new Map<string, number>();
let redisClient: Redis | null | undefined;

type OAuthStatePayload = {
  v: 1;
  userId: string;
  nonce: string;
  ts: number;
};

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function encodeBase64Url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, "utf8");
  const rightBuf = Buffer.from(right, "utf8");
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

function getStateSecret(): string {
  return (
    process.env.SOCIAL_OAUTH_STATE_SECRET?.trim() ||
    process.env.CRON_SIGNING_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    ""
  );
}

function requireStateSecret(): string {
  const secret = getStateSecret();
  if (!secret) {
    throw new Error(
      isProductionRuntime()
        ? "SOCIAL_OAUTH_STATE_SECRET is required in production"
        : "SOCIAL_OAUTH_STATE_SECRET is not configured"
    );
  }
  return secret;
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("hex");
}

function cleanupLocalConsumed(nowMs: number): void {
  if (localConsumedNonces.size < 4096) return;
  for (const [key, expiresAt] of localConsumedNonces.entries()) {
    if (expiresAt <= nowMs) {
      localConsumedNonces.delete(key);
    }
  }
}

function getReplayRedis(): Redis | null {
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

async function claimNonce(nonce: string, maxAgeMs: number): Promise<boolean> {
  const replayKey = `social-oauth-state:${nonce}`;
  const ttlSeconds = Math.max(1, Math.ceil(maxAgeMs / 1000));
  const redis = getReplayRedis();

  if (redis) {
    try {
      const result = await redis.set(replayKey, "1", { nx: true, ex: ttlSeconds });
      return result === "OK";
    } catch {
      // Fallback to local replay cache in non-distributed environments.
    }
  }

  const now = Date.now();
  const existingExpiry = localConsumedNonces.get(replayKey);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }

  localConsumedNonces.set(replayKey, now + maxAgeMs);
  cleanupLocalConsumed(now);
  return true;
}

export function createSocialOAuthState(userId: string): string {
  const secret = requireStateSecret();
  const payload: OAuthStatePayload = {
    v: 1,
    userId,
    nonce: randomBytes(16).toString("hex"),
    ts: Date.now(),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function parseStatePayload(encodedPayload: string): OAuthStatePayload | null {
  try {
    const raw = decodeBase64Url(encodedPayload).toString("utf8");
    const parsed = JSON.parse(raw) as Partial<OAuthStatePayload>;

    if (parsed.v !== 1) return null;
    if (typeof parsed.userId !== "string" || parsed.userId.trim().length === 0) return null;
    if (typeof parsed.nonce !== "string" || parsed.nonce.trim().length < 16) return null;
    if (typeof parsed.ts !== "number" || !Number.isFinite(parsed.ts)) return null;

    return {
      v: 1,
      userId: parsed.userId.trim(),
      nonce: parsed.nonce.trim(),
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

export async function consumeSocialOAuthState(
  state: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS
): Promise<{ ok: true; userId: string } | { ok: false; reason: string }> {
  const secret = getStateSecret();
  if (!secret) {
    return {
      ok: false,
      reason: "state_secret_missing",
    };
  }

  const trimmed = (state || "").trim();
  const [encodedPayload, receivedSignature, extra] = trimmed.split(".");
  if (!encodedPayload || !receivedSignature || extra) {
    return { ok: false, reason: "state_malformed" };
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  if (!safeEqual(receivedSignature, expectedSignature)) {
    return { ok: false, reason: "state_signature_invalid" };
  }

  const payload = parseStatePayload(encodedPayload);
  if (!payload) {
    return { ok: false, reason: "state_payload_invalid" };
  }

  const now = Date.now();
  if (Math.abs(now - payload.ts) > maxAgeMs) {
    return { ok: false, reason: "state_expired" };
  }

  const claimed = await claimNonce(payload.nonce, maxAgeMs);
  if (!claimed) {
    return { ok: false, reason: "state_replayed" };
  }

  return {
    ok: true,
    userId: payload.userId,
  };
}
