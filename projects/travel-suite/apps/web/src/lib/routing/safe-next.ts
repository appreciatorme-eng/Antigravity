const SAFE_INTERNAL_ORIGIN = "https://tripbuilt.internal";

export function sanitizeInternalNext(
    value: string | null | undefined,
    fallback = "/admin",
): string {
    if (!value) return fallback;

    const trimmed = value.trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
        return fallback;
    }

    try {
        const parsed = new URL(trimmed, SAFE_INTERNAL_ORIGIN);
        if (parsed.origin !== SAFE_INTERNAL_ORIGIN) {
            return fallback;
        }
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return fallback;
    }
}
