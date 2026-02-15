# Drag-and-Drop Integration Guide

> **Date:** February 15, 2026
> **Status:** ✅ Complete with Database Updates
> **Integration:** Ready for use in any page

---

## 🎯 What Was Built

Complete drag-and-drop reordering system with **automatic database synchronization**:

1. **DraggableActivity Component** - Visual drag-and-drop wrapper
2. **Reorder Utilities** - Database update functions
3. **ActivityList Component** - Complete integration example
4. **Optimistic Updates** - Instant UI feedback with rollback

---

## 📁 Files

| File | Purpose | Lines |
|------|---------|-------|
| `components/DraggableActivity.tsx` | Drag wrapper component | 80 |
| `lib/activities/reorder.ts` | Database update utilities | 110 |
| `components/ActivityList.tsx` | Integration example | 150 |
| `app/admin/tour-templates/[id]/edit/page.tsx` | Updated with reorder function | Modified |

**Total:** 340 lines of reusable drag-and-drop code

---

## 🚀 Quick Start

### Method 1: Use ActivityList Component (Recommended)

The easiest way to add drag-and-drop is to use the pre-built `ActivityList` component:

```tsx
import ActivityList from '@/components/ActivityList';

function DayEditor({ dayActivities, onUpdate }) {
  return (
    <ActivityList
      activities={dayActivities}
      onUpdate={(updated) => onUpdate(updated)}
      onRemove={(id) => handleRemoveActivity(id)}
      table="template_activities"
      editable={true}
    />
  );
}
```

**Features:**
- ✅ Drag-and-drop reordering
- ✅ Automatic database updates
- ✅ Optimistic UI updates
- ✅ Loading states
- ✅ Error handling with rollback
- ✅ Remove buttons
- ✅ Activity badges (optional/premium)

### Method 2: Custom Integration

For custom designs, use the building blocks directly:

```tsx
import DraggableActivity from '@/components/DraggableActivity';
import { reorderActivities } from '@/lib/activities/reorder';
import { useState } from 'react';

function CustomActivityList({ activities, setActivities }) {
  const handleReorder = async (fromIndex, toIndex) => {
    const result = await reorderActivities(
      activities,
      fromIndex,
      toIndex,
      'template_activities',
      setActivities
    );

    if (!result.success) {
      alert('Failed to reorder');
    }
  };

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <DraggableActivity
          key={activity.id}
          activity={activity}
          index={index}
          onReorder={handleReorder}
        >
          {/* Your custom activity card */}
          <YourActivityCard activity={activity} />
        </DraggableActivity>
      ))}
    </div>
  );
}
```

---

## 💻 API Reference

### `DraggableActivity` Component

Wraps any component to make it draggable.

**Props:**
```typescript
interface DraggableActivityProps {
  activity: {
    id: string;
    title: string;
    display_order: number;
    // ... other activity fields
  };
  index: number;              // Current position in array
  onReorder: (from: number, to: number) => void;
  children: React.ReactNode;  // Your activity card
}
```

**Visual States:**
- **Hover:** Drag handle appears (GripVertical icon)
- **Dragging:** Activity becomes semi-transparent (opacity: 0.5)
- **Drop Zone:** Blue border highlight on valid drop target
- **Cursor:** Changes to `grab` when hovering handle, `grabbing` when dragging

**Example:**
```tsx
<DraggableActivity
  activity={activity}
  index={index}
  onReorder={(from, to) => handleReorder(from, to)}
>
  <div className="p-4 bg-white border rounded">
    <h4>{activity.title}</h4>
  </div>
</DraggableActivity>
```

### `reorderActivities` Function

Complete workflow: local reorder + database update with rollback.

