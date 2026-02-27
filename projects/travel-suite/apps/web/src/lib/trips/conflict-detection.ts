/**
 * Trip Conflict Detection
 * Pure TypeScript logic for validating day schedules for Indian tour operators.
 */

export interface ActivitySlot {
  id: string
  name: string
  startTime: string        // "HH:MM" 24h format
  endTime: string          // "HH:MM"
  locationName: string
  lat?: number
  lng?: number
  durationMinutes: number
}

export type ConflictType =
  | 'time_overlap'
  | 'insufficient_travel_time'
  | 'unrealistic_duration'
  | 'missing_meal_break'

export interface Conflict {
  type: ConflictType
  severity: 'error' | 'warning'
  activityIds: string[]
  message: string
  suggestion: string
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Convert HH:MM to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':')
  if (parts.length !== 2) return 0
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  if (isNaN(hours) || isNaN(minutes)) return 0
  return hours * 60 + minutes
}

/**
 * Format a single conflict for display (used externally when needed).
 */
export function formatConflictMessage(conflict: Conflict): string {
  const severityLabel = conflict.severity === 'error' ? '[ERROR]' : '[WARNING]'
  return `${severityLabel} ${conflict.message} — ${conflict.suggestion}`
}

// ---------------------------------------------------------------------------
// Haversine helper
// ---------------------------------------------------------------------------

