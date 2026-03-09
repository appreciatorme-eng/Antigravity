import { expect, it } from "vitest";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "../../../src/lib/security/sanitize";

it("sanitizeText removes control characters", () => {
    expect(sanitizeText("hello\x00world")).toBe("helloworld");
    expect(sanitizeText("test\x1Fvalue")).toBe("testvalue");
});

it("sanitizeText collapses newlines and tabs into spaces", () => {
    expect(sanitizeText("line1\nline2")).toBe("line1 line2");
    expect(sanitizeText("col1\tcol2")).toBe("col1 col2");
});

it("sanitizeText strips newlines even with preserveNewlines=true via control-char regex", () => {
    // preserveNewlines skips the \r\n\t → space step, but the subsequent
    // control-char regex (\u0000-\u001F) still removes \n (\u000A).
    const result = sanitizeText("line1\nline2", { preserveNewlines: true });
    expect(result).toBe("line1line2");
});

it("sanitizeText truncates to maxLength", () => {
    const long = "a".repeat(300);
    expect(sanitizeText(long, { maxLength: 100 })).toHaveLength(100);
    expect(sanitizeText(long)).toHaveLength(200);
});

it("sanitizeText returns empty string for null/undefined", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
});

it("sanitizeText trims leading and trailing whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
});

it("sanitizeEmail rejects malformed emails", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
    expect(sanitizeEmail("missing@")).toBeNull();
    expect(sanitizeEmail("@nodomain.com")).toBeNull();
});

it("sanitizeEmail normalises valid emails to lowercase", () => {
    expect(sanitizeEmail("User@Example.COM")).toBe("user@example.com");
});

it("sanitizeEmail returns null for empty input", () => {
    expect(sanitizeEmail("")).toBeNull();
    expect(sanitizeEmail(null)).toBeNull();
});

it("sanitizePhone strips non-digit/plus characters except leading plus", () => {
    const result = sanitizePhone("+91 98765 43210");
    expect(result).toBeTruthy();
    expect(result).not.toContain(" ");
});

it("sanitizePhone returns null for empty input", () => {
    expect(sanitizePhone("")).toBeNull();
    expect(sanitizePhone(null)).toBeNull();
});
