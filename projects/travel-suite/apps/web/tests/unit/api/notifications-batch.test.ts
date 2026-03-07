import { expect, it } from "vitest";

import { processInBatches } from "../../../src/app/api/_handlers/notifications/process-queue/batch";

it("processes work in bounded concurrent batches", async () => {
  let active = 0;
  let peakConcurrency = 0;

  const results = await processInBatches({
    items: [1, 2, 3, 4, 5],
    batchSize: 2,
    worker: async (item) => {
      active += 1;
      peakConcurrency = Math.max(peakConcurrency, active);
      await Promise.resolve();
      active -= 1;
      return item * 2;
    },
  });

  expect(peakConcurrency).toBeLessThanOrEqual(2);
  expect(results).toEqual([
    { status: "fulfilled", value: 2 },
    { status: "fulfilled", value: 4 },
    { status: "fulfilled", value: 6 },
    { status: "fulfilled", value: 8 },
    { status: "fulfilled", value: 10 },
  ]);
});

it("surfaces rejected items without aborting later work", async () => {
  const failures: Array<{ item: number; index: number; message: string }> = [];

  const results = await processInBatches({
    items: [1, 2, 3],
    batchSize: 2,
    worker: async (item) => {
      if (item === 2) {
        throw new Error("provider down");
      }
      return item;
    },
    onItemError: ({ item, index, error }) => {
      failures.push({
        item,
        index,
        message: error instanceof Error ? error.message : String(error),
      });
    },
  });

  expect(failures).toEqual([
    { item: 2, index: 1, message: "provider down" },
  ]);
  expect(results[0]).toEqual({ status: "fulfilled", value: 1 });
  expect(results[1]?.status).toBe("rejected");
  expect(results[2]).toEqual({ status: "fulfilled", value: 3 });
});
