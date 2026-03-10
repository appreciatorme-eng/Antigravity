// social-token-crypto.test.ts
// Tests for encryptSocialToken, decryptSocialToken, isEncryptedSocialToken, decodeSocialTokenWithMigration

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  encryptSocialToken,
  decryptSocialToken,
  isEncryptedSocialToken,
  decodeSocialTokenWithMigration,
} from "@/lib/security/social-token-crypto";

const TEST_KEY_HEX = "a".repeat(64); // 64-char hex = 32 bytes

describe("social-token-crypto", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = TEST_KEY_HEX;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = originalKey;
    }
  });

  describe("encryptSocialToken", () => {
    it("returns a string starting with v1. prefix", () => {
      const result = encryptSocialToken("my-secret-token");
      expect(result.startsWith("v1.")).toBe(true);
    });

    it("produces output with exactly 4 dot-separated segments", () => {
      const result = encryptSocialToken("test-token");
      const parts = result.split(".");
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe("v1");
    });

    it("throws on empty string input", () => {
      expect(() => encryptSocialToken("")).toThrow("Cannot encrypt empty social token");
    });

    it("throws on whitespace-only input", () => {
      expect(() => encryptSocialToken("   ")).toThrow("Cannot encrypt empty social token");
    });

    it("returns the same value if input is already encrypted (idempotent)", () => {
      const encrypted = encryptSocialToken("original-token");
      const doubleEncrypted = encryptSocialToken(encrypted);
      expect(doubleEncrypted).toBe(encrypted);
    });

    it("produces different ciphertexts for different plaintexts", () => {
      const enc1 = encryptSocialToken("token-alpha");
      const enc2 = encryptSocialToken("token-beta");
      expect(enc1).not.toBe(enc2);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", () => {
      const enc1 = encryptSocialToken("same-token");
      const enc2 = encryptSocialToken("same-token");
      // Due to random IV, outputs should differ
      expect(enc1).not.toBe(enc2);
    });

    it("handles long token strings", () => {
      const longToken = "x".repeat(5000);
      const encrypted = encryptSocialToken(longToken);
      expect(encrypted.startsWith("v1.")).toBe(true);
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe(longToken);
    });

    it("handles unicode in token strings", () => {
      const unicodeToken = "token-with-emoji-and-kanji-test";
      const encrypted = encryptSocialToken(unicodeToken);
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe(unicodeToken);
    });

    it("handles special characters in tokens", () => {
      const specialToken = "abc!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = encryptSocialToken(specialToken);
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe(specialToken);
    });
  });

  describe("decryptSocialToken", () => {
    it("round-trip: encrypt then decrypt returns original plaintext", () => {
      const original = "my-oauth-access-token-12345";
      const encrypted = encryptSocialToken(original);
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it("returns unencrypted tokens as-is (pass-through for migration)", () => {
      const plainToken = "not-encrypted-token";
      const result = decryptSocialToken(plainToken);
      expect(result).toBe(plainToken);
    });

    it("throws on empty string input", () => {
      expect(() => decryptSocialToken("")).toThrow("Cannot decrypt empty social token");
    });

    it("throws on whitespace-only input", () => {
      expect(() => decryptSocialToken("   ")).toThrow("Cannot decrypt empty social token");
    });

    it("throws on invalid encrypted format (wrong number of segments)", () => {
      expect(() => decryptSocialToken("v1.only-two-parts")).toThrow(
        "Invalid encrypted social token format"
      );
    });

    it("throws on tampered ciphertext (auth tag mismatch)", () => {
      const encrypted = encryptSocialToken("valid-token");
      const parts = encrypted.split(".");
      // Tamper with the payload
      parts[3] = "AAAA" + parts[3].slice(4);
      const tampered = parts.join(".");
      expect(() => decryptSocialToken(tampered)).toThrow();
    });

    it("throws on tampered auth tag", () => {
      const encrypted = encryptSocialToken("valid-token");
      const parts = encrypted.split(".");
      // Tamper with the auth tag
      parts[2] = "ZZZZ" + parts[2].slice(4);
      const tampered = parts.join(".");
      expect(() => decryptSocialToken(tampered)).toThrow();
    });

    it("throws on truncated ciphertext", () => {
      const encrypted = encryptSocialToken("valid-token");
      const truncated = encrypted.slice(0, encrypted.length - 10);
      expect(() => decryptSocialToken(truncated)).toThrow();
    });

    it("throws if extra segments are appended", () => {
      const encrypted = encryptSocialToken("valid-token");
      const withExtra = encrypted + ".extra-segment";
      expect(() => decryptSocialToken(withExtra)).toThrow(
        "Invalid encrypted social token format"
      );
    });

    it("handles token with newline characters", () => {
      const token = "line1\nline2\nline3";
      const encrypted = encryptSocialToken(token);
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe(token);
    });
  });

  describe("isEncryptedSocialToken", () => {
    it("returns true for properly encrypted tokens", () => {
      const encrypted = encryptSocialToken("test");
      expect(isEncryptedSocialToken(encrypted)).toBe(true);
    });

    it("returns false for plain text tokens", () => {
      expect(isEncryptedSocialToken("just-a-plain-token")).toBe(false);
    });

    it("returns false for null", () => {
      expect(isEncryptedSocialToken(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isEncryptedSocialToken(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isEncryptedSocialToken("")).toBe(false);
    });

    it("returns true for any string starting with v1.", () => {
      expect(isEncryptedSocialToken("v1.something")).toBe(true);
    });

    it("returns false for string starting with v2.", () => {
      expect(isEncryptedSocialToken("v2.something")).toBe(false);
    });
  });

  describe("decodeSocialTokenWithMigration", () => {
    it("returns needsMigration=false for encrypted tokens", () => {
      const encrypted = encryptSocialToken("my-token");
      const result = decodeSocialTokenWithMigration(encrypted);
      expect(result.token).toBe("my-token");
      expect(result.needsMigration).toBe(false);
    });

    it("returns needsMigration=true for plain text tokens", () => {
      const result = decodeSocialTokenWithMigration("plain-token");
      expect(result.token).toBe("plain-token");
      expect(result.needsMigration).toBe(true);
    });

    it("decrypts correctly and reports migration status", () => {
      const encrypted = encryptSocialToken("secret-value");
      const result = decodeSocialTokenWithMigration(encrypted);
      expect(result).toEqual({
        token: "secret-value",
        needsMigration: false,
      });
    });
  });

  describe("key format handling", () => {
    it("works with hex: prefixed key", () => {
      process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = "hex:" + "b".repeat(64);
      const encrypted = encryptSocialToken("hex-key-token");
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe("hex-key-token");
    });

    it("works with raw 64-char hex key", () => {
      process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = "c".repeat(64);
      const encrypted = encryptSocialToken("raw-hex-token");
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe("raw-hex-token");
    });

    it("falls back to SHA-256 hash for non-standard key formats", () => {
      process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = "my-arbitrary-passphrase";
      const encrypted = encryptSocialToken("passphrase-token");
      const decrypted = decryptSocialToken(encrypted);
      expect(decrypted).toBe("passphrase-token");
    });
  });
});
