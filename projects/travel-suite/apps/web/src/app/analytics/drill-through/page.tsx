'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/glass/GlassCard';
import { BarChart3, TrendingUp, Users, MapPin, DollarSign, Calendar, Target } from 'lucide-react';
import Link from 'next/link';

function DrillThroughContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type');
    const month = searchParams.get('month');
    const metric = searchParams.get('metric');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        // In a real app we'd fetch data based on these params.
        // Simulating loading state for drill-through data
        const timer = setTimeout(() => {
            setData([
                { id: 1, title: 'Summer Retreat Ibiza', amount: '$15,000', client: 'VIP Group A', status: 'Completed', date: `${month || 'Q3'} 15, 2026` },
                { id: 2, title: 'Chamonix Ski Package', amount: '$8,500', client: 'John Doe', status: 'Active', date: `${month || 'Q3'} 22, 2026` },
                { id: 3, title: 'Maldives Honeymoon', amount: '$24,000', client: 'Smith Family', status: 'Proposed', date: `${month || 'Q3'} 28, 2026` },
            ]);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [type, month, metric]);

    const config = {
        revenue: { title: 'Revenue Breakdown', icon: DollarSign, color: 'text-emerald-500' },
        bookings: { title: 'Booking Volume Details', icon: Calendar, color: 'text-blue-500' },
        clients: { title: 'Client Acquisition Details', icon: Users, color: 'text-indigo-500' },
        conversion: { title: 'Conversion Rate Analysis', icon: Target, color: 'text-purple-500' }
    };

    const activeConfig = config[type as keyof typeof config] || { title: 'Analytics Details', icon: BarChart3, color: 'text-primary' };
    const Icon = activeConfig.icon;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl bg-white border border-gray-100 ${activeConfig.color} shadow-sm`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-serif text-secondary tracking-tight">{activeConfig.title}</h1>
                    </div>
                    <p className="text-text-secondary text-sm">
                        Detailed breakdown for {month ? `the month of ${month}` : 'the selected period'}. {metric && `Filtering by ${metric}.`}
                    </p>
                </div>
                <Link
                    href="/admin/revenue"
                    className="text-sm font-bold text-primary hover:underline"
                >
                    &larr; Back to Dashboard
                </Link>
            </div>

            <GlassCard padding="none" className="overflow-hidden border-gray-100 shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-text-muted">Loading specific cohort data...</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {data.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-secondary text-lg">{item.title}</h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {item.client}</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {item.date}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-secondary tabular-nums text-lg">{item.amount}</div>
                                    <div className="text-xs uppercase tracking-wider font-bold text-primary mt-1">{item.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}

export default function AnalyticsDrillThroughPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading metrics...</div>}>
            <DrillThroughContent />
        </Suspense>
    );
}
