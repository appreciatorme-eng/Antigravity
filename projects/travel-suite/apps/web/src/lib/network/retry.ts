interface RetryFetchOptions {
    retries?: number;
    baseDelayMs?: number;
    timeoutMs?: number;
    retryOnStatuses?: number[];
}

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

function shouldRetryStatus(status: number, retryOnStatuses: number[]): boolean {
    if (retryOnStatuses.includes(status)) return true;
    return status >= 500;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
    input: string | URL | Request,
    init?: RequestInit,
    options: RetryFetchOptions = {}
): Promise<Response> {
    const retries = options.retries ?? 2;
    const baseDelayMs = options.baseDelayMs ?? 200;
    const timeoutMs = options.timeoutMs ?? 8000;
    const retryOnStatuses = options.retryOnStatuses ?? DEFAULT_RETRY_STATUSES;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(input, {
                ...init,
                signal: controller.signal,
            });

            clearTimeout(timeoutHandle);

            if (response.ok || attempt === retries || !shouldRetryStatus(response.status, retryOnStatuses)) {
                return response;
            }
        } catch (error) {
            clearTimeout(timeoutHandle);
            lastError = error;
            if (attempt === retries) {
                throw error;
            }
        }

        const waitMs = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 100);
        await delay(waitMs);
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed after retries");
}
