"use client";

import React, { useState } from 'react';
import type { ExtractedPricing, Pricing } from '@/types/itinerary';
import { IndianRupee, CheckCircle2, Circle } from 'lucide-react';

type SharePricing = Pricing | ExtractedPricing;

interface InteractivePricingProps {
    pricing?: SharePricing;
}

export function InteractivePricing({ pricing }: InteractivePricingProps) {
    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

    if (!pricing) return null;

    const pricingRecord = pricing as Partial<Pricing & ExtractedPricing>;
    const passengerCount =
        typeof pricingRecord.passengerCount === "number" && Number.isFinite(pricingRecord.passengerCount)
            ? pricingRecord.passengerCount
            : typeof pricingRecord.pax_count === "number" && Number.isFinite(pricingRecord.pax_count)
                ? pricingRecord.pax_count
                : 1;
    const currency =
        typeof pricingRecord.currency === "string" && pricingRecord.currency.trim()
            ? pricingRecord.currency.trim().toUpperCase()
            : "INR";
    const availableAddOns = Array.isArray(pricingRecord.availableAddOns)
        ? pricingRecord.availableAddOns
        : [];

    const baseCost =
        typeof pricingRecord.basePrice === "number" && Number.isFinite(pricingRecord.basePrice)
            ? pricingRecord.basePrice
            : typeof pricingRecord.total_cost === "number" && Number.isFinite(pricingRecord.total_cost)
                ? pricingRecord.total_cost
                : typeof pricingRecord.per_person_cost === "number" && Number.isFinite(pricingRecord.per_person_cost)
                    ? pricingRecord.per_person_cost * passengerCount
                    : 0;
    const markupPercentage =
        typeof pricingRecord.markupPercentage === "number" && Number.isFinite(pricingRecord.markupPercentage)
            ? pricingRecord.markupPercentage
            : 0;
    const serviceFee =
        typeof pricingRecord.serviceFee === "number" && Number.isFinite(pricingRecord.serviceFee)
            ? pricingRecord.serviceFee
            : 0;

    if (baseCost <= 0 && availableAddOns.length === 0) return null;

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedAddOns);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedAddOns(newSet);
    };

    const formatMoney = (value: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value);

    // Calculate total
    const markupMultiplier = 1 + markupPercentage / 100;
    const baseTotal = (baseCost * markupMultiplier) + serviceFee;
    let addOnsTotal = 0;
    availableAddOns.forEach(addon => {
        if (selectedAddOns.has(addon.id)) {
            addOnsTotal += addon.price;
        }
    });

    const finalTotal = baseTotal + addOnsTotal;

    return (
        <div className="max-w-4xl mx-auto my-12 px-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-serif mb-2">Trip Investment</h2>
                    <p className="opacity-90">Customized for {passengerCount} {passengerCount === 1 ? 'passenger' : 'passengers'}</p>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Base Price */}
                    <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-white/10">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Base Itinerary</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Includes all standard accommodations and scheduled activities.</p>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex flex-col items-end">
                            <span>{formatMoney(baseTotal)}</span>
                            {(markupPercentage || serviceFee) ? (
                                <span className="text-[10px] text-emerald-600 font-medium">Incl. Service Fees</span>
                            ) : null}
                        </div>
                    </div>

                    {/* Add-ons */}
                    {availableAddOns.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Available Enhancements</h3>
                            <div className="grid gap-4">
                                {availableAddOns.map(addon => {
                                    const isSelected = selectedAddOns.has(addon.id);
                                    return (
                                        <div
                                            key={addon.id}
                                            onClick={() => handleToggle(addon.id)}
                                            className={`relative flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                                                : 'border-gray-100 dark:border-white/10 hover:border-emerald-200 dark:hover:border-emerald-500/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0">
                                                    {isSelected ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />}
                                                </div>
                                                <div>
                                                    <h4 className={`font-semibold ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                        {addon.name}
                                                    </h4>
                                                    {(addon.category || addon.description) && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {addon.category && <span className="uppercase text-xs tracking-wider mr-2">{addon.category}</span>}
                                                            {addon.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`font-bold whitespace-nowrap ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                + {formatMoney(addon.price)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Final Total */}
                    <div className="pt-6 border-t font-serif border-gray-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm font-bold mb-1">Estimated Total</h3>
                            <p className="text-xs text-gray-400">Prices are subject to final confirmation.</p>
                        </div>
                        <div className="text-4xl font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            {currency === "INR" && <IndianRupee className="w-8 h-8 opacity-50" />}
                            {formatMoney(finalTotal)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
