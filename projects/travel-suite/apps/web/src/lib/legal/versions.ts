/**
 * Current versions of every legal document shown at signup / re-acceptance.
 *
 * When a document is revised, bump its version here AND seed a new row in
 * `legal_documents` (via migration) with `is_current = true` and mark the
 * previous version `is_current = false`. The middleware / signup API then
 * force re-acceptance for users whose profile has a stale version.
 *
 * Versions use plain semver-compatible strings; numeric ordering is NOT
 * assumed — equality is the only comparison we perform.
 */

export const LEGAL_VERSIONS = {
    terms: "1.0.0",
    privacy: "1.0.0",
    refund: "1.0.0",
    cancellation: "1.0.0",
    aup: "1.0.0",
    dpa: "1.0.0",
    grievance: "1.0.0",
} as const;

export type LegalDocumentType = keyof typeof LEGAL_VERSIONS;

export const LEGAL_DOCUMENT_TYPES: readonly LegalDocumentType[] = [
    "terms",
    "privacy",
    "refund",
    "cancellation",
    "aup",
    "dpa",
    "grievance",
] as const;

/**
 * Returns true iff the given user-stamped version matches the current
 * published version for that document type. Used by middleware to decide
 * whether to force re-acceptance.
 */
export function isCurrentVersion(
    type: LegalDocumentType,
    userVersion: string | null | undefined,
): boolean {
    if (!userVersion) return false;
    return LEGAL_VERSIONS[type] === userVersion;
}

/** Documents that MUST be re-accepted if their version changes. */
export const GATED_DOCUMENTS: readonly LegalDocumentType[] = [
    "terms",
    "privacy",
] as const;
