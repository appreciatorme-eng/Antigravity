export type SanitizeTextOptions = {
  maxLength?: number;
  preserveNewlines?: boolean;
};

export function sanitizeText(
  value: unknown,
  options: SanitizeTextOptions = {}
): string {
  const maxLength = options.maxLength ?? 200;
  const preserveNewlines = options.preserveNewlines === true;

  if (value === null || value === undefined) return "";

  let text = String(value);
  if (!preserveNewlines) {
    text = text.replace(/[\r\n\t]+/g, " ");
  }

  text = text.replace(/[\u0000-\u001F\u007F]/g, "");
  text = text.trim();

  if (maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }

  return text;
}

export function sanitizeEmail(value: unknown): string | null {
  const email = sanitizeText(value, { maxLength: 320 }).toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function sanitizePhone(value: unknown): string | null {
  const raw = sanitizeText(value, { maxLength: 32 });
  if (!raw) return null;

  let normalized = raw.replace(/[^\d+]/g, "");
  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  const hasPlus = normalized.startsWith("+");
  const digits = normalized.replace(/\D/g, "");
  if (!digits) return null;

  return hasPlus ? `+${digits}` : digits;
}
