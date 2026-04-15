type PageResult<T> = {
  data: T[] | null;
  error?: unknown;
};

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
    if (result.error) throw result.error;

    const chunk = result.data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}
