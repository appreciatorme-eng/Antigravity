/**
 * Activity List Component with Drag-and-Drop
 *
 * Example integration of DraggableActivity with database updates
 * Use this as a reference for integrating drag-and-drop in your pages
 */

'use client';

import { useState } from 'react';
import DraggableActivity from './DraggableActivity';
import { reorderActivities } from '@/lib/activities/reorder';
import { X, Clock, DollarSign, MapPin } from 'lucide-react';

interface Activity {
  id: string;
  time?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  price: number;
  is_optional?: boolean;
  is_premium?: boolean;
  display_order: number;
}

interface ActivityListProps {
  activities: Activity[];
  onUpdate: (activities: Activity[]) => void;
  onRemove?: (activityId: string) => void;
  table: 'template_activities' | 'proposal_activities';
  editable?: boolean;
}

/**
 * Draggable activity list with database sync
 *
 * @example
 * ```tsx
 * <ActivityList
 *   activities={dayActivities}
 *   onUpdate={(updated) => setDayActivities(updated)}
 *   onRemove={(id) => handleRemove(id)}
 *   table="template_activities"
 *   editable={true}
 * />
 * ```
 */
export default function ActivityList({
  activities,
  onUpdate,
  onRemove,
  table,
  editable = true,
}: ActivityListProps) {
  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setIsReordering(true);

    const result = await reorderActivities(
      activities,
      fromIndex,
      toIndex,
      table,
      onUpdate
    );

    if (!result.success) {
      alert(`Failed to reorder: ${result.error}`);
    }

    setIsReordering(false);
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
        <p>No activities added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      {isReordering && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-sm text-gray-600">Updating order...</div>
        </div>
      )}

      {activities.map((activity, index) => (
        <DraggableActivity
          key={activity.id}
          activity={activity}
          index={index}
          onReorder={handleReorder}
        >
          <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#9c7c46] transition-colors">
            {/* Activity Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {activity.time && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </span>
                )}
                <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                {activity.is_optional && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    Optional
                  </span>
                )}
                {activity.is_premium && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                    Premium
                  </span>
                )}
              </div>

              {activity.description && (
                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
              )}

              {activity.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </p>
              )}
            </div>

            {/* Price */}
            {activity.price > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-semibold text-[#9c7c46]">
                  <DollarSign className="w-4 h-4" />
                  {activity.price.toFixed(2)}
                </div>
              </div>
            )}

            {/* Remove Button */}
            {editable && onRemove && (
              <button
                onClick={() => onRemove(activity.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove activity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </DraggableActivity>
      ))}

      {/* Instructions */}
      {editable && activities.length > 1 && (
        <div className="text-xs text-gray-500 text-center py-2">
          💡 Hover over an activity and drag the handle to reorder
        </div>
      )}
    </div>
  );
}
