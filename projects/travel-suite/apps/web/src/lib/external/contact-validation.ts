import { fetchWithRetry } from "@/lib/network/retry";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const KickboxDisposableSchema = z.object({
  disposable: z.boolean().optional(),
});

const VeriphoneSchema = z.object({
  phone: z.string().optional(),
  phone_valid: z.boolean().optional(),
  international_number: z.string().optional(),
  carrier: z.string().optional(),
  phone_region: z.string().optional(),
  country: z.string().optional(),
});

export interface ContactValidationResult {
  normalizedPhone: string | null;
  emailWarnings: string[];
  phoneWarnings: string[];
  emailMeta: {
    checkedDisposable: boolean;
    disposable: boolean | null;
  };
  phoneMeta: {
    checkedRemote: boolean;
    valid: boolean | null;
    internationalNumber: string | null;
    carrier: string | null;
    region: string | null;
    country: string | null;
  };
}

async function checkDisposableEmail(email: string): Promise<boolean | null> {
  try {
    const response = await fetchWithRetry(
      `https://open.kickbox.com/v1/disposable/${encodeURIComponent(email)}`,
      undefined,
      { retries: 1, timeoutMs: 4000 },
    );
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const parsed = KickboxDisposableSchema.safeParse(payload);
    return parsed.success ? parsed.data.disposable ?? null : null;
  } catch (error) {
    logError("[contact-validation] Disposable email check failed", error);
    return null;
  }
}

async function verifyPhoneRemotely(phone: string): Promise<z.infer<typeof VeriphoneSchema> | null> {
  const apiKey = process.env.VERIPHONE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetchWithRetry(
      `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(phone)}&key=${encodeURIComponent(apiKey)}`,
      undefined,
      { retries: 1, timeoutMs: 5000 },
    );
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const parsed = VeriphoneSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    logError("[contact-validation] Phone verification failed", error);
    return null;
  }
}

export async function validateContactInfo(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<ContactValidationResult> {
  const email = input.email?.trim().toLowerCase() || "";
  const phone = input.phone?.trim() || "";
  const normalizedPhone = phone ? phone.replace(/\D/g, "") : null;

  const emailWarnings: string[] = [];
  const phoneWarnings: string[] = [];

  if (email && !EMAIL_REGEX.test(email)) {
    emailWarnings.push("Email format looks invalid.");
  }

  if (normalizedPhone && (normalizedPhone.length < 8 || normalizedPhone.length > 15)) {
    phoneWarnings.push("Phone number length looks invalid.");
  }

  const [disposable, remotePhone] = await Promise.all([
    email && EMAIL_REGEX.test(email) ? checkDisposableEmail(email) : Promise.resolve(null),
    normalizedPhone ? verifyPhoneRemotely(phone || normalizedPhone) : Promise.resolve(null),
  ]);

  if (disposable) {
    emailWarnings.push("Disposable email detected. Use a primary inbox for traveler communication.");
  }

  if (remotePhone?.phone_valid === false) {
    phoneWarnings.push("Phone number could not be verified.");
  }

  return {
    normalizedPhone,
    emailWarnings,
    phoneWarnings,
    emailMeta: {
      checkedDisposable: disposable !== null,
      disposable,
    },
    phoneMeta: {
      checkedRemote: remotePhone !== null,
      valid: remotePhone?.phone_valid ?? null,
      internationalNumber: remotePhone?.international_number ?? null,
      carrier: remotePhone?.carrier ?? null,
      region: remotePhone?.phone_region ?? null,
      country: remotePhone?.country ?? null,
    },
  };
}
