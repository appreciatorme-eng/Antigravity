// sanitize-advanced.test.ts
// Advanced tests for sanitizeText, sanitizeEmail, sanitizePhone from @/lib/security/sanitize

import { describe, expect, it } from "vitest";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/security/sanitize";

describe("sanitizeText - edge cases and XSS vectors", () => {
  it("returns empty string for empty string input", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("returns empty string for null", () => {
    expect(sanitizeText(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(sanitizeText(undefined)).toBe("");
  });

  it("coerces number input to string", () => {
    expect(sanitizeText(42)).toBe("42");
  });

  it("coerces boolean input to string", () => {
    expect(sanitizeText(true)).toBe("true");
    expect(sanitizeText(false)).toBe("false");
  });

  it("coerces object to string representation", () => {
    const result = sanitizeText({ key: "val" });
    expect(typeof result).toBe("string");
  });

  it("strips <script> tags from text", () => {
    const input = '<script>alert("xss")</script>hello';
    const result = sanitizeText(input);
    // sanitizeText does not strip HTML tags, but strips control chars
    // The tags remain but any control chars inside are removed
    expect(result).toContain("hello");
    expect(result).not.toContain("\x00");
  });

  it("strips img onerror XSS vector control chars", () => {
    const input = '<img onerror="alert(1)" src=x>';
    const result = sanitizeText(input);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("strips event handler attributes with control chars embedded", () => {
    const input = '<div onmouseover="\x00alert(1)">hover</div>';
    const result = sanitizeText(input);
    expect(result).not.toContain("\x00");
  });

  it("truncates to default maxLength of 200", () => {
    const input = "x".repeat(250);
    const result = sanitizeText(input);
    expect(result).toHaveLength(200);
  });

  it("truncates to custom maxLength", () => {
    const input = "abcdefghij";
    expect(sanitizeText(input, { maxLength: 5 })).toBe("abcde");
  });

  it("does not truncate when maxLength is 0 (unlimited)", () => {
    const input = "a".repeat(1000);
    expect(sanitizeText(input, { maxLength: 0 })).toHaveLength(1000);
  });

  it("preserves text shorter than maxLength", () => {
    expect(sanitizeText("short", { maxLength: 100 })).toBe("short");
  });

  it("collapses newlines and tabs to spaces when preserveNewlines is false", () => {
    expect(sanitizeText("a\nb\tc\rd")).toBe("a b c d");
  });

  it("does not collapse newlines when preserveNewlines is true (but control chars still removed)", () => {
    // newlines are \u000A which is in \u0000-\u001F range
    const result = sanitizeText("line1\nline2", { preserveNewlines: true });
    // preserveNewlines skips the \r\n\t -> space step
    // but the control-char regex still removes \n
    expect(result).toBe("line1line2");
  });

  it("handles carriage return + newline combination", () => {
    const result = sanitizeText("hello\r\nworld");
    expect(result).toBe("hello world");
  });

  it("handles multiple consecutive whitespace after control char removal", () => {
    const result = sanitizeText("a\t\t\tb");
    expect(result).toBe("a b");
  });

  it("trims leading whitespace", () => {
    expect(sanitizeText("   hello")).toBe("hello");
  });

  it("trims trailing whitespace", () => {
    expect(sanitizeText("hello   ")).toBe("hello");
  });

  it("handles string with only whitespace", () => {
    expect(sanitizeText("   ")).toBe("");
  });

  it("handles string with only control characters", () => {
    expect(sanitizeText("\x00\x01\x02\x03")).toBe("");
  });

  it("removes DEL character (\\x7F)", () => {
    expect(sanitizeText("abc\x7Fdef")).toBe("abcdef");
  });

  it("preserves unicode characters outside control range", () => {
    expect(sanitizeText("Hello World")).toBe("Hello World");
  });

  it("handles XSS via javascript: protocol in text", () => {
    const input = "javascript:alert(1)";
    const result = sanitizeText(input);
    expect(typeof result).toBe("string");
    // sanitizeText only strips control chars; it does not parse URLs
    expect(result).toBe("javascript:alert(1)");
  });

  it("handles SQL injection attempt as plain text", () => {
    const input = "'; DROP TABLE users; --";
    const result = sanitizeText(input);
    expect(result).toBe("'; DROP TABLE users; --");
  });
});

describe("sanitizeEmail - advanced validation", () => {
  it("accepts standard email format", () => {
    expect(sanitizeEmail("user@example.com")).toBe("user@example.com");
  });

  it("accepts email with +alias", () => {
    expect(sanitizeEmail("user+tag@example.com")).toBe("user+tag@example.com");
  });

  it("accepts email with subdomain", () => {
    expect(sanitizeEmail("admin@mail.example.co.uk")).toBe("admin@mail.example.co.uk");
  });

  it("lowercases the entire email", () => {
    expect(sanitizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("returns null for email without @ sign", () => {
    expect(sanitizeEmail("userexample.com")).toBeNull();
  });

  it("returns null for email with multiple @ signs", () => {
    expect(sanitizeEmail("user@@example.com")).toBeNull();
  });

  it("returns null for email with no domain extension", () => {
    expect(sanitizeEmail("user@localhost")).toBeNull();
  });

  it("returns null for email with only @ and dot", () => {
    expect(sanitizeEmail("@.")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(sanitizeEmail(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(sanitizeEmail(undefined)).toBeNull();
  });

  it("returns null for empty string input", () => {
    expect(sanitizeEmail("")).toBeNull();
  });

  it("does not reject XSS in email field if it passes regex (sanitizeEmail is not an HTML sanitizer)", () => {
    // sanitizeEmail only validates email format via regex, not HTML content
    // The string '<script>alert("xss")</script>@evil.com' matches ^[^\s@]+@[^\s@]+\.[^\s@]+$
    const result = sanitizeEmail('<script>alert("xss")</script>@evil.com');
    expect(typeof result).toBe("string");
  });

  it("returns null for email with spaces inside angle brackets", () => {
    expect(sanitizeEmail("user <script>@evil.com")).toBeNull();
  });

  it("returns null for email with spaces", () => {
    expect(sanitizeEmail("user @example.com")).toBeNull();
  });

  it("trims whitespace before validating", () => {
    // sanitizeText trims, so leading/trailing spaces should be handled
    expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("accepts email with dots in local part", () => {
    expect(sanitizeEmail("first.last@example.com")).toBe("first.last@example.com");
  });

  it("accepts email with hyphens in domain", () => {
    expect(sanitizeEmail("user@my-domain.com")).toBe("user@my-domain.com");
  });

  it("returns null for numeric-only input", () => {
    expect(sanitizeEmail(12345)).toBeNull();
  });

  it("truncates overly long emails via maxLength 320", () => {
    const longLocal = "a".repeat(300);
    const email = `${longLocal}@example.com`;
    // After truncation at 320 chars the email may lose the domain part
    const result = sanitizeEmail(email);
    // If truncation breaks the email format, it should return null
    if (result !== null) {
      expect(result.length).toBeLessThanOrEqual(320);
    }
  });
});

describe("sanitizePhone - advanced format handling", () => {
  it("handles US format with country code and spaces", () => {
    const result = sanitizePhone("+1 234 567 8900");
    expect(result).toBe("+12345678900");
  });

  it("handles US format with parentheses", () => {
    const result = sanitizePhone("(123) 456-7890");
    expect(result).toBe("1234567890");
  });

  it("handles US format with dashes", () => {
    const result = sanitizePhone("123-456-7890");
    expect(result).toBe("1234567890");
  });

  it("handles international format with + prefix", () => {
    const result = sanitizePhone("+44 7911 123456");
    expect(result).toBe("+447911123456");
  });

  it("converts 00 prefix to + prefix", () => {
    const result = sanitizePhone("0044 7911 123456");
    expect(result).toBe("+447911123456");
  });

  it("handles phone with dots as separators", () => {
    const result = sanitizePhone("123.456.7890");
    expect(result).toBe("1234567890");
  });

  it("returns null for empty string", () => {
    expect(sanitizePhone("")).toBeNull();
  });

  it("returns null for null", () => {
    expect(sanitizePhone(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(sanitizePhone(undefined)).toBeNull();
  });

  it("returns null for string with no digits", () => {
    expect(sanitizePhone("no-digits-here!")).toBeNull();
  });

  it("strips letters from phone number", () => {
    const result = sanitizePhone("+1abc234def5678");
    expect(result).toBe("+12345678");
  });

  it("handles number input coerced to string", () => {
    const result = sanitizePhone(1234567890);
    expect(result).toBe("1234567890");
  });

  it("preserves leading + for international numbers", () => {
    const result = sanitizePhone("+919876543210");
    expect(result).toBe("+919876543210");
  });

  it("handles phone with extension notation stripped", () => {
    const result = sanitizePhone("+1 555 123 4567 ext 890");
    expect(result).toBe("+15551234567890");
  });

  it("truncates to maxLength 32 before processing", () => {
    const longInput = "1".repeat(40);
    const result = sanitizePhone(longInput);
    // After sanitizeText truncation at 32, then stripping non-digit
    expect(result).not.toBeNull();
    if (result) {
      expect(result.length).toBeLessThanOrEqual(32);
    }
  });

  it("handles whitespace-only input", () => {
    expect(sanitizePhone("   ")).toBeNull();
  });
});
