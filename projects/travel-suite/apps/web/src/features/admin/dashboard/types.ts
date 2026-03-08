export interface AdminFunnelStage {
  key: string;
  label: string;
  count: number;
  conversionRate: number | null;
}

export interface AdminLtvCustomer {
  key: string;
  customerName: string;
  customerEmail: string | null;
  bookings: number;
  ltvInr: number;
}

export interface AdminDestinationMetric {
  destination: string;
  count: number;
}
