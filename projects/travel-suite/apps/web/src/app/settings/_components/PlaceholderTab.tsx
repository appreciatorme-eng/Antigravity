'use client';

import { Clock } from 'lucide-react';

export function PlaceholderTab() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 text-text-muted space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-secondary">Coming Soon</h3>
            <p className="max-w-sm text-sm">This section is under development and will be available in an upcoming release.</p>
        </div>
    );
}
