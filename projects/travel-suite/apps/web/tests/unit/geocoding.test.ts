import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  geocodeLocation,
  batchGeocodeLocations,
  getCityCenter,
  clearGeocodeCache,
} from "@/lib/geocoding";

describe("geocoding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    clearGeocodeCache();
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test_mapbox_token";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  });

  // ── geocodeLocation ───────────────────────────────────────────────

  describe("geocodeLocation", () => {
    it("should geocode an address to coordinates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [
              {
                center: [80.2707, 13.0827],
                place_name: "Marina Beach, Chennai, Tamil Nadu, India",
              },
            ],
          }),
      });

      const result = await geocodeLocation("Marina Beach, Chennai");

      expect(result).toEqual({
        coordinates: { lat: 13.0827, lng: 80.2707 },
        formattedAddress: "Marina Beach, Chennai, Tamil Nadu, India",
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("api.mapbox.com/geocoding/v5/mapbox.places/");
      expect(url).toContain("Marina%20Beach%2C%20Chennai");
      expect(url).toContain("access_token=pk.test_mapbox_token");
    });

    it("should return null for empty location string", async () => {
      expect(await geocodeLocation("")).toBeNull();
      expect(await geocodeLocation("   ")).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return null when Mapbox token is missing", async () => {
      delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      const result = await geocodeLocation("Chennai");

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return null when Mapbox API returns non-OK status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await geocodeLocation("Chennai");

      expect(result).toBeNull();
    });

    it("should return null when no features are found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ features: [] }),
      });

      const result = await geocodeLocation("xyznonexistent12345");

      expect(result).toBeNull();
    });

    it("should return null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("DNS resolution failed"));

      const result = await geocodeLocation("Chennai");

      expect(result).toBeNull();
    });

    it("should add proximity parameter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [{ center: [80.27, 13.08], place_name: "Chennai" }],
          }),
      });

      await geocodeLocation("Beach Road", [80.27, 13.08]);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("proximity=80.27,13.08");
    });

    // ── Cache behavior ──────────────────────────────────────────────

    it("should return cached result on subsequent calls", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [{ center: [80.27, 13.08], place_name: "Chennai" }],
          }),
      });

      const first = await geocodeLocation("Chennai");
      const second = await geocodeLocation("Chennai");

      expect(first).toEqual(second);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call
    });

    it("should expire cache entries after TTL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [{ center: [80.27, 13.08], place_name: "Chennai" }],
          }),
      });

      await geocodeLocation("Chennai");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance past 24-hour TTL
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      await geocodeLocation("Chennai");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should treat different proximity values as different cache keys", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [{ center: [80.27, 13.08], place_name: "Result" }],
          }),
      });

      await geocodeLocation("Beach", [80.27, 13.08]);
      await geocodeLocation("Beach", [77.59, 12.97]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ── batchGeocodeLocations ─────────────────────────────────────────

  describe("batchGeocodeLocations", () => {
    it("should geocode multiple locations and return results in order", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              features: [{ center: [80.27, 13.08], place_name: "Chennai" }],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              features: [{ center: [72.87, 19.07], place_name: "Mumbai" }],
            }),
        });

      const promise = batchGeocodeLocations(["Chennai", "Mumbai"]);
      // Advance past delays between requests
      await vi.advanceTimersByTimeAsync(500);
      const results = await promise;

      expect(results).toHaveLength(2);
      expect(results[0]?.coordinates.lat).toBeCloseTo(13.08);
      expect(results[1]?.coordinates.lat).toBeCloseTo(19.07);
    });

    it("should return null for failed geocoding within batch", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              features: [{ center: [80.27, 13.08], place_name: "Chennai" }],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ features: [] }),
        });

      const promise = batchGeocodeLocations(["Chennai", "NowhereVille"]);
      await vi.advanceTimersByTimeAsync(500);
      const results = await promise;

      expect(results[0]).not.toBeNull();
      expect(results[1]).toBeNull();
    });
  });

  // ── getCityCenter ─────────────────────────────────────────────────

  describe("getCityCenter", () => {
    it("should return [lng, lat] tuple for a valid city", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [{ center: [80.27, 13.08], place_name: "Chennai" }],
          }),
      });

      const result = await getCityCenter("Chennai");

      expect(result).toEqual([80.27, 13.08]);
    });

    it("should return null for unresolvable city", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ features: [] }),
      });

      const result = await getCityCenter("NonexistentCity");

      expect(result).toBeNull();
    });
  });
});
