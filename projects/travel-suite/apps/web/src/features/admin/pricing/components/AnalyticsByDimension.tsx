"use client";

import { GlassCard } from "@/components/glass/GlassCard";
import { formatINRShort } from "@/lib/india/formats";
import type { DestinationProfitability, ClientProfitability } from "../types";

interface AnalyticsByDimensionProps {
  topDestinations: DestinationProfitability[];
  bottomDestinations: DestinationProfitability[];
  topClients: ClientProfitability[];
  bottomClients: ClientProfitability[];
}

function formatMargin(margin: number): string {
  return `${margin.toFixed(1)}%`;
}

interface DimensionTableProps {
  title: string;
  description: string;
  topItems: Array<{ name: string; trips: number; revenue: number; cost: number; profit: number; margin: number }>;
  bottomItems: Array<{ name: string; trips: number; revenue: number; cost: number; profit: number; margin: number }>;
}

function DimensionTable({ title, description, topItems, bottomItems }: DimensionTableProps) {
  const maxProfit = Math.max(...topItems.map((i) => Math.abs(i.profit)), ...bottomItems.map((i) => Math.abs(i.profit)));

  const renderRow = (
    item: { name: string; trips: number; revenue: number; cost: number; profit: number; margin: number },
    index: number,
    isTop: boolean
  ) => {
    const profitWidth = maxProfit > 0 ? (Math.abs(item.profit) / maxProfit) * 100 : 0;
    const isPositive = item.profit >= 0;

    return (
      <tr key={`${item.name}-${index}`} className="hover:bg-gray-50/50 transition-colors">
        <td className="px-3 py-2.5 text-left">
          <div className="flex items-center gap-1.5">
            {isTop && index === 0 && <span className="text-xs">🏆</span>}
            {isTop && index === 1 && <span className="text-xs">🥈</span>}
            {isTop && index === 2 && <span className="text-xs">🥉</span>}
            <span className="font-medium text-secondary text-sm truncate max-w-[120px]" title={item.name}>
              {item.name}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-center text-text-secondary text-sm tabular-nums">
          {item.trips}
        </td>
        <td className="px-3 py-2.5 text-right text-emerald-600 text-sm font-medium tabular-nums">
          {formatINRShort(item.revenue)}
        </td>
        <td className="px-3 py-2.5 text-right text-rose-600 text-sm tabular-nums">
          {formatINRShort(item.cost)}
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className={`text-sm font-bold tabular-nums ${isPositive ? "text-violet-600" : "text-red-600"}`}>
              {formatINRShort(item.profit)}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isPositive ? "bg-violet-500" : "bg-red-500"}`}
                style={{ width: `${profitWidth}%` }}
              />
            </div>
            <span className={`text-xs font-medium tabular-nums ${isPositive ? "text-violet-600" : "text-red-600"}`}>
              {formatMargin(item.margin)}
            </span>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <GlassCard padding="lg" className="flex flex-col">
      <h3 className="text-lg font-serif text-secondary mb-1">{title}</h3>
      <p className="text-xs text-text-muted mb-4">{description}</p>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/60">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                Name
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-primary">
                Trips
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Revenue
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-rose-600">
                Cost
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-violet-600">
                Profit
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-primary">
                Margin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topItems.length > 0 && topItems.map((item, i) => renderRow(item, i, true))}
            {topItems.length > 0 && bottomItems.length > 0 && (
              <tr className="bg-gray-100/40">
                <td colSpan={6} className="px-3 py-1.5 text-center">
                  <span className="text-xs font-medium text-gray-400">···</span>
                </td>
              </tr>
            )}
            {bottomItems.length > 0 && bottomItems.map((item, i) => renderRow(item, i, false))}
          </tbody>
        </table>
        {topItems.length === 0 && bottomItems.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            No data available
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function AnalyticsByDimension({
  topDestinations,
  bottomDestinations,
  topClients,
  bottomClients,
}: AnalyticsByDimensionProps) {
  const destinationTopItems = topDestinations.map((d) => ({
    name: d.destination,
    trips: d.tripCount,
    revenue: d.revenue,
    cost: d.cost,
    profit: d.profit,
    margin: d.avgMargin,
  }));

  const destinationBottomItems = bottomDestinations.map((d) => ({
    name: d.destination,
    trips: d.tripCount,
    revenue: d.revenue,
    cost: d.cost,
    profit: d.profit,
    margin: d.avgMargin,
  }));

  const clientTopItems = topClients.map((c) => ({
    name: c.clientName,
    trips: c.tripCount,
    revenue: c.revenue,
    cost: c.cost,
    profit: c.profit,
    margin: c.avgMargin,
  }));

  const clientBottomItems = bottomClients.map((c) => ({
    name: c.clientName,
    trips: c.tripCount,
    revenue: c.revenue,
    cost: c.cost,
    profit: c.profit,
    margin: c.avgMargin,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DimensionTable
        title="Top/Bottom Destinations"
        description="Profitability by destination"
        topItems={destinationTopItems}
        bottomItems={destinationBottomItems}
      />
      <DimensionTable
        title="Top/Bottom Clients"
        description="Profitability by client"
        topItems={clientTopItems}
        bottomItems={clientBottomItems}
      />
    </div>
  );
}
