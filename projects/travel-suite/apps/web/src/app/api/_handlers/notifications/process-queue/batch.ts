export interface BatchProcessorOptions<T, TResult> {
  items: T[];
  batchSize: number;
  worker: (item: T, index: number) => Promise<TResult>;
  onItemError?: (params: {
    item: T;
    index: number;
    error: unknown;
  }) => void;
}

export async function processInBatches<T, TResult>({
  items,
  batchSize,
  worker,
  onItemError,
}: BatchProcessorOptions<T, TResult>) {
  const safeBatchSize = Math.max(1, batchSize);
  const settledResults: PromiseSettledResult<TResult>[] = [];

  for (let start = 0; start < items.length; start += safeBatchSize) {
    const batch = items.slice(start, start + safeBatchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIndex) => worker(item, start + batchIndex))
    );

    batchResults.forEach((result, batchIndex) => {
      if (result.status === "rejected") {
        onItemError?.({
          item: batch[batchIndex] as T,
          index: start + batchIndex,
          error: result.reason,
        });
      }
    });

    settledResults.push(...batchResults);
  }

  return settledResults;
}
