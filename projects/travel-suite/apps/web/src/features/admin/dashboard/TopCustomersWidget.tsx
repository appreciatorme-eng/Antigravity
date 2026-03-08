"use client";

import { Crown } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { AdminLtvCustomer } from "@/features/admin/dashboard/types";

interface TopCustomersWidgetProps {
  customers: AdminLtvCustomer[];
  loading?: boolean;
}

function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function TopCustomersWidget({ customers, loading = false }: TopCustomersWidgetProps) {
  return (
    <GlassCard padding="xl" className="space-y-5">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-400" />
        <div>
          <h3 className="text-xl font-serif text-secondary dark:text-white">Top Customers by LTV</h3>
          <p className="text-sm text-text-muted">Who is generating the most realised revenue.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/50">
          No paid customer data yet.
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <div
              key={customer.key}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-sm font-black text-amber-300">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{customer.customerName}</p>
                <p className="truncate text-xs text-white/50">
                  {customer.customerEmail || "Email not captured"} • {customer.bookings} paid booking{customer.bookings === 1 ? "" : "s"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-emerald-300">{formatInr(customer.ltvInr)}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Lifetime value</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
