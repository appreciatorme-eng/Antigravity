import { timingSafeEqual } from "node:crypto";

export function safeEqual(left: string, right: string): boolean {
    const leftBuf = Buffer.from(left, "utf8");
    const rightBuf = Buffer.from(right, "utf8");
    const maxLen = Math.max(leftBuf.length, rightBuf.length);
    const paddedLeft = Buffer.alloc(maxLen, 0);
    const paddedRight = Buffer.alloc(maxLen, 0);
    leftBuf.copy(paddedLeft);
    rightBuf.copy(paddedRight);
    const valuesEqual = timingSafeEqual(paddedLeft, paddedRight);
    return valuesEqual && leftBuf.length === rightBuf.length;
}
