// InlineEditField — click-to-edit field for text, select, and datetime inputs.

"use client";

import { useState } from "react";
import { Check, Pencil, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldType = "text" | "select" | "datetime-local";

interface SelectOption {
    value: string;
    label: string;
}

interface InlineEditFieldProps {
    value: string;
    displayValue?: string;
    label: string;
    fieldType?: FieldType;
    options?: SelectOption[];
    onSave: (newValue: string) => void | Promise<void>;
    disabled?: boolean;
    className?: string;
    badgeClassName?: string;
}

export default function InlineEditField({
    value,
    displayValue,
    label,
    fieldType = "text",
    options,
    onSave,
    disabled = false,
    className,
    badgeClassName,
}: InlineEditFieldProps) {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (editValue === value) {
            setEditing(false);
            return;
        }
        setSaving(true);
        try {
            await onSave(editValue);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setEditValue(value);
        setEditing(false);
    }

    if (editing) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <span className="text-gray-400 text-sm">{label}</span>
                {fieldType === "select" && options ? (
                    <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        disabled={saving}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none"
                        autoFocus
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={fieldType}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        disabled={saving}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                        }}
                    />
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded p-1 text-emerald-400 transition-colors hover:bg-emerald-500/10"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-700"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center justify-between", className)}>
            <span className="text-gray-400 text-sm">{label}</span>
            <div className="flex items-center gap-2">
                <span className={cn("text-sm", badgeClassName ?? "text-white font-medium")}>
                    {displayValue ?? (value || "—")}
                </span>
                {!disabled && (
                    <button
                        onClick={() => {
                            setEditValue(value);
                            setEditing(true);
                        }}
                        className="rounded p-1 text-gray-500 transition-colors hover:text-amber-400"
                        title={`Edit ${label}`}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
