'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { TemplateAccommodation } from './types';

export interface AccommodationEditorProps {
  accommodation: TemplateAccommodation;
  onUpdate: (updates: Partial<TemplateAccommodation>) => void;
  onRemove: () => void;
}

export function AccommodationEditor({
  accommodation,
  onUpdate,
  onRemove,
}: AccommodationEditorProps) {
  const [amenityInput, setAmenityInput] = useState('');

  const addAmenity = () => {
    if (amenityInput.trim() && !accommodation.amenities.includes(amenityInput.trim())) {
      onUpdate({ amenities: [...accommodation.amenities, amenityInput.trim()] });
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    onUpdate({ amenities: accommodation.amenities.filter((a) => a !== amenity) });
  };

  return (
    <div className="p-4 bg-[#f8f1e6] rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <input
            type="text"
            value={accommodation.hotel_name}
            onChange={(e) => onUpdate({ hotel_name: e.target.value })}
            placeholder="Hotel name"
            className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <input
            type="text"
            value={accommodation.room_type}
            onChange={(e) => onUpdate({ room_type: e.target.value })}
            placeholder="Room type"
            className="px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <button
          onClick={onRemove}
          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#6f5b3e] mb-1">Star Rating</label>
          <select
            value={accommodation.star_rating}
            onChange={(e) => onUpdate({ star_rating: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          >
            <option value={1}>1 Star</option>
            <option value={2}>2 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={5}>5 Stars</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#6f5b3e] mb-1">Price/Night ($)</label>
          <input
            type="number"
            value={accommodation.price_per_night}
            onChange={(e) => onUpdate({ price_per_night: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6f5b3e] mb-1">Image URL</label>
          <input
            type="url"
            value={accommodation.image_url}
            onChange={(e) => onUpdate({ image_url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#6f5b3e] mb-1">Amenities</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {accommodation.amenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white text-xs text-[#6f5b3e] rounded"
            >
              {amenity}
              <button onClick={() => removeAmenity(amenity)} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            placeholder="Add amenity..."
            className="flex-1 px-3 py-2 border border-[#eadfcd] rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <button
            onClick={addAmenity}
            className="px-3 py-2 bg-[#9c7c46] text-white text-sm rounded hover:bg-[#8a6d3e] transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
