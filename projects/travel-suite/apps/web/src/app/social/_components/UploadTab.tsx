"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UploadTabProps {
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UploadTab({ onImageUpload }: UploadTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
                <Upload className="w-4 h-4" />
                Upload
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
            />
        </>
    );
}
