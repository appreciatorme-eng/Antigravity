'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableCreatableMultiSelectProps {
  label: string;
  placeholder?: string;
  selectedValues: string[];
  options: string[];
  onChange: (nextValues: string[]) => void;
  helperText?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

const normalizeValue = (value: string) => value.trim().replace(/\s+/g, ' ');

const includesIgnoreCase = (values: string[], candidate: string) =>
  values.some((value) => value.toLowerCase() === candidate.toLowerCase());

export default function SearchableCreatableMultiSelect({
  label,
  placeholder = 'Search or type to add...',
  selectedValues,
  options,
  onChange,
  helperText,
  emptyMessage = 'No matches. Press Enter or Add to create.',
  className,
  disabled = false,
}: SearchableCreatableMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const normalizedOptions = useMemo(() => {
    const map = new Map<string, string>();
    [...options, ...selectedValues]
      .map(normalizeValue)
      .filter(Boolean)
      .forEach((value) => {
        map.set(value.toLowerCase(), value);
      });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [options, selectedValues]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedOptions
      .filter((value) => !includesIgnoreCase(selectedValues, value))
      .filter((value) => {
        if (!normalizedQuery) return true;
        return value.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [normalizedOptions, query, selectedValues]);

  const addValue = (rawValue: string) => {
    const normalized = normalizeValue(rawValue);
    if (!normalized) return;
    if (includesIgnoreCase(selectedValues, normalized)) {
      setQuery('');
      return;
    }

    const canonical =
      normalizedOptions.find((option) => option.toLowerCase() === normalized.toLowerCase()) ||
      normalized;
    onChange([...selectedValues, canonical]);
    setQuery('');
  };

  const removeValue = (valueToRemove: string) => {
    onChange(selectedValues.filter((value) => value !== valueToRemove));
  };

  const canAddCustom =
    query.trim().length > 0 &&
    !includesIgnoreCase(selectedValues, query.trim()) &&
    !includesIgnoreCase(normalizedOptions, query.trim());

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-[#6f5b3e] dark:text-white/90">{label}</label>

      <div className="rounded-xl border border-[#eadfcd] dark:border-white/20 bg-white/80 dark:bg-white/5 p-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedValues.length > 0 ? (
            selectedValues.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded-full border border-[#d8ccb7] bg-[#f8f1e6] dark:bg-slate-800/80 dark:border-slate-700 px-2.5 py-1 text-xs text-[#5a4930] dark:text-slate-100"
              >
                {value}
                {!disabled ? (
                  <button
                    type="button"
                    className="text-[#8a6d3e] hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    onClick={() => removeValue(value)}
                    aria-label={`Remove ${value}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#9a8462] dark:text-slate-400">No items selected yet.</span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8462] dark:text-slate-400" />
            <input
              value={query}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 120)}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (query.trim()) addValue(query);
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-lg border border-[#eadfcd] dark:border-white/20 bg-white dark:bg-white/10 px-9 py-2 text-sm text-[#2d2010] dark:text-white placeholder:text-[#b29a74] dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/30 dark:focus:ring-primary/40"
            />
          </div>
          <button
            type="button"
            disabled={disabled || !query.trim()}
            onClick={() => addValue(query)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#9c7c46] px-3 py-2 text-sm font-medium text-white hover:bg-[#8a6d3e] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {isFocused ? (
          <div className="mt-2 rounded-lg border border-[#eadfcd] dark:border-white/15 bg-white dark:bg-[#0f172a] max-h-44 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-[#2d2010] dark:text-slate-100 hover:bg-[#f8f1e6] dark:hover:bg-slate-800"
                  onClick={() => addValue(option)}
                >
                  {option}
                </button>
              ))
            ) : canAddCustom ? (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-[#2d2010] dark:text-slate-100 hover:bg-[#f8f1e6] dark:hover:bg-slate-800"
                onClick={() => addValue(query)}
              >
                Add "{query.trim()}"
              </button>
            ) : (
              <div className="px-3 py-2 text-xs text-[#9a8462] dark:text-slate-400">{emptyMessage}</div>
            )}
          </div>
        ) : null}
      </div>

      {helperText ? <p className="text-xs text-[#8a6d3e] dark:text-slate-400">{helperText}</p> : null}
    </div>
  );
}
