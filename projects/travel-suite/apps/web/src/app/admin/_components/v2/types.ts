import type { AdminDateRangeSelection } from "@/lib/admin/date-range";
import type { DashboardOverview } from "@/lib/admin/dashboard-overview-types";

export type DashboardPhase = "loading" | "ready" | "error";

export interface DashboardV2State {
  phase: DashboardPhase;
  overview: DashboardOverview | null;
  error: string | null;
  dateRange: AdminDateRangeSelection;
  setDateRange: (range: AdminDateRangeSelection) => void;
}

export type { DashboardOverview };
