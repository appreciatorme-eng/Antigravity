import { after } from "next/server";

type BackgroundTask = Promise<unknown> | (() => Promise<unknown>);

export function scheduleBackgroundTask(task: BackgroundTask): void {
    const run = async () => {
        const promise = typeof task === "function" ? task() : task;
        await promise;
    };

    try {
        after(run);
        return;
    } catch {
        void run().catch(() => undefined);
    }
}
