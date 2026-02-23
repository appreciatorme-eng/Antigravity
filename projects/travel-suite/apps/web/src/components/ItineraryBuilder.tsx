"use client";

import { useEffect, useRef, useState } from 'react';
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
import { Activity, ItineraryResult } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { LogisticsManager } from './planner/LogisticsManager';
import { PricingManager } from './planner/PricingManager';

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
    const [draftData, setDraftData] = useState<ItineraryResult>(data);
    const commitTimerRef = useRef<number | null>(null);

    useEffect(() => {
        setDraftData(data);
    }, [data]);

    useEffect(() => {
        return () => {
            if (commitTimerRef.current) {
                window.clearTimeout(commitTimerRef.current);
            }
        };
    }, []);

    const queueChange = (nextData: ItineraryResult) => {
        setDraftData(nextData);
        if (commitTimerRef.current) {
            window.clearTimeout(commitTimerRef.current);
        }
        commitTimerRef.current = window.setTimeout(() => {
            onChange(nextData);
        }, 280);
    };

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

    // --- State Handlers: Activities ---
    const updateActivity = (dIdx: number, aIdx: number, field: keyof Activity, val: string) => {
        const newDays = [...draftData.days];
        newDays[dIdx].activities[aIdx] = { ...newDays[dIdx].activities[aIdx], [field]: val };
        queueChange({ ...draftData, days: newDays });
    };

    const removeActivity = (dIdx: number, aIdx: number) => {
        const newDays = [...draftData.days];
        newDays[dIdx].activities.splice(aIdx, 1);
        queueChange({ ...draftData, days: newDays });
    };

    const addActivity = (dIdx: number) => {
        const newDays = [...draftData.days];
        newDays[dIdx].activities.push(createEmptyActivity());
        queueChange({ ...draftData, days: newDays });
    };

    // --- Drag and Drop Logic ---
    function handleDragEnd(event: DragEndEvent, dayIndex: number) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = draftData.days[dayIndex].activities.findIndex((_, i) => `${dayIndex}-${i}` === active.id);
            const newIndex = draftData.days[dayIndex].activities.findIndex((_, i) => `${dayIndex}-${i}` === over.id);

            const newDays = [...draftData.days];
            newDays[dayIndex].activities = arrayMove(newDays[dayIndex].activities, oldIndex, newIndex);
            queueChange({ ...draftData, days: newDays });
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

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-12">

            {/* Trip Header Settings */}
            <div className="space-y-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold font-serif">Trip Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Trip Title</label>
                        <Input
                            value={draftData.trip_title || ''}
                            onChange={(e) => queueChange({ ...draftData, trip_title: e.target.value, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Destination</label>
                        <Input
                            value={draftData.destination || ''}
                            onChange={(e) => queueChange({ ...draftData, destination: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Summary</label>
                    <Textarea
                        value={draftData.summary || ''}
                        onChange={(e) => queueChange({ ...draftData, summary: e.target.value })}
                        className="h-24 resize-none"
                    />
                </div>
            </div>

            {/* Logistics Section (Flights & Hotels) */}
            <div className="pt-8 border-t border-gray-200 dark:border-white/10">
                <LogisticsManager data={draftData} onChange={queueChange} />
            </div>


            {/* Daily Itinerary Section */}
            <div className="space-y-12 pt-8 border-t border-gray-200 dark:border-white/10">
                <h2 className="text-2xl font-bold font-serif text-center">Daily Schedule</h2>
                {draftData.days.map((day, dayIndex) => {
                    const activityIds = day.activities.map((_, i) => `${dayIndex}-${i}`);

                    return (
                        <div key={day.day_number} className="space-y-4">
                            <div className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                                <h3 className="text-lg font-bold w-20">Day {day.day_number}</h3>
                                <Input
                                    value={day.theme || ''}
                                    onChange={(e) => {
                                        const newDays = [...draftData.days];
                                        newDays[dayIndex].theme = e.target.value;
                                        queueChange({ ...draftData, days: newDays });
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
            <div className="pt-8 border-t border-gray-200 dark:border-white/10">
                <PricingManager data={draftData} onChange={queueChange} />
            </div>

            {/* Disclaimer */}
            <div className="text-center text-sm text-gray-500 pt-8 pb-12">
                Note: Updating fields here will alter the saved itinerary directly. Changes are automatically carried over when you switch back to Preview Mode.
            </div>
        </div>
    );
}
