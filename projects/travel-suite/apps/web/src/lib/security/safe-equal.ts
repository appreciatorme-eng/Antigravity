import { timingSafeEqual } from "node:crypto";

export function safeEqual(left: string, right: string): boolean {
    const leftBuf = Buffer.from(left, "utf8");
    const rightBuf = Buffer.from(right, "utf8");
    if (leftBuf.length !== rightBuf.length) return false;
    return timingSafeEqual(leftBuf, rightBuf);
}
