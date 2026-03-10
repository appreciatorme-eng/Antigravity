import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createSocialOAuthState,
  consumeSocialOAuthState,
} from "../../../src/lib/security/social-oauth-state";

const TEST_SECRET = "test-oauth-state-secret-at-least-32-chars-long";

let originalSecret: string | undefined;

beforeAll(() => {
  originalSecret = process.env.SOCIAL_OAUTH_STATE_SECRET;
  process.env.SOCIAL_OAUTH_STATE_SECRET = TEST_SECRET;
});

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.SOCIAL_OAUTH_STATE_SECRET;
  } else {
    process.env.SOCIAL_OAUTH_STATE_SECRET = originalSecret;
  }
});

describe("createSocialOAuthState", () => {
  it("generates a non-empty string", () => {
    const state = createSocialOAuthState("user-123");
    expect(state).toBeTruthy();
    expect(typeof state).toBe("string");
    expect(state.length).toBeGreaterThan(0);
  });

  it("produces a string containing a dot separator (payload.signature)", () => {
    const state = createSocialOAuthState("user-456");
    const parts = state.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0]!.length).toBeGreaterThan(0);
    expect(parts[1]!.length).toBeGreaterThan(0);
  });

  it("produces different states for different userIds", () => {
    const stateA = createSocialOAuthState("user-aaa");
    const stateB = createSocialOAuthState("user-bbb");
    expect(stateA).not.toBe(stateB);
  });

  it("produces different states for the same userId (nonce uniqueness)", () => {
    const stateA = createSocialOAuthState("same-user");
    const stateB = createSocialOAuthState("same-user");
    expect(stateA).not.toBe(stateB);
  });

  it("state is not the same as the raw userId", () => {
    const userId = "user-raw-check";
    const state = createSocialOAuthState(userId);
    expect(state).not.toBe(userId);
    expect(state).not.toContain(userId);
  });
});

describe("consumeSocialOAuthState", () => {
  it("returns the correct userId for a valid state", async () => {
    const userId = "user-valid-789";
    const state = createSocialOAuthState(userId);
    const result = await consumeSocialOAuthState(state);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe(userId);
    }
  });

  it("rejects expired states", async () => {
    const state = createSocialOAuthState("user-expired");
    // Wait 5ms so timestamp diff exceeds maxAgeMs=1
    await new Promise((resolve) => setTimeout(resolve, 5));
    const result = await consumeSocialOAuthState(state, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_expired");
    }
  });

  it("rejects tampered payload", async () => {
    const state = createSocialOAuthState("user-tamper");
    const [payload, signature] = state.split(".");
    // Flip one character in the payload
    const tamperedPayload =
      payload!.slice(0, -1) + (payload!.at(-1) === "A" ? "B" : "A");
    const tampered = `${tamperedPayload}.${signature}`;

    const result = await consumeSocialOAuthState(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_signature_invalid");
    }
  });

  it("rejects tampered signature", async () => {
    const state = createSocialOAuthState("user-sig-tamper");
    const [payload, signature] = state.split(".");
    const tamperedSig =
      signature!.slice(0, -1) + (signature!.at(-1) === "a" ? "b" : "a");
    const tampered = `${payload}.${tamperedSig}`;

    const result = await consumeSocialOAuthState(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_signature_invalid");
    }
  });

  it("rejects empty string", async () => {
    const result = await consumeSocialOAuthState("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_malformed");
    }
  });

  it("rejects null-ish values", async () => {
    const result = await consumeSocialOAuthState(
      null as unknown as string
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_malformed");
    }
  });

  it("rejects undefined values", async () => {
    const result = await consumeSocialOAuthState(
      undefined as unknown as string
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_malformed");
    }
  });

  it("rejects random garbage strings", async () => {
    const result = await consumeSocialOAuthState("not-a-valid-state-at-all");
    expect(result.ok).toBe(false);
  });

  it("rejects state with extra dot segments", async () => {
    const state = createSocialOAuthState("user-extra-dots");
    const tampered = `${state}.extra`;

    const result = await consumeSocialOAuthState(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("state_malformed");
    }
  });

  it("rejects replayed state (nonce consumed)", async () => {
    const state = createSocialOAuthState("user-replay");

    const first = await consumeSocialOAuthState(state);
    expect(first.ok).toBe(true);

    const second = await consumeSocialOAuthState(state);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe("state_replayed");
    }
  });

  it("rejects when SOCIAL_OAUTH_STATE_SECRET is missing", async () => {
    const saved = process.env.SOCIAL_OAUTH_STATE_SECRET;
    delete process.env.SOCIAL_OAUTH_STATE_SECRET;

    try {
      const result = await consumeSocialOAuthState("anything.here");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("state_secret_missing");
      }
    } finally {
      process.env.SOCIAL_OAUTH_STATE_SECRET = saved;
    }
  });

  it("createSocialOAuthState throws when secret is missing", () => {
    const saved = process.env.SOCIAL_OAUTH_STATE_SECRET;
    delete process.env.SOCIAL_OAUTH_STATE_SECRET;

    try {
      expect(() => createSocialOAuthState("user-no-secret")).toThrow(
        /SOCIAL_OAUTH_STATE_SECRET/
      );
    } finally {
      process.env.SOCIAL_OAUTH_STATE_SECRET = saved;
    }
  });
});