function haversineKm(
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const R = 6371
  const dLat = (bLat - aLat) * (Math.PI / 180)
  const dLng = (bLng - aLng) * (Math.PI / 180)
  const lat1 = aLat * (Math.PI / 180)
  const lat2 = bLat * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ---------------------------------------------------------------------------
// Task functions
// ---------------------------------------------------------------------------

/**
 * Estimate travel time between two activities in minutes.
 * Uses haversine distance with 40 km/h average speed for Indian cities.
 * Falls back to 20 minutes when coordinates are unavailable.
 */
export function estimateTravelTime(from: ActivitySlot, to: ActivitySlot): number {
  if (
    from.lat == null || from.lng == null ||
    to.lat == null || to.lng == null
  ) {
    return 20
  }
  const distKm = haversineKm(from.lat, from.lng, to.lat, to.lng)
  // 40 km/h + 5-minute buffer for urban conditions
  const travelMinutes = Math.round((distKm / 40) * 60) + 5
  return Math.max(5, Math.min(travelMinutes, 180))
}

/**
 * Detect time overlaps between activities on the same day.
 * Activities are assumed to be sorted by startTime.
 * An overlap occurs when activity B starts before activity A ends.
 */
export function detectOverlaps(activities: ActivitySlot[]): Conflict[] {
  if (activities.length < 2) return []

  const sorted = [...activities].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  const conflicts: Conflict[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentEnd = timeToMinutes(current.endTime)
    const nextStart = timeToMinutes(next.startTime)

    if (nextStart < currentEnd) {
      const overlapMinutes = currentEnd - nextStart
      conflicts.push({
        type: 'time_overlap',
        severity: 'error',
        activityIds: [current.id, next.id],
        message: `"${current.name}" and "${next.name}" overlap by ${overlapMinutes} minute${overlapMinutes !== 1 ? 's' : ''}.`,
        suggestion: `Move "${next.name}" to start at ${current.endTime} or later.`,
      })
    }
  }

  return conflicts
}

/**
 * Check if there is enough gap between consecutive activities for travel.
 * Uses estimateTravelTime; flags when the gap is less than estimated travel time.
 */
export function checkTravelFeasibility(activities: ActivitySlot[]): Conflict[] {
  if (activities.length < 2) return []

  const sorted = [...activities].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  const conflicts: Conflict[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const to = sorted[i + 1]

    const fromEnd = timeToMinutes(from.endTime)
    const toStart = timeToMinutes(to.startTime)
    const gap = toStart - fromEnd

    // Skip if there's already an overlap conflict (gap is negative)
    if (gap <= 0) continue

    // Skip if both activities are at the same location
    if (
      from.locationName &&
      to.locationName &&
      from.locationName.trim().toLowerCase() === to.locationName.trim().toLowerCase()
    ) {
      continue
    }

    const travelNeeded = estimateTravelTime(from, to)

    if (gap < travelNeeded) {
      const deficit = travelNeeded - gap
      conflicts.push({
        type: 'insufficient_travel_time',
        severity: 'warning',
        activityIds: [from.id, to.id],
        message: `Only ${gap} min gap between "${from.name}" and "${to.name}", but ~${travelNeeded} min travel time needed.`,
        suggestion: `Add at least ${deficit} more minute${deficit !== 1 ? 's' : ''} between these activities, or adjust start time of "${to.name}".`,
      })
    }
  }

  return conflicts
}

/**
 * Flag activities shorter than 15 minutes (unrealistically short) or
 * longer than 480 minutes / 8 hours (unrealistically long).
 */
export function validateDurations(activities: ActivitySlot[]): Conflict[] {
  const conflicts: Conflict[] = []

  for (const activity of activities) {
    const startMin = timeToMinutes(activity.startTime)
    const endMin = timeToMinutes(activity.endTime)
    const computedDuration = endMin > startMin ? endMin - startMin : activity.durationMinutes

    if (computedDuration < 15) {
      conflicts.push({
        type: 'unrealistic_duration',
        severity: 'warning',
        activityIds: [activity.id],
        message: `"${activity.name}" is scheduled for only ${computedDuration} minute${computedDuration !== 1 ? 's' : ''}, which may be too short.`,
        suggestion: `Increase the duration of "${activity.name}" to at least 15 minutes, or remove it if it's a transit note.`,
      })
    } else if (computedDuration > 480) {
      conflicts.push({
        type: 'unrealistic_duration',
        severity: 'warning',
        activityIds: [activity.id],
        message: `"${activity.name}" spans ${Math.round(computedDuration / 60)} hours, which is unusually long.`,
        suggestion: `Consider splitting "${activity.name}" into multiple activities with breaks in between.`,
      })
    }
  }

  return conflicts
}

/**
 * Check for missing meal breaks.
 * Lunch window: 12:00–14:00. Dinner window: 19:00–21:00.
 * A meal break is considered present if there is a continuous gap of
 * at least 30 minutes within each window where no activity is running.
 */
export function checkMealBreaks(activities: ActivitySlot[]): Conflict[] {
  if (activities.length === 0) return []

  const conflicts: Conflict[] = []

  const mealWindows = [
    { label: 'lunch', start: 12 * 60, end: 14 * 60 },
    { label: 'dinner', start: 19 * 60, end: 21 * 60 },
  ]

  // Build a set of minute-by-minute occupancy
  const occupied = new Set<number>()
  for (const activity of activities) {
    const s = timeToMinutes(activity.startTime)
    const e = timeToMinutes(activity.endTime)
    for (let m = s; m < e; m++) {
      occupied.add(m)
    }
  }

  for (const window of mealWindows) {
    // Find the longest contiguous free block within the window
    let longestFreeBlock = 0
    let currentFreeBlock = 0

    for (let m = window.start; m < window.end; m++) {
      if (!occupied.has(m)) {
        currentFreeBlock++
        if (currentFreeBlock > longestFreeBlock) {
          longestFreeBlock = currentFreeBlock
        }
      } else {
        currentFreeBlock = 0
      }
    }

    if (longestFreeBlock < 30) {
      // Gather all activities that fall within or overlap the meal window
      const windowActivityIds = activities
        .filter((a) => {
          const s = timeToMinutes(a.startTime)
          const e = timeToMinutes(a.endTime)
          return s < window.end && e > window.start
        })
        .map((a) => a.id)

      // Use all activity ids if none specifically in window (full-day conflict)
      const affectedIds =
        windowActivityIds.length > 0
          ? windowActivityIds
          : activities.map((a) => a.id)

      conflicts.push({
        type: 'missing_meal_break',
        severity: 'warning',
        activityIds: affectedIds,
        message: `No ${window.label} break detected between ${window.label === 'lunch' ? '12:00–14:00' : '19:00–21:00'}.`,
        suggestion: `Schedule at least a 30-minute ${window.label} break for travelers. Indian meal etiquette expects adequate dining time.`,
      })
    }
  }

  return conflicts
}

// ---------------------------------------------------------------------------
// Master validator
// ---------------------------------------------------------------------------

/**
 * Run all conflict checks against a list of activities for a single day.
 * Deduplicates conflicts that share the exact same activityIds array.
 */
export function validateDaySchedule(activities: ActivitySlot[]): Conflict[] {
  if (activities.length === 0) return []

  const raw: Conflict[] = [
    ...detectOverlaps(activities),
    ...checkTravelFeasibility(activities),
    ...validateDurations(activities),
    ...checkMealBreaks(activities),
  ]

  // Deduplicate by type + sorted activityIds fingerprint
  const seen = new Set<string>()
  const deduplicated: Conflict[] = []

  for (const conflict of raw) {
    const key = `${conflict.type}::${[...conflict.activityIds].sort().join(',')}`
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(conflict)
    }
  }

  // Sort: errors first, then warnings
  deduplicated.sort((a, b) => {
    if (a.severity === b.severity) return 0
    return a.severity === 'error' ? -1 : 1
  })

  return deduplicated
}
