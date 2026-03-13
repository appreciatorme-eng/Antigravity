'use client';

import { X } from 'lucide-react';
import type { TemplateActivity } from './types';

export interface ActivityEditorProps {
  activity: TemplateActivity;
  onUpdate: (updates: Partial<TemplateActivity>) => void;
  onRemove: () => void;
}

export function ActivityEditor({ activity, onUpdate, onRemove }: ActivityEditorProps) {
  return (
    <div className="p-4 bg-[#f8f1e6] rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <input
            type="time"
            value={activity.time}
            onChange={(e) => onUpdate({ time: e.target.value })}
            className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <input
            type="text"
            value={activity.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Activity title"
            className="col-span-2 px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <button
          onClick={onRemove}
          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={activity.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        rows={2}
        placeholder="Activity description..."
        className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
      />

      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          value={activity.location}
          onChange={(e) => onUpdate({ location: e.target.value })}
          placeholder="Location"
          className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
        <input
          type="number"
          value={activity.price}
          onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
          placeholder="Price"
          min="0"
          step="0.01"
          className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
        <input
          type="url"
          value={activity.image_url}
          onChange={(e) => onUpdate({ image_url: e.target.value })}
          placeholder="Image URL"
          className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-[#6f5b3e]">
          <input
            type="checkbox"
            checked={activity.is_optional}
            onChange={(e) => onUpdate({ is_optional: e.target.checked })}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          Optional (client can toggle off)
        </label>
        <label className="flex items-center gap-2 text-sm text-[#6f5b3e]">
          <input
            type="checkbox"
            checked={activity.is_premium}
            onChange={(e) => onUpdate({ is_premium: e.target.checked })}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          Premium upgrade
        </label>
      </div>
    </div>
  );
}
