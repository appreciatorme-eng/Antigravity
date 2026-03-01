import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "v1";
const CIPHER_ALGO = "aes-256-gcm";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function encodeBase64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

function parseKeyFromEnvironment(raw: string): Buffer {
  const value = raw.trim();

  if (value.startsWith("hex:")) {
    const decoded = Buffer.from(value.slice(4), "hex");
    if (decoded.length === 32) return decoded;
  }

  if (value.startsWith("base64:")) {
    const decoded = Buffer.from(value.slice(7), "base64");
    if (decoded.length === 32) return decoded;
  }

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    const decoded = Buffer.from(value, "hex");
    if (decoded.length === 32) return decoded;
  }

  const base64Attempt = Buffer.from(value, "base64");
  if (base64Attempt.length === 32) {
    return base64Attempt;
  }

  return createHash("sha256").update(value).digest();
}

function getTokenEncryptionKey(): Buffer {
  const configured = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();
  if (configured) {
    return parseKeyFromEnvironment(configured);
  }

  if (isProductionRuntime()) {
    throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY is required in production");
  }

  const devFallback = process.env.META_APP_SECRET?.trim() || "dev-social-token-encryption-key";
  return createHash("sha256").update(devFallback).digest();
}

export function isEncryptedSocialToken(value: string | null | undefined): boolean {
  const token = (value || "").trim();
  return token.startsWith(`${TOKEN_PREFIX}.`);
}

export function encryptSocialToken(plainToken: string): string {
  const token = (plainToken || "").trim();
  if (!token) {
    throw new Error("Cannot encrypt empty social token");
  }

  if (isEncryptedSocialToken(token)) {
    return token;
  }

  const key = getTokenEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER_ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${TOKEN_PREFIX}.${encodeBase64Url(iv)}.${encodeBase64Url(authTag)}.${encodeBase64Url(ciphertext)}`;
}

export function decryptSocialToken(storedValue: string): string {
  const token = (storedValue || "").trim();
  if (!token) {
    throw new Error("Cannot decrypt empty social token");
  }

  if (!isEncryptedSocialToken(token)) {
    return token;
  }

  const [prefix, ivEncoded, tagEncoded, payloadEncoded, extra] = token.split(".");
  if (prefix !== TOKEN_PREFIX || !ivEncoded || !tagEncoded || !payloadEncoded || extra) {
    throw new Error("Invalid encrypted social token format");
  }

  const key = getTokenEncryptionKey();
  const iv = decodeBase64Url(ivEncoded);
  const authTag = decodeBase64Url(tagEncoded);
  const payload = decodeBase64Url(payloadEncoded);

  const decipher = createDecipheriv(CIPHER_ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
  return decrypted.toString("utf8");
}

export function decodeSocialTokenWithMigration(
  storedValue: string
): { token: string; needsMigration: boolean } {
  const token = decryptSocialToken(storedValue);
  return {
    token,
    needsMigration: !isEncryptedSocialToken(storedValue),
  };
}
