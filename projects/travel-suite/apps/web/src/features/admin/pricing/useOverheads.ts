"use client";

import { useState, useEffect, useCallback } from "react";
import type { MonthlyOverheadExpense } from "./types";

export function useOverheads(month: string) {
  const [expenses, setExpenses] = useState<MonthlyOverheadExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverheads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/overheads?month=${month}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setExpenses(json.expenses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overheads");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchOverheads();
  }, [fetchOverheads]);

  const createExpense = useCallback(async (
    data: { month_start: string; category: string; description?: string; amount: number }
  ) => {
    const res = await fetch("/api/admin/pricing/overheads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    await fetchOverheads();
    return res.json();
  }, [fetchOverheads]);

  const updateExpense = useCallback(async (id: string, data: Partial<MonthlyOverheadExpense>) => {
    const res = await fetch(`/api/admin/pricing/overheads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    await fetchOverheads();
    return res.json();
  }, [fetchOverheads]);

  const deleteExpense = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/pricing/overheads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    await fetchOverheads();
  }, [fetchOverheads]);

  const totalOverhead = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    expenses, loading, error, totalOverhead, reload: fetchOverheads,
    createExpense, updateExpense, deleteExpense,
  };
}
