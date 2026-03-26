import "server-only";

// ---------------------------------------------------------------------------
// In-memory rate counters (reset on cold start — acceptable safety net)
// ---------------------------------------------------------------------------

interface OrgCounter {
    readonly hourlyCount: number;
    readonly hourlyResetAt: number;
    readonly dailyCount: number;
    readonly dailyResetAt: number;
}

interface ContactCounter {
    readonly dailyCount: number;
    readonly dailyResetAt: number;
}

const orgCounters = new Map<string, OrgCounter>();
const contactCounters = new Map<string, ContactCounter>();

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const HOURLY_LIMIT = 80;
const DAILY_LIMIT = 500;
const PER_CONTACT_DAILY_LIMIT = 30;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;
const NEW_CONTACT_EXTRA_DELAY_MS = 5000;
const NEW_CONTACT_WEIGHT = 3;

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface SendGuardResult {
    readonly allowed: boolean;
    readonly reason?: string;
    readonly delayMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the recipient is a WhatsApp group JID (internal target). */
export function isInternalTarget(recipientWaId: string): boolean {
    return recipientWaId.includes("@g.us");
}

function randomDelay(): number {
    return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function getOrResetOrgCounter(orgId: string, now: number): OrgCounter {
    const existing = orgCounters.get(orgId);

    if (!existing) {
        return {
            hourlyCount: 0,
            hourlyResetAt: now + 3_600_000,
            dailyCount: 0,
            dailyResetAt: now + 86_400_000,
        };
    }

    const hourlyReset = now >= existing.hourlyResetAt;
    const dailyReset = now >= existing.dailyResetAt;

    return {
        hourlyCount: hourlyReset ? 0 : existing.hourlyCount,
        hourlyResetAt: hourlyReset ? now + 3_600_000 : existing.hourlyResetAt,
        dailyCount: dailyReset ? 0 : existing.dailyCount,
        dailyResetAt: dailyReset ? now + 86_400_000 : existing.dailyResetAt,
    };
}

function getOrResetContactCounter(
    key: string,
    now: number,
): ContactCounter {
    const existing = contactCounters.get(key);

    if (!existing) {
        return { dailyCount: 0, dailyResetAt: now + 86_400_000 };
    }

    if (now >= existing.dailyResetAt) {
        return { dailyCount: 0, dailyResetAt: now + 86_400_000 };
    }

    return existing;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a message to the given recipient is allowed under rate limits.
 * Increments counters on success. Returns delay to apply before sending.
 *
 * @param automated - true for bot/chatbot/broadcast sends (adds human-like delays),
 *                    false for manual operator replies from inbox (no delay, no penalty)
 */
export function checkSendGuard(
    orgId: string,
    recipientWaId: string,
    automated: boolean = true,
): SendGuardResult {
    const now = Date.now();
    const orgCounter = getOrResetOrgCounter(orgId, now);
    const isGroup = isInternalTarget(recipientWaId);
    const contactKey = `${orgId}:${recipientWaId}`;
    const contactCounter = getOrResetContactCounter(contactKey, now);
    const isNewContact = contactCounter.dailyCount === 0;
    // Only penalise new contacts for automated sends
    const weight = automated && isNewContact && !isGroup ? NEW_CONTACT_WEIGHT : 1;

    // --- Org hourly check ---
    if (orgCounter.hourlyCount + weight > HOURLY_LIMIT) {
        return {
            allowed: false,
            reason: `Hourly limit reached (${HOURLY_LIMIT}/hr)`,
            delayMs: 0,
        };
    }

    // --- Org daily check ---
    if (orgCounter.dailyCount + weight > DAILY_LIMIT) {
        return {
            allowed: false,
            reason: `Daily limit reached (${DAILY_LIMIT}/day)`,
            delayMs: 0,
        };
    }

    // --- Per-contact daily check (skip for group JIDs) ---
    if (!isGroup && contactCounter.dailyCount + 1 > PER_CONTACT_DAILY_LIMIT) {
        return {
            allowed: false,
            reason: `Per-contact daily limit reached (${PER_CONTACT_DAILY_LIMIT}/day)`,
            delayMs: 0,
        };
    }

    // --- All checks passed — increment counters ---
    const nextOrgCounter: OrgCounter = {
        hourlyCount: orgCounter.hourlyCount + weight,
        hourlyResetAt: orgCounter.hourlyResetAt,
        dailyCount: orgCounter.dailyCount + weight,
        dailyResetAt: orgCounter.dailyResetAt,
    };
    orgCounters.set(orgId, nextOrgCounter);

    const nextContactCounter: ContactCounter = {
        dailyCount: contactCounter.dailyCount + 1,
        dailyResetAt: contactCounter.dailyResetAt,
    };
    contactCounters.set(contactKey, nextContactCounter);

    // --- Calculate delay ---
    // Manual sends (automated=false) get zero delay — operator shouldn't wait
    if (!automated) {
        return { allowed: true, delayMs: 0 };
    }

    const baseDelay = randomDelay();
    const extraDelay = isNewContact && !isGroup ? NEW_CONTACT_EXTRA_DELAY_MS : 0;

    return {
        allowed: true,
        delayMs: baseDelay + extraDelay,
    };
}

/** Simple setTimeout wrapper for applying the guard delay. */
export function applyDelay(delayMs: number): Promise<void> {
    if (delayMs <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}
