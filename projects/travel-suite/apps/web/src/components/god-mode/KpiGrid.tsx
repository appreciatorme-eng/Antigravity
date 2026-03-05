// KpiGrid — responsive grid of KpiCards (3 col desktop, 2 col tablet, 1 col mobile).

"use client";

import KpiCard, { type KpiCardProps } from "@/components/god-mode/KpiCard";

interface KpiGridProps {
    cards: KpiCardProps[];
}

export default function KpiGrid({ cards }: KpiGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
                <KpiCard key={card.label} {...card} />
            ))}
        </div>
    );
}
