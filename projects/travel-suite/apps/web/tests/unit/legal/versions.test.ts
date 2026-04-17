import { describe, expect, it } from "vitest";
import {
    GATED_DOCUMENTS,
    LEGAL_DOCUMENT_TYPES,
    LEGAL_VERSIONS,
    isCurrentVersion,
    type LegalDocumentType,
} from "@/lib/legal/versions";

describe("LEGAL_VERSIONS", () => {
    it("has a non-empty semver-compatible string for every document type", () => {
        for (const type of LEGAL_DOCUMENT_TYPES) {
            const version = LEGAL_VERSIONS[type];
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        }
    });

    it("has exactly the expected document types", () => {
        const expected: LegalDocumentType[] = [
            "terms",
            "privacy",
            "refund",
            "cancellation",
            "aup",
            "dpa",
            "grievance",
        ];
        expect([...LEGAL_DOCUMENT_TYPES].sort()).toEqual(expected.sort());
    });
});

describe("GATED_DOCUMENTS", () => {
    it("includes terms and privacy", () => {
        expect(GATED_DOCUMENTS).toContain("terms");
        expect(GATED_DOCUMENTS).toContain("privacy");
    });

    it("is a subset of LEGAL_DOCUMENT_TYPES", () => {
        for (const doc of GATED_DOCUMENTS) {
            expect(LEGAL_DOCUMENT_TYPES).toContain(doc);
        }
    });
});

describe("isCurrentVersion", () => {
    it("returns true when version matches current", () => {
        expect(isCurrentVersion("terms", LEGAL_VERSIONS.terms)).toBe(true);
        expect(isCurrentVersion("privacy", LEGAL_VERSIONS.privacy)).toBe(true);
    });

    it("returns false for a stale version string", () => {
        expect(isCurrentVersion("terms", "0.9.0")).toBe(false);
        expect(isCurrentVersion("privacy", "0.9.0")).toBe(false);
    });

    it("returns false for null", () => {
        expect(isCurrentVersion("terms", null)).toBe(false);
    });

    it("returns false for undefined", () => {
        expect(isCurrentVersion("terms", undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(isCurrentVersion("terms", "")).toBe(false);
    });

    it("performs exact equality — whitespace variant is rejected", () => {
        expect(isCurrentVersion("terms", ` ${LEGAL_VERSIONS.terms} `)).toBe(false);
    });
});
