"use client";

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Activity, Day, FlightDetails, HotelDetails, ItineraryResult } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Navigation, Hotel, DollarSign } from 'lucide-react';
import { Pricing, PricingAddOn } from '@/types/itinerary';

interface ItineraryBuilderProps {
    data: ItineraryResult;
    onChange: (newData: ItineraryResult) => void;
}

// ----------------------------------------------------------------------
// Sortable Activity Item Component
// ----------------------------------------------------------------------
function SortableActivityItem({ activity, dayIndex, actIndex, updateActivity, removeActivity }: {
    activity: Activity,
    dayIndex: number,
    actIndex: number,
    updateActivity: (dIdx: number, aIdx: number, field: keyof Activity, val: string) => void,
    removeActivity: (dIdx: number, aIdx: number) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: `${dayIndex}-${actIndex}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm flex gap-4 group">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pt-2"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Edit Fields */}
            <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                    <Input
                        value={activity.time || ''}
                        onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                        placeholder="Time (e.g. 09:00 AM)"
                        className="w-32 bg-gray-50 dark:bg-slate-800"
                    />
                    <Input
                        value={activity.title || activity.name || ''}
                        onChange={(e) => updateActivity(dayIndex, actIndex, 'title', e.target.value)}
                        placeholder="Activity Title"
                        className="flex-1 font-semibold bg-gray-50 dark:bg-slate-800"
                    />
                </div>
                <div className="flex gap-3">
                    <Input
                        value={activity.location || ''}
                        onChange={(e) => updateActivity(dayIndex, actIndex, 'location', e.target.value)}
                        placeholder="Location"
                        className="flex-1 bg-gray-50 dark:bg-slate-800"
                    />
                </div>
                <Textarea
                    value={activity.description || ''}
                    onChange={(e) => updateActivity(dayIndex, actIndex, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full text-sm bg-gray-50 dark:bg-slate-800 resize-none h-20"
                />
            </div>

            {/* Actions */}
            <div className="pt-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(dayIndex, actIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}


// ----------------------------------------------------------------------
// Main Builder Component
// ----------------------------------------------------------------------
export default function ItineraryBuilder({ data, onChange }: ItineraryBuilderProps) {
    const sensors = useSensors(
        usePointerSensor(),
        useKeyboardSensor()
    );

    // Helpers to create new empty objects
    const createEmptyActivity = (): Activity => ({
        time: '',
        title: 'New Activity',
        description: '',
        location: '',
    });

    const createEmptyFlight = (): FlightDetails => ({
        id: Math.random().toString(36).substr(2, 9),
        airline: '',
        flight_number: '',
        departure_airport: '',
        arrival_airport: '',
        departure_time: '',
        arrival_time: ''
    });

    const createEmptyHotel = (): HotelDetails => ({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        address: '',
        check_in: '',
        check_out: ''
    });

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

    // --- State Handlers: Activities ---
    const updateActivity = (dIdx: number, aIdx: number, field: keyof Activity, val: string) => {
        const newDays = [...data.days];
        newDays[dIdx].activities[aIdx] = { ...newDays[dIdx].activities[aIdx], [field]: val };
        onChange({ ...data, days: newDays });
    };

    const removeActivity = (dIdx: number, aIdx: number) => {
        const newDays = [...data.days];
        newDays[dIdx].activities.splice(aIdx, 1);
        onChange({ ...data, days: newDays });
    };

    const addActivity = (dIdx: number) => {
        const newDays = [...data.days];
        newDays[dIdx].activities.push(createEmptyActivity());
        onChange({ ...data, days: newDays });
    };

    // --- Drag and Drop Logic ---
    function handleDragEnd(event: DragEndEvent, dayIndex: number) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = data.days[dayIndex].activities.findIndex((_, i) => `${dayIndex}-${i}` === active.id);
            const newIndex = data.days[dayIndex].activities.findIndex((_, i) => `${dayIndex}-${i}` === over.id);

            const newDays = [...data.days];
            newDays[dayIndex].activities = arrayMove(newDays[dayIndex].activities, oldIndex, newIndex);
            onChange({ ...data, days: newDays });
        }
    }

    // Custom sensor configurations to prevent input fields from breaking DnD
    function usePointerSensor() {
        return useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        });
    }

    function useKeyboardSensor() {
        return useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        });
    }

    // --- State Handlers: Logistics ---
    const addFlight = () => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const flights = logistics.flights || [];
        onChange({ ...data, logistics: { ...logistics, flights: [...flights, createEmptyFlight()] } });
    };

    const updateFlight = (idx: number, field: keyof FlightDetails, val: string) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const flights = [...(logistics.flights || [])];
        flights[idx] = { ...flights[idx], [field]: val };
        onChange({ ...data, logistics: { ...logistics, flights } });
    };

    const removeFlight = (idx: number) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const flights = [...(logistics.flights || [])];
        flights.splice(idx, 1);
        onChange({ ...data, logistics: { ...logistics, flights } });
    };

    const addHotel = () => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const hotels = logistics.hotels || [];
        onChange({ ...data, logistics: { ...logistics, hotels: [...hotels, createEmptyHotel()] } });
    };

    const updateHotel = (idx: number, field: keyof HotelDetails, val: string) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const hotels = [...(logistics.hotels || [])];
        hotels[idx] = { ...hotels[idx], [field]: val };
        onChange({ ...data, logistics: { ...logistics, hotels } });
    };

    const removeHotel = (idx: number) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const hotels = [...(logistics.hotels || [])];
        hotels.splice(idx, 1);
        onChange({ ...data, logistics: { ...logistics, hotels } });
    };

    // --- State Handlers: Pricing ---
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
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-12">

            {/* Trip Header Settings */}
            <div className="space-y-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold font-serif">Trip Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Trip Title</label>
                        <Input
                            value={data.trip_title || ''}
                            onChange={(e) => onChange({ ...data, trip_title: e.target.value, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Destination</label>
                        <Input
                            value={data.destination || ''}
                            onChange={(e) => onChange({ ...data, destination: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Summary</label>
                    <Textarea
                        value={data.summary || ''}
                        onChange={(e) => onChange({ ...data, summary: e.target.value })}
                        className="h-24 resize-none"
                    />
                </div>
            </div>

            {/* Logistics Section (Flights & Hotels) */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-500" /> Logistics
                </h2>

                {/* Flights */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20 p-4 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300">Flights</h3>
                        <Button variant="outline" size="sm" onClick={addFlight} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Flight
                        </Button>
                    </div>
                    {(data.logistics?.flights || []).map((flight, idx) => (
                        <div key={flight.id} className="grid md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-lg items-start">
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs text-gray-500">Airline</label>
                                <Input value={flight.airline} onChange={e => updateFlight(idx, 'airline', e.target.value)} placeholder="E.g. Delta" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs text-gray-500">Flight #</label>
                                <Input value={flight.flight_number} onChange={e => updateFlight(idx, 'flight_number', e.target.value)} placeholder="DL 123" />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs text-gray-500">Departure</label>
                                <Input value={flight.departure_airport} onChange={e => updateFlight(idx, 'departure_airport', e.target.value)} placeholder="JFK" />
                                <Input value={flight.departure_time} onChange={e => updateFlight(idx, 'departure_time', e.target.value)} placeholder="2024-05-10 08:00 AM" />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs text-gray-500">Arrival</label>
                                <Input value={flight.arrival_airport} onChange={e => updateFlight(idx, 'arrival_airport', e.target.value)} placeholder="LHR" />
                                <Input value={flight.arrival_time} onChange={e => updateFlight(idx, 'arrival_time', e.target.value)} placeholder="2024-05-10 08:00 PM" />
                            </div>
                            <div className="md:col-span-1 pt-6 text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeFlight(idx)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Hotels */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border border-emerald-100 dark:border-emerald-900/50 rounded-lg">
                        <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Hotels</h3>
                        <Button variant="outline" size="sm" onClick={addHotel} className="border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Hotel
                        </Button>
                    </div>
                    {(data.logistics?.hotels || []).map((hotel, idx) => (
                        <div key={hotel.id} className="grid md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-lg items-start">
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs text-gray-500">Hotel Name</label>
                                <Input value={hotel.name} onChange={e => updateHotel(idx, 'name', e.target.value)} placeholder="The Plaza" />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-xs text-gray-500">Address</label>
                                <Input value={hotel.address} onChange={e => updateHotel(idx, 'address', e.target.value)} placeholder="123 5th Ave" />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs text-gray-500">Dates</label>
                                <Input value={hotel.check_in} onChange={e => updateHotel(idx, 'check_in', e.target.value)} placeholder="Check in" />
                                <Input value={hotel.check_out} onChange={e => updateHotel(idx, 'check_out', e.target.value)} placeholder="Check out" />
                            </div>
                            <div className="md:col-span-1 pt-6 text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeHotel(idx)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>


            {/* Daily Itinerary Section */}
            <div className="space-y-12 pt-8 border-t border-gray-200 dark:border-white/10">
                <h2 className="text-2xl font-bold font-serif text-center">Daily Schedule</h2>
                {data.days.map((day, dayIndex) => {
                    const activityIds = day.activities.map((_, i) => `${dayIndex}-${i}`);

                    return (
                        <div key={day.day_number} className="space-y-4">
                            <div className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="text-lg font-bold w-20">Day {day.day_number}</h3>
                                <Input
                                    value={day.theme || ''}
                                    onChange={(e) => {
                                        const newDays = [...data.days];
                                        newDays[dayIndex].theme = e.target.value;
                                        onChange({ ...data, days: newDays });
                                    }}
                                    placeholder="Day Theme (e.g. Arrival & Orientation)"
                                    className="flex-1 font-semibold"
                                />
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handleDragEnd(e, dayIndex)}
                            >
                                <SortableContext
                                    items={activityIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-slate-800 ml-4">
                                        {day.activities.map((act, actIndex) => (
                                            <SortableActivityItem
                                                key={`${dayIndex}-${actIndex}`}
                                                activity={act}
                                                dayIndex={dayIndex}
                                                actIndex={actIndex}
                                                updateActivity={updateActivity}
                                                removeActivity={removeActivity}
                                            />
                                        ))}

                                        <Button
                                            variant="outline"
                                            onClick={() => addActivity(dayIndex)}
                                            className="w-full mt-4 border-dashed"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Activity to Day {day.day_number}
                                        </Button>
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    );
                })}
            </div>

            {/* Pricing Section */}
            <div className="space-y-6 pt-8 border-t border-gray-200 dark:border-white/10">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
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
                            <div key={idx} className="flex gap-3 items-start bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-white/5">
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
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center text-sm text-gray-500 pt-8 pb-12">
                Note: Updating fields here will alter the saved itinerary directly. Changes are automatically carried over when you switch back to Preview Mode.
            </div>
        </div>
    );
}