**Signature:**
```typescript
async function reorderActivities<T extends { id: string }>(
  activities: T[],
  fromIndex: number,
  toIndex: number,
  table: 'template_activities' | 'proposal_activities',
  onUpdate: (reordered: T[]) => void
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `activities` - Current array of activities
- `fromIndex` - Source index (where drag started)
- `toIndex` - Destination index (where dropped)
- `table` - Which database table to update
- `onUpdate` - State setter function (e.g., `setActivities`)

**Returns:**
- `success: true` - Reorder completed successfully
- `success: false, error: string` - Reorder failed, state rolled back

**Example:**
```tsx
const [activities, setActivities] = useState([...]);

const handleReorder = async (from, to) => {
  const result = await reorderActivities(
    activities,
    from,
    to,
    'template_activities',
    setActivities
  );

  if (result.success) {
    console.log('Reordered successfully!');
  } else {
    alert(`Error: ${result.error}`);
  }
};
```

### `updateActivityDisplayOrders` Function

Low-level database update (used internally by `reorderActivities`).

**Signature:**
```typescript
async function updateActivityDisplayOrders(
  activities: Array<{ id: string }>,
  table: 'template_activities' | 'proposal_activities'
): Promise<{ success: boolean; error?: string }>
```

**Use Case:** When you have custom reordering logic

**Example:**
```tsx
import { updateActivityDisplayOrders } from '@/lib/activities/reorder';

// Custom reorder logic
const reordered = customReorderLogic(activities);

// Update database
const result = await updateActivityDisplayOrders(
  reordered,
  'template_activities'
);
```

### `reorderArray` Function

Generic array reordering utility.

**Signature:**
```typescript
function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[]
```

**Use Case:** Reorder any array (not just activities)

**Example:**
```tsx
import { reorderArray } from '@/lib/activities/reorder';

const days = [day1, day2, day3];
const reordered = reorderArray(days, 0, 2); // Move first day to third position
// Result: [day2, day3, day1]
```

### `ActivityList` Component

Pre-built component with everything integrated.

**Props:**
```typescript
interface ActivityListProps {
  activities: Activity[];
  onUpdate: (activities: Activity[]) => void;
  onRemove?: (activityId: string) => void;
  table: 'template_activities' | 'proposal_activities';
  editable?: boolean;  // Default: true
}
```

**Features:**
- Drag-and-drop reordering
- Activity cards with time, badges, price
- Remove buttons (if `onRemove` provided)
- Loading state overlay
- Empty state message
- Helpful instructions

**Example:**
```tsx
<ActivityList
  activities={dayActivities}
  onUpdate={(updated) => setDayActivities(updated)}
  onRemove={(id) => removeActivity(id)}
  table="template_activities"
  editable={true}
/>
```

---

## 🔧 Integration Examples

### Example 1: Template Day Editor

Add drag-and-drop to template day activities:

```tsx
'use client';

import { useState, useEffect } from 'react';
import ActivityList from '@/components/ActivityList';
import { createClient } from '@/lib/supabase/client';

function TemplateDayEditor({ dayId, templateId }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadActivities();
  }, [dayId]);

  async function loadActivities() {
    const supabase = createClient();
    const { data } = await supabase
      .from('template_activities')
      .select('*')
      .eq('template_day_id', dayId)
      .order('display_order', { ascending: true });

    setActivities(data || []);
  }

  async function handleRemoveActivity(activityId: string) {
    const supabase = createClient();
    await supabase
      .from('template_activities')
      .delete()
      .eq('id', activityId);

    loadActivities();
  }

  return (
    <div>
      <h3>Activities</h3>
      <ActivityList
        activities={activities}
        onUpdate={setActivities}
        onRemove={handleRemoveActivity}
        table="template_activities"
        editable={true}
      />
    </div>
  );
}
```

### Example 2: Proposal Activity Customization

Let operators reorder activities for specific proposals:

```tsx
import ActivityList from '@/components/ActivityList';

