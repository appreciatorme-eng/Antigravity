'use client';

import { useState } from 'react';
import type { ExtractedTourData } from '@/lib/import/pdf-extractor';

interface ImportPreviewProps {
  extractedData: ExtractedTourData;
  onEdit: (data: ExtractedTourData) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function ImportPreview({ extractedData, onEdit, onSave, onCancel, isSaving }: ImportPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(extractedData.name);
  const [editedDestination, setEditedDestination] = useState(extractedData.destination);
  const [editedDuration, setEditedDuration] = useState(extractedData.duration_days);
  const [editedDescription, setEditedDescription] = useState(extractedData.description || '');
  const [editedBasePrice, setEditedBasePrice] = useState(extractedData.base_price || 0);

  const handleSaveEdits = () => {
    onEdit({
      ...extractedData,
      name: editedName,
      destination: editedDestination,
      duration_days: editedDuration,
      description: editedDescription,
      base_price: editedBasePrice > 0 ? editedBasePrice : undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Preview Extracted Tour</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Edit Details
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                type="text"
                value={editedDestination}
                onChange={(e) => setEditedDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
              <input
                type="number"
                value={editedDuration}
                onChange={(e) => setEditedDuration(parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
              <input
                type="number"
                value={editedBasePrice}
                onChange={(e) => setEditedBasePrice(parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdits}
                className="px-4 py-2 text-sm font-medium text-white bg-[#9c7c46] rounded-md hover:bg-[#8a6d3d]"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{extractedData.name}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Destination:</span>
                <p className="text-gray-900">{extractedData.destination}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <p className="text-gray-900">{extractedData.duration_days} days</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Base Price:</span>
                <p className="text-gray-900">${extractedData.base_price?.toFixed(2) || 'Not set'}</p>
              </div>
            </div>
            {extractedData.description && (
              <p className="mt-3 text-gray-600">{extractedData.description}</p>
            )}
          </>
        )}
      </div>

      {/* Days Preview */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900">Itinerary ({extractedData.days.length} days)</h3>

        {extractedData.days.map((day) => (
          <div key={day.day_number} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Day {day.day_number}: {day.title}
                </h4>
                {day.description && <p className="text-gray-600 mt-1">{day.description}</p>}
              </div>
            </div>

            {/* Activities */}
            <div className="mb-4">
              <h5 className="text-sm font-bold text-gray-700 mb-2">
                Activities ({day.activities.length})
              </h5>
              <div className="space-y-2">
                {day.activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    {activity.time && (
                      <span className="text-xs font-medium text-gray-500 min-w-[70px]">{activity.time}</span>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        {activity.is_optional && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            Optional
                          </span>
                        )}
                        {activity.is_premium && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      {activity.location && (
                        <p className="text-xs text-gray-500 mt-1">📍 {activity.location}</p>
                      )}
                      {activity.price && activity.price > 0 && (
                        <p className="text-xs text-gray-700 mt-1 font-medium">${activity.price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accommodation */}
            {day.accommodation && (
              <div>
                <h5 className="text-sm font-bold text-gray-700 mb-2">Accommodation</h5>
                <div className="p-3 bg-amber-50 rounded border border-amber-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{day.accommodation.hotel_name}</p>
                      {day.accommodation.star_rating && (
                        <p className="text-sm text-amber-600">{'⭐'.repeat(day.accommodation.star_rating)}</p>
                      )}
                      {day.accommodation.room_type && (
                        <p className="text-sm text-gray-600 mt-1">{day.accommodation.room_type}</p>
                      )}
                      {day.accommodation.amenities && day.accommodation.amenities.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {day.accommodation.amenities.join(' • ')}
                        </p>
                      )}
                    </div>
                    {day.accommodation.price_per_night && (
                      <p className="text-sm font-medium text-gray-700">
                        ${day.accommodation.price_per_night.toFixed(2)}/night
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 text-sm font-medium text-white bg-[#9c7c46] rounded-md hover:bg-[#8a6d3d] disabled:opacity-50"
        >
          {isSaving ? 'Saving Template...' : 'Save as Template'}
        </button>
      </div>
    </div>
  );
}
