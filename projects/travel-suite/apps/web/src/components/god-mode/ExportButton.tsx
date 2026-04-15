// ExportButton — reusable CSV/JSON export button with download handler.

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
    /** Data to export — array of objects */
    data: Record<string, unknown>[];
    /** File name (without extension) */
    filename: string;
    /** Columns to include and their display labels */
    columns?: Array<{ key: string; label: string }>;
    /** Export format */
    format?: "csv" | "json";
    disabled?: boolean;
    className?: string;
}

function escapeCSV(value: unknown): string {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export default function ExportButton({
    data,
    filename,
    columns,
    format = "csv",
    disabled = false,
    className,
}: ExportButtonProps) {
    const [exporting, setExporting] = useState(false);

    function handleExport() {
        if (!data.length) return;
        setExporting(true);

        try {
            const cols = columns ?? Object.keys(data[0]).map((key) => ({ key, label: key }));

            let content: string;
            let mimeType: string;
            let ext: string;

            if (format === "csv") {
                const header = cols.map((c) => escapeCSV(c.label)).join(",");
                const rows = data.map((row) =>
                    cols.map((c) => escapeCSV(row[c.key])).join(","),
                );
                content = [header, ...rows].join("\n");
                mimeType = "text/csv";
                ext = "csv";
            } else {
                const filtered = data.map((row) => {
                    const obj: Record<string, unknown> = {};
                    for (const c of cols) obj[c.key] = row[c.key];
                    return obj;
                });
                content = JSON.stringify(filtered, null, 2);
                mimeType = "application/json";
                ext = "json";
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${filename}.${ext}`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={disabled || !data.length || exporting}
            className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50",
                className,
            )}
        >
            {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            Export {format.toUpperCase()}
        </button>
    );
}
