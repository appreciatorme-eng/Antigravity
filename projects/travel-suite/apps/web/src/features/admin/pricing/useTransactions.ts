"use client";

// Hook for the pricing transaction ledger — fetches all cost line items with filters.

import { useState, useEffect, useCallback, useRef } from "react";
import type { TransactionItem, TransactionSummary, TransactionFilters } from "./types";

const EMPTY_SUMMARY: TransactionSummary = { totalCost: 0, totalRevenue: 0, totalProfit: 0, totalCommission: 0, count: 0 };

export function useTransactions(filters: TransactionFilters) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTransactions = useCallback(async (f: TransactionFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.category && f.category !== "all") params.set("category", f.category);
      if (f.vendor) params.set("vendor", f.vendor);
      if (f.sort) params.set("sort", f.sort);

      const res = await fetch(`/api/admin/pricing/transactions?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }
      const json = await res.json() as { transactions: TransactionItem[]; summary: TransactionSummary };
      setTransactions(json.transactions);
      setSummary(json.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = filters.search ? 300 : 0;
    debounceRef.current = setTimeout(() => {
      void fetchTransactions(filters);
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.search, filters.category, filters.vendor, filters.sort, fetchTransactions]);

  const reload = useCallback(() => {
    void fetchTransactions(filters);
  }, [fetchTransactions, filters]);

  return { transactions, summary, loading, error, reload };
}
