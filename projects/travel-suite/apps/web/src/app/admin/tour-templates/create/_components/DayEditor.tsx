'use client';

import { GripVertical, Plus, X } from 'lucide-react';
import type { TemplateDay, TemplateActivity, TemplateAccommodation } from './types';
import { ActivityEditor } from './ActivityEditor';
import { AccommodationEditor } from './AccommodationEditor';

export interface DayEditorProps {
  day: TemplateDay;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<TemplateDay>) => void;
  onRemove: () => void;
  onAddActivity: () => void;
  onRemoveActivity: (activityId: string) => void;
  onUpdateActivity: (activityId: string, updates: Partial<TemplateActivity>) => void;
  onSetAccommodation: () => void;
  onUpdateAccommodation: (updates: Partial<TemplateAccommodation>) => void;
  onRemoveAccommodation: () => void;
}

export function DayEditor({
  day,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity,
  onSetAccommodation,
  onUpdateAccommodation,
  onRemoveAccommodation,
}: DayEditorProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] overflow-hidden">
      {/* Day Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="font-semibold text-[#1b140a]">
              Day {day.day_number}: {day.title || 'Untitled Day'}
            </h3>
            <p className="text-sm text-[#bda87f]">
              {day.activities.length} activities
              {day.accommodation ? ' \u2022 Accommodation set' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Day Content */}
      {isExpanded && (
        <div className="p-6 border-t border-[#eadfcd] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">Day Title</label>
            <input
              type="text"
              value={day.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g., Arrival & Burj Khalifa"
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
              Day Description
            </label>
            <textarea
              value={day.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              placeholder="Brief overview of this day..."
              className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
            />
          </div>

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[#1b140a]">Activities</h4>
              <button
                onClick={onAddActivity}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#9c7c46] text-white rounded hover:bg-[#8a6d3e] transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Activity
              </button>
            </div>

            <div className="space-y-3">
              {day.activities.map((activity) => (
                <ActivityEditor
                  key={activity.id}
                  activity={activity}
                  onUpdate={(updates) => onUpdateActivity(activity.id, updates)}
                  onRemove={() => onRemoveActivity(activity.id)}
                />
              ))}
            </div>
          </div>

          {/* Accommodation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[#1b140a]">Accommodation</h4>
              {!day.accommodation && (
                <button
                  onClick={onSetAccommodation}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#9c7c46] text-white rounded hover:bg-[#8a6d3e] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Hotel
                </button>
              )}
            </div>

            {day.accommodation && (
              <AccommodationEditor
                accommodation={day.accommodation}
                onUpdate={onUpdateAccommodation}
                onRemove={onRemoveAccommodation}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
