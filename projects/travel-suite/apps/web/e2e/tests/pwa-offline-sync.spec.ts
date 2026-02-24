import { expect, test, type Page } from "@playwright/test";
import { gotoWithRetry } from "../fixtures/navigation";

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service worker is unavailable in this browser context");
    }

    await navigator.serviceWorker.ready;
  });

  let hasController = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  if (!hasController) {
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    hasController = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  }

  expect(hasController).toBeTruthy();
}

async function readQueueLength(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active ?? navigator.serviceWorker.controller;
    if (!worker) return -1;

    return new Promise<number>((resolve) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => resolve(-1), 2000);

      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        const payload = event.data as { queueLength?: unknown } | null;
        resolve(typeof payload?.queueLength === "number" ? payload.queueLength : -1);
      };

      worker.postMessage({ type: "GET_OFFLINE_QUEUE_STATUS" }, [channel.port2]);
    });
  });
}

async function requestReplay(page: Page): Promise<{ replayed: number; remaining: number; failed: number }> {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active ?? navigator.serviceWorker.controller;
    if (!worker) return { replayed: 0, remaining: 0, failed: 1 };

    return new Promise<{ replayed: number; remaining: number; failed: number }>((resolve) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(
        () => resolve({ replayed: 0, remaining: 0, failed: 1 }),
        4000
      );

      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        const payload = event.data as
          | { replayed?: unknown; remaining?: unknown; failed?: unknown }
          | null;

        resolve({
          replayed: typeof payload?.replayed === "number" ? payload.replayed : 0,
          remaining: typeof payload?.remaining === "number" ? payload.remaining : 0,
          failed: typeof payload?.failed === "number" ? payload.failed : 0,
        });
      };

      worker.postMessage({ type: "REPLAY_OFFLINE_MUTATIONS" }, [channel.port2]);
    });
  });
}

test.describe("PWA Offline Mutation Replay", () => {
  test("queues failed share mutations and replays them when connectivity is restored", async ({
    context,
    page,
  }) => {
    test.setTimeout(60_000);
    const token = "pwa-offline-sync-e2e";

    await gotoWithRetry(page, "/offline");
    await page.waitForLoadState("networkidle");

    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const deletion = indexedDB.deleteDatabase("gobuddy-offline-mutations-v1");
        deletion.onsuccess = () => resolve();
        deletion.onerror = () => resolve();
        deletion.onblocked = () => resolve();
      });
    });

    await waitForServiceWorkerControl(page);

    let allowNetwork = false;

    await context.route(`**/api/share/${token}`, async (route) => {
      if (!allowNetwork) {
        await route.abort("internetdisconnected");
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          comment: {
            id: "synced-comment",
            author: "E2E",
            comment: "Queued mutation replayed",
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    const queuedResult = await page.evaluate(async (shareToken) => {
      const response = await fetch(`/api/share/${shareToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          author: "E2E",
          comment: "Queue this while offline",
        }),
      });

      return {
        status: response.status,
        payload: await response.json().catch(() => null),
      };
    }, token);

    expect(queuedResult.status).toBe(202);
    expect(queuedResult.payload?.offlineQueued).toBeTruthy();

    await expect
      .poll(async () => readQueueLength(page), {
        timeout: 5000,
      })
      .toBeGreaterThan(0);

    allowNetwork = true;
    const replayResult = await requestReplay(page);
    expect(replayResult.replayed).toBeGreaterThan(0);

    await expect
      .poll(async () => readQueueLength(page), {
        timeout: 10_000,
      })
      .toBe(0);
  });
});