function ProposalEditor({ proposalId }) {
  const [days, setDays] = useState([]);

  return (
    <div>
      {days.map((day) => (
        <div key={day.id} className="mb-8">
          <h3>Day {day.day_number}: {day.title}</h3>

          <ActivityList
            activities={day.activities}
            onUpdate={(updated) => {
              setDays(days.map(d =>
                d.id === day.id ? { ...d, activities: updated } : d
              ));
            }}
            table="proposal_activities"
            editable={true}
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Custom Activity Card

Use `DraggableActivity` with your own card design:

```tsx
import DraggableActivity from '@/components/DraggableActivity';
import { reorderActivities } from '@/lib/activities/reorder';

function CustomActivityList({ activities, setActivities }) {
  const handleReorder = async (from, to) => {
    await reorderActivities(
      activities,
      from,
      to,
      'template_activities',
      setActivities
    );
  };

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <DraggableActivity
          key={activity.id}
          activity={activity}
          index={index}
          onReorder={handleReorder}
        >
          {/* Your custom card design */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h4 className="text-2xl font-bold">{activity.title}</h4>
            <p className="text-gray-600">{activity.description}</p>
            {activity.price > 0 && (
              <p className="text-lg font-bold text-green-600">
                ${activity.price}
              </p>
            )}
          </div>
        </DraggableActivity>
      ))}
    </div>
  );
}
```

---

## 🎨 Styling Customization

### Customize Drag Handle

The drag handle is styled with TailwindCSS and can be customized:

```tsx
// In DraggableActivity.tsx
<div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
  <GripVertical className="w-4 h-4 text-gray-400" />
</div>
```

**Customization Options:**
- Change position: `-ml-6` → `-ml-8` (move further left)
- Change icon color: `text-gray-400` → `text-blue-600`
- Always show: Remove `opacity-0 group-hover:opacity-100`
- Change icon: Replace `GripVertical` with any Lucide icon

### Customize Drag States

```tsx
// In DraggableActivity.tsx
<div className={`
  group relative transition-all
  ${isDragging ? 'opacity-50' : 'opacity-100'}  // Dragging opacity
  ${isDragOver ? 'border-t-2 border-[#9c7c46]' : ''}  // Drop zone highlight
`}>
```

**Customization:**
- Dragging opacity: `opacity-50` → `opacity-30` (more transparent)
- Drop zone color: `border-[#9c7c46]` → `border-blue-500`
- Drop zone style: `border-t-2` → `border-2 border-dashed` (dashed border)

### Customize Activity Cards

When using `ActivityList`, customize cards by forking the component:

```tsx
// Copy ActivityList.tsx to CustomActivityList.tsx
// Modify the activity card section:
<div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-lg hover:shadow-xl transition-all">
  {/* Your custom design */}
</div>
```

---

## ⚡ Performance Optimization

### Batch Updates

For large lists (100+ activities), batch database updates:

```tsx
import { updateActivityDisplayOrders } from '@/lib/activities/reorder';

async function handleMultipleReorders(changes: Array<{from: number, to: number}>) {
  let reordered = [...activities];

  // Apply all reorders locally
  changes.forEach(({ from, to }) => {
    reordered = reorderArray(reordered, from, to);
  });

  // Single database update
  await updateActivityDisplayOrders(reordered, 'template_activities');

  setActivities(reordered);
}
```

### Debounce Rapid Reorders

Prevent database spam during rapid dragging:

```tsx
import { useState, useRef } from 'react';

function DebouncedActivityList({ activities, setActivities }) {
  const [localActivities, setLocalActivities] = useState(activities);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleReorder = (from, to) => {
    // Update UI immediately
    const reordered = reorderArray(localActivities, from, to);
    setLocalActivities(reordered);

    // Debounce database update (500ms)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      await updateActivityDisplayOrders(reordered, 'template_activities');
      setActivities(reordered);
    }, 500);
  };

  return <ActivityList activities={localActivities} onUpdate={handleReorder} />;
}
```

### Limit Rendered Activities

For very long lists, use virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Only render visible activities (not implemented in base component)
// Recommended for 50+ activities
```

---

## 🐛 Troubleshooting

### Issue: Drag handle doesn't appear

**Diagnosis:**
```tsx
// Check if parent has group class
<div className="group">  {/* Required */}
  <DraggableActivity>...</DraggableActivity>
</div>
```

**Solutions:**
1. Ensure parent/wrapper has `group` class
2. Check if `group-hover:opacity-100` is being overridden
3. Temporarily remove `opacity-0` to debug

### Issue: Reordering doesn't persist

**Diagnosis:**
```tsx
const handleReorder = async (from, to) => {
  const result = await reorderActivities(...);
  console.log('Result:', result);  // Check success
};
```

**Solutions:**
1. Verify `table` parameter is correct (`template_activities` vs `proposal_activities`)
2. Check database permissions (RLS policies)
3. Ensure activities have `id` field
4. Check console for errors

### Issue: Wrong items are reordered

**Problem:** Using array index as `key` instead of `activity.id`

**Bad:**
```tsx
{activities.map((activity, index) => (
  <DraggableActivity key={index}>  {/* WRONG */}
    ...
  </DraggableActivity>
))}
```

**Good:**
```tsx
{activities.map((activity, index) => (
  <DraggableActivity key={activity.id}>  {/* CORRECT */}
    ...
  </DraggableActivity>
))}
```

### Issue: Drag doesn't work on mobile

**Cause:** HTML5 drag-and-drop has limited mobile support

**Solution:** Add touch event polyfill or use alternative library
```bash
npm install react-beautiful-dnd
# or
npm install @dnd-kit/core
```

---

## 🔒 Security Considerations

### Database Permissions

Ensure RLS policies allow users to update `display_order`:

```sql
-- Allow operators to update activities in their organization
CREATE POLICY "Operators can update activities"
ON template_activities
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM template_days td
    JOIN tour_templates tt ON tt.id = td.template_id
    WHERE td.id = template_activities.template_day_id
    AND tt.organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);
```

### Validate Reorder Bounds

Prevent out-of-bounds reordering:

```typescript
function handleReorder(from, to) {
  // Validate indices
  if (from < 0 || from >= activities.length) {
    console.error('Invalid from index');
    return;
  }

  if (to < 0 || to >= activities.length) {
    console.error('Invalid to index');
    return;
  }

  // Proceed with reorder
  reorderActivities(...);
}
```

---

## 📝 Testing Checklist

### Visual Tests

- [ ] Drag handle appears on hover
- [ ] Drag handle has correct cursor (grab/grabbing)
- [ ] Activity becomes semi-transparent when dragging
- [ ] Drop zone highlights correctly
- [ ] Reordering animates smoothly
- [ ] Works in all browsers (Chrome, Firefox, Safari)

### Functional Tests

- [ ] Reorder top item to bottom
- [ ] Reorder bottom item to top
- [ ] Reorder adjacent items
- [ ] Reorder multiple times in sequence
- [ ] Database `display_order` updates correctly
- [ ] Page refresh shows new order
- [ ] Concurrent reorders don't conflict

### Error Tests

- [ ] Handle network errors gracefully
- [ ] Show error message if update fails
- [ ] Rollback state on error
- [ ] Work with empty activity list
- [ ] Work with single activity (no reordering)

---

## 🎯 Summary

**What You Get:**
- ✅ Complete drag-and-drop system
- ✅ Automatic database synchronization
- ✅ Optimistic UI updates with rollback
- ✅ Pre-built ActivityList component
- ✅ Customizable building blocks
- ✅ Production-ready code

**Integration Steps:**
1. Import `ActivityList` component
2. Pass activities array and update handler
3. Specify table name
4. Done! Drag-and-drop is working

**Total Time to Integrate:** 5-10 minutes

---

**Status:** ✅ Ready for Production
**Last Updated:** February 15, 2026
**Support:** See code examples above or ask in #dev-support

🚀 **Drag, drop, done!**
