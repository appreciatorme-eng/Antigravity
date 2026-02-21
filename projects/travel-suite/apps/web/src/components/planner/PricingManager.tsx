"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pricing, PricingAddOn, ItineraryResult } from '@/types/itinerary';

interface PricingManagerProps {
    data: ItineraryResult;
    onChange: (newData: ItineraryResult) => void;
}

export function PricingManager({ data, onChange }: PricingManagerProps) {
    const [dbAddOns, setDbAddOns] = useState<any[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/add-ons');
                const json = await res.json();
                if (json.addOns) {
                    setDbAddOns(json.addOns);
                }
            } catch (e) {
                console.error(e);
            }
        }
        load();
    }, []);

    const updatePricing = (field: keyof Pricing, val: number) => {
        const pricing = data.pricing || { basePrice: 0, passengerCount: 1, availableAddOns: [] };
        onChange({ ...data, pricing: { ...pricing, [field]: val } });
    };

    const addPricingAddOn = (dbAddOn?: any) => {
        const pricing = data.pricing || { basePrice: 0, passengerCount: 1, availableAddOns: [] };
        const availableAddOns = pricing.availableAddOns || [];

        let newAddOn: PricingAddOn;
        if (dbAddOn) {
            newAddOn = {
                id: dbAddOn.id,
                name: dbAddOn.name,
                description: dbAddOn.description || '',
                price: dbAddOn.price,
                category: dbAddOn.category
            };
        } else {
            newAddOn = {
                id: Math.random().toString(36).substr(2, 9),
                name: '',
                description: '',
                price: 0,
                category: 'Activities'
            };
        }

        onChange({ ...data, pricing: { ...pricing, availableAddOns: [...availableAddOns, newAddOn] } });
    };

    const updatePricingAddOn = (idx: number, field: keyof PricingAddOn, val: any) => {
        const pricing = data.pricing || { basePrice: 0, passengerCount: 1, availableAddOns: [] };
        const addons = [...(pricing.availableAddOns || [])];
        if (field === 'price') val = parseFloat(val) || 0;
        addons[idx] = { ...addons[idx], [field]: val };
        onChange({ ...data, pricing: { ...pricing, availableAddOns: addons } });
    };

    const removePricingAddOn = (idx: number) => {
        const pricing = data.pricing || { basePrice: 0, passengerCount: 1, availableAddOns: [] };
        const addons = [...(pricing.availableAddOns || [])];
        addons.splice(idx, 1);
        onChange({ ...data, pricing: { ...pricing, availableAddOns: addons } });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Pricing & Add-ons
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Base Price (Total or Per Person)</label>
                        <Input
                            type="number"
                            value={data.pricing?.basePrice || 0}
                            onChange={(e) => updatePricing('basePrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Number of Passengers</label>
                        <Input
                            type="number"
                            value={data.pricing?.passengerCount || 1}
                            onChange={(e) => updatePricing('passengerCount', parseInt(e.target.value, 10) || 1)}
                            placeholder="1"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Available Add-ons (Upsells)</h3>
                        <div className="flex gap-2">
                            <select
                                className="text-sm border rounded-md px-2 py-1 bg-gray-50 dark:bg-slate-800"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const addon = dbAddOns.find(a => a.id === e.target.value);
                                        if (addon) addPricingAddOn(addon);
                                        e.target.value = ""; // reset
                                    }
                                }}
                            >
                                <option value="">+ Add from Catalog...</option>
                                {dbAddOns.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} (${a.price})</option>
                                ))}
                            </select>
                            <Button variant="outline" size="sm" onClick={() => addPricingAddOn()}>
                                <Plus className="w-4 h-4 mr-1" /> Custom Add-on
                            </Button>
                        </div>
                    </div>

                    {(data.pricing?.availableAddOns || []).map((addon, idx) => (
                        <div key={idx} className="flex gap-3 items-start bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-gray-500">Add-on Name</label>
                                        <Input
                                            value={addon.name}
                                            onChange={e => updatePricingAddOn(idx, 'name', e.target.value)}
                                            placeholder="e.g. SUV Upgrade"
                                        />
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <label className="text-xs text-gray-500">Price</label>
                                        <Input
                                            type="number"
                                            value={addon.price}
                                            onChange={e => updatePricingAddOn(idx, 'price', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <label className="text-xs text-gray-500">Category</label>
                                        <Input
                                            value={addon.category}
                                            onChange={e => updatePricingAddOn(idx, 'category', e.target.value)}
                                            placeholder="Transport"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6">
                                <Button variant="ghost" size="icon" onClick={() => removePricingAddOn(idx)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {(data.pricing?.availableAddOns?.length === 0 || !data.pricing?.availableAddOns) && (
                        <p className="text-center text-sm text-gray-400 py-4">No optional add-ons configured for this trip.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
