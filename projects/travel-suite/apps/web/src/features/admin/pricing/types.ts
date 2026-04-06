export const SERVICE_CATEGORIES = [
  "hotels", "vehicle", "flights", "visa", "insurance", "train", "bus", "other",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hotels: "Hotels",
  vehicle: "Vehicle",
  flights: "Flights",
  visa: "Visa",
  insurance: "Insurance",
  train: "Train",
  bus: "Bus",
  other: "Other",
};

export const OVERHEAD_SUGGESTIONS = [
  "CA Fees", "Wages", "Marketing", "Rent", "GST", "TCS", "Miscellaneous",
] as const;

export interface TripServiceCost {
  id: string;
  organization_id: string;
  trip_id: string;
  category: ServiceCategory;
  vendor_name: string | null;
  description: string | null;
  pax_count: number;
  cost_amount: number;
  price_amount: number;
  commission_pct: number;
  commission_amount: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyOverheadExpense {
  id: string;
  organization_id: string;
  month_start: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingDashboardKpis {
  totalInvestment: number;
  totalRevenue: number;
  grossProfit: number;
  totalOverhead: number;
  netProfit: number;
  marginPct: number;
  tripCount: number;
  avgProfitPerTrip: number;
  totalCommission: number;
  totalGst: number;
  totalTcs: number;
}

export interface CategoryBreakdown {
  category: ServiceCategory;
  totalCost: number;
  totalPrice: number;
  profit: number;
}

export interface TopProfitableTrip {
  tripId: string;
  tripTitle: string;
  destination: string | null;
  profit: number;
  paxCount: number;
  revenue: number;
  cost: number;
}

export interface MonthlyTrendPoint {
  month: string;
  grossProfit: number;
  netProfit: number;
  revenue: number;
}

export interface DestinationProfitability {
  destination: string;
  revenue: number;
  cost: number;
  profit: number;
  tripCount: number;
  avgMargin: number;
}

export interface ClientProfitability {
  clientId: string;
  clientName: string;
  revenue: number;
  cost: number;
  profit: number;
  tripCount: number;
  avgMargin: number;
}

export interface PricingDashboardData {
  kpis: PricingDashboardKpis;
  categoryBreakdown: CategoryBreakdown[];
  topProfitableTrips: TopProfitableTrip[];
  bottomProfitableTrips: TopProfitableTrip[];
  monthlyTrend: MonthlyTrendPoint[];
  topDestinations: DestinationProfitability[];
  bottomDestinations: DestinationProfitability[];
  topClients: ClientProfitability[];
  bottomClients: ClientProfitability[];
}

export interface TripWithCosts {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  pax_count: number;
  client_name: string | null;
  costs: TripServiceCost[];
  totalCost: number;
  totalPrice: number;
  profit: number;
  totalCommission: number;
  gstPct: number;
  tcsPct: number;
  gstAmount: number;
  tcsAmount: number;
}

export interface VendorHistoryItem {
  vendor_name: string;
  category: ServiceCategory;
  cost_amount: number;
  trip_title: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  trip_id: string;
  trip_name: string;
  destination: string | null;
  client_name: string | null;
  start_date: string | null;
  pax_count: number;
  category: ServiceCategory;
  vendor_name: string | null;
  description: string | null;
  cost_amount: number;
  price_amount: number;
  commission_pct: number;
  commission_amount: number;
  profit: number;
  margin_pct: number;
  currency: string;
  notes: string | null;
  created_at: string;
}

export interface TransactionSummary {
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  totalCommission: number;
  count: number;
}

export type TransactionSort = "date" | "profit" | "cost" | "price";

export interface TransactionFilters {
  search: string;
  category: ServiceCategory | "all";
  vendor: string;
  sort: TransactionSort;
  month?: string; // YYYY-MM — when set, ledger is scoped to that month
}

export interface ReceiptOcrResult {
  amount: number;
  currency: string;
  confidence: number;
  raw_response: string;
}

export interface ExpenseReceipt {
  id: string;
  organization_id: string;
  trip_service_cost_id: string | null;
  receipt_url: string;
  ocr_extracted_amount: number | null;
  ocr_confidence: number | null;
  ocr_raw_response: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
