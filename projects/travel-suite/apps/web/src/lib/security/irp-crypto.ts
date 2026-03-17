import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEV_EPHEMERAL_KEY = randomBytes(32).toString("hex");

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

function getIRPEncryptionKey(): Buffer {
  const configured = process.env.IRP_ENCRYPTION_KEY?.trim();
  if (configured) {
    return parseKeyFromEnvironment(configured);
  }

  if (isProductionRuntime()) {
    throw new Error("IRP_ENCRYPTION_KEY is required in production");
  }

  return createHash("sha256").update(DEV_EPHEMERAL_KEY).digest();
}

export function isEncryptedCredential(value: string | null | undefined): boolean {
  const token = (value || "").trim();
  return token.startsWith(`${TOKEN_PREFIX}.`);
}

export function encryptIRPCredential(plainText: string): string {
  const text = (plainText || "").trim();
  if (!text) {
    throw new Error("Cannot encrypt empty credential");
  }

  if (isEncryptedCredential(text)) {
    return text;
  }

  const key = getIRPEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER_ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${TOKEN_PREFIX}.${encodeBase64Url(iv)}.${encodeBase64Url(authTag)}.${encodeBase64Url(ciphertext)}`;
}

export function decryptIRPCredential(storedValue: string): string {
  const text = (storedValue || "").trim();
  if (!text) {
    throw new Error("Cannot decrypt empty credential");
  }

  if (!isEncryptedCredential(text)) {
    return text;
  }

  const [prefix, ivEncoded, tagEncoded, payloadEncoded, extra] = text.split(".");
  if (prefix !== TOKEN_PREFIX || !ivEncoded || !tagEncoded || !payloadEncoded || extra) {
    throw new Error("Invalid encrypted credential format");
  }

  const key = getIRPEncryptionKey();
  const iv = decodeBase64Url(ivEncoded);
  const authTag = decodeBase64Url(tagEncoded);
  const payload = decodeBase64Url(payloadEncoded);

  const decipher = createDecipheriv(CIPHER_ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
  return decrypted.toString("utf8");
}
