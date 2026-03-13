"use client";

import { Search, X } from "lucide-react";

export interface TemplateSearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function TemplateSearchBar({ searchQuery, onSearchChange }: TemplateSearchBarProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
                type="text"
                placeholder="Search templates... Dubai, Holi, Family, Flash Sale"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
            />
            {searchQuery && (
                <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
