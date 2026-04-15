type PageResult<T> = {
  data: T[] | null;
  error?: unknown;
};

function isRangeBoundaryError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = String(e.code ?? "");
  const message = String(e.message ?? "").toLowerCase();
  const details = String(e.details ?? "").toLowerCase();
  return (
    code === "PGRST103" ||
    message.includes("range not satisfiable") ||
    details.includes("range not satisfiable")
  );
}

/**
 * Fetches all rows from a paginated Supabase query using .range(from, to).
 * Supabase often defaults to capped page sizes, so this helper avoids silent truncation.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const result = await fetchPage(from, to);
    if (result.error) {
      if (isRangeBoundaryError(result.error)) break;
      throw result.error;
    }

    const chunk = result.data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}
