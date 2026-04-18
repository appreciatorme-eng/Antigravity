import { describe, expect, it } from "vitest";
import { buildGodDataQuality, detectEmptyDrillthrough, pickGodKpiContracts } from "@/lib/platform/god-kpi";

describe("god-kpi helpers", () => {
  it("builds exact-live data quality envelope", () => {
    const meta = buildGodDataQuality(["profiles", "organizations"]);
    expect(meta.mode).toBe("exact_live");
    expect(meta.sampled).toBe(false);
    expect(meta.estimated).toBe(false);
    expect(meta.completeness).toBe("complete");
    expect(meta.source).toEqual(["profiles", "organizations"]);
    expect(meta.notes).toEqual([]);
    expect(typeof meta.as_of).toBe("string");
  });

  it("returns warning when KPI is positive but drill-through first page is empty", () => {
    const warning = detectEmptyDrillthrough({
      kpiId: "signups_in_range",
      label: "Signups",
      total: 19,
      rows: 0,
      page: 0,
      filtersApplied: false,
    });
    expect(warning).not.toBeNull();
    expect(warning?.code).toBe("DRILLTHROUGH_EMPTY_WITH_POSITIVE_KPI");
  });

  it("suppresses warning on filtered or non-first-page views", () => {
    const filteredWarning = detectEmptyDrillthrough({
      kpiId: "signups_in_range",
      label: "Signups",
      total: 19,
      rows: 0,
      page: 0,
      filtersApplied: true,
    });
    const laterPageWarning = detectEmptyDrillthrough({
      kpiId: "signups_in_range",
      label: "Signups",
      total: 19,
      rows: 0,
      page: 2,
      filtersApplied: false,
    });

    expect(filteredWarning).toBeNull();
    expect(laterPageWarning).toBeNull();
  });

  it("returns only known KPI contracts", () => {
    const contracts = pickGodKpiContracts(["total_users", "unknown", "notification_pending"]);
    expect(contracts.map((contract) => contract.id)).toEqual(["total_users", "notification_pending"]);
  });
});
