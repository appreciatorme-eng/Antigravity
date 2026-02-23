import { timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string): boolean {
    const leftBuf = Buffer.from(left, "utf8");
    const rightBuf = Buffer.from(right, "utf8");
    if (leftBuf.length !== rightBuf.length) return false;
    return timingSafeEqual(leftBuf, rightBuf);
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

export function isCronSecretHeader(headerValue: string | null | undefined): boolean {
    return matchesAnyCronSecret(headerValue);
}

export function isCronSecretBearer(authHeader: string | null): boolean {
    if (!authHeader?.startsWith("Bearer ")) return false;
    return matchesAnyCronSecret(authHeader.substring(7));
}

