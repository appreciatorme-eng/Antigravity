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

export interface PricingDashboardData {
  kpis: PricingDashboardKpis;
  categoryBreakdown: CategoryBreakdown[];
  topProfitableTrips: TopProfitableTrip[];
  monthlyTrend: MonthlyTrendPoint[];
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
}

export interface VendorHistoryItem {
  vendor_name: string;
  category: ServiceCategory;
  cost_amount: number;
  trip_title: string;
  created_at: string;
}
