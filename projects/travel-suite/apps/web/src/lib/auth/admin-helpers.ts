export type AdminRole = "admin" | "super_admin";

const ANON_AUTH_FAILURE_SAMPLE_RATE = 0.2;

export function normalizeBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

export function parseRole(input: string | null): AdminRole | null {
  const role = (input || "").toLowerCase();
  if (role === "admin") return "admin";
  if (role === "super_admin") return "super_admin";
  return null;
}

export function shouldRecordAuthFailure(params: {
  userId?: string | null;
  reason: string;
}): boolean {
  if (params.userId) return true;
  if (params.reason !== "missing_or_invalid_auth") return true;
  return Math.random() < ANON_AUTH_FAILURE_SAMPLE_RATE;
}
