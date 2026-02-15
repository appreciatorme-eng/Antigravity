/**
 * Activity Reordering Utilities
 *
 * Database update functions for drag-and-drop reordering
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Reorder activities within a day (template or proposal)
 *
 * @param activities - Array of activities with IDs
 * @param table - Either 'template_activities' or 'proposal_activities'
 */
export async function updateActivityDisplayOrders(
  activities: Array<{ id: string }>,
  table: 'template_activities' | 'proposal_activities'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Update all activities with new display_order
    const updates = activities.map((activity, index) =>
      supabase
        .from(table)
        .update({ display_order: index })
        .eq('id', activity.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Errors updating display orders:', errors);
      return {
        success: false,
        error: `Failed to update ${errors.length} activities`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating activity display orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reorder array items (generic utility)
 *
 * @param array - Array to reorder
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Complete reorder workflow: update local state + database
 *
 * @example
 * ```tsx
 * const handleReorder = async (from, to) => {
 *   const result = await reorderActivities(
 *     activities,
 *     from,
 *     to,
 *     'template_activities',
 *     (reordered) => setActivities(reordered)
 *   );
 *
 *   if (!result.success) {
 *     alert('Failed to reorder');
 *   }
 * };
 * ```
 */
export async function reorderActivities<T extends { id: string }>(
  activities: T[],
  fromIndex: number,
  toIndex: number,
  table: 'template_activities' | 'proposal_activities',
  onUpdate: (reordered: T[]) => void
): Promise<{ success: boolean; error?: string }> {
  // Reorder locally
  const reordered = reorderArray(activities, fromIndex, toIndex);

  // Update state immediately (optimistic update)
  onUpdate(reordered);

  // Update database
  const result = await updateActivityDisplayOrders(reordered, table);

  if (!result.success) {
    // Rollback on error
    onUpdate(activities);
  }

  return result;
}
