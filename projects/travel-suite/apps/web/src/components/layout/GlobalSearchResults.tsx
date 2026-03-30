"use client";

import { Users, Map, Loader2 } from "lucide-react";
import Link from "next/link";
import type { SearchResult } from "@/hooks/useGlobalSearch";

interface GlobalSearchResultsProps {
  readonly results: readonly SearchResult[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly query: string;
  readonly onSelect: () => void;
}

const ICON_MAP = {
  client: Users,
  trip: Map,
} as const;

const LABEL_MAP = {
  client: "Client",
  trip: "Trip",
} as const;

export function GlobalSearchResults({
  results,
  isLoading,
  error,
  query,
  onSelect,
}: GlobalSearchResultsProps) {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        Type at least 2 characters to search clients, trips, PNRs...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Searching...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-400 text-sm">
        Search failed. Please try again.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        No results found for &ldquo;{trimmed}&rdquo;
      </div>
    );
  }

  // Group results by type
  const clients = results.filter((r) => r.type === "client");
  const trips = results.filter((r) => r.type === "trip");

  return (
    <div className="py-2">
      {clients.length > 0 && (
        <ResultGroup label="Clients" results={clients} onSelect={onSelect} />
      )}
      {trips.length > 0 && (
        <ResultGroup label="Trips" results={trips} onSelect={onSelect} />
      )}
    </div>
  );
}

function ResultGroup({
  label,
  results,
  onSelect,
}: {
  readonly label: string;
  readonly results: readonly SearchResult[];
  readonly onSelect: () => void;
}) {
  return (
    <div className="mb-2">
      <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </div>
      {results.map((result) => (
        <ResultItem key={`${result.type}-${result.id}`} result={result} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ResultItem({
  result,
  onSelect,
}: {
  readonly result: SearchResult;
  readonly onSelect: () => void;
}) {
  const Icon = ICON_MAP[result.type];
  const typeLabel = LABEL_MAP[result.type];

  return (
    <Link
      href={result.href}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {result.title}
        </div>
        {result.subtitle && (
          <div className="text-xs text-gray-400 dark:text-slate-500 truncate">
            {result.subtitle}
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
        {typeLabel}
      </span>
    </Link>
  );
}
