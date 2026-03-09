const IS_PRODUCTION = process.env.NODE_ENV === "production";

export function safeErrorMessage(
    error: unknown,
    fallback = "An unexpected error occurred"
): string {
    if (!IS_PRODUCTION && error instanceof Error) {
        return error.message;
    }
    return fallback;
}
