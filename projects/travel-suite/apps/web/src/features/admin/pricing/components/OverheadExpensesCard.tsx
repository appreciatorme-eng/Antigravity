"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { formatINR } from "@/lib/india/formats";
import { OVERHEAD_SUGGESTIONS } from "../types";
import type { MonthlyOverheadExpense } from "../types";

interface OverheadExpensesCardProps {
  expenses: MonthlyOverheadExpense[];
  monthLabel: string;
  monthStart: string;
  totalOverhead: number;
  grossProfit: number;
  onCreateExpense: (data: {
    month_start: string; category: string; description?: string; amount: number;
  }) => Promise<unknown>;
  onUpdateExpense: (id: string, data: Partial<MonthlyOverheadExpense>) => Promise<unknown>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export function OverheadExpensesCard({
  expenses, monthLabel, monthStart, totalOverhead, grossProfit,
  onCreateExpense, onUpdateExpense, onDeleteExpense,
}: OverheadExpensesCardProps) {
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const netProfit = grossProfit - totalOverhead;

  const handleAdd = useCallback(async () => {
    if (!newCategory || !newAmount) return;
    setSaving(true);
    try {
      await onCreateExpense({
        month_start: monthStart,
        category: newCategory,
        description: newDescription || undefined,
        amount: parseFloat(newAmount) || 0,
      });
      setAdding(false);
      setNewCategory("");
      setNewDescription("");
      setNewAmount("");
    } finally {
      setSaving(false);
    }
  }, [monthStart, newCategory, newDescription, newAmount, onCreateExpense]);

  const handleInlineUpdate = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await onUpdateExpense(id, { amount: parseFloat(editAmount) || 0 });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }, [editAmount, onUpdateExpense]);

  return (
    <GlassCard padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-serif text-secondary">Monthly Fixed Costs</h3>
          <p className="text-xs text-text-muted mt-0.5">{monthLabel}</p>
        </div>
        <GlassButton
          variant="outline"
          onClick={() => setAdding(true)}
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </GlassButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/60">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                Category
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                Description
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-primary">
                Amount (₹)
              </th>
              <th className="px-4 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-secondary">{exp.category}</td>
                <td className="px-4 py-3 text-text-secondary">{exp.description || "\u2014"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {editingId === exp.id ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onBlur={() => handleInlineUpdate(exp.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInlineUpdate(exp.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="w-28 px-2 py-1 rounded-lg border border-primary/30 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary transition-colors font-medium"
                      onClick={() => {
                        setEditingId(exp.id);
                        setEditAmount(String(exp.amount));
                      }}
                    >
                      {formatINR(Number(exp.amount))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {adding && (
              <tr className="bg-primary/5">
                <td className="px-4 py-3">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select category...</option>
                    {OVERHEAD_SUGGESTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </td>
                <td className="px-4 py-3 text-center space-x-1">
                  <GlassButton onClick={handleAdd} loading={saving}>
                    Save
                  </GlassButton>
                  <button
                    onClick={() => setAdding(false)}
                    className="text-xs text-text-muted hover:text-secondary ml-1"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50/80 font-bold">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-xs uppercase tracking-wide text-secondary">
                Total Overhead
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-rose-600">
                {formatINR(totalOverhead)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/50">
        <span className="text-sm font-medium text-violet-700">Net Profit after Overhead</span>
        <span className={`text-lg font-bold tabular-nums ${netProfit >= 0 ? "text-violet-600" : "text-rose-600"}`}>
          {formatINR(netProfit)}
        </span>
      </div>
    </GlassCard>
  );
}
