'use client'

import { useState, useEffect, useCallback } from 'react'

export interface RealtimeMetrics {
  activeTrips: number
  todayRevenue: number          // paise
  pendingQuotes: number
  unreadWhatsApp: number
  driversOnRoute: number
  newLeadsToday: number
  lastUpdated: Date
  isLive: boolean               // connection status
}

export interface RealtimeUpdate {
  type: 'new_whatsapp' | 'payment_received' | 'trip_started' | 'new_lead' | 'driver_update'
  title: string
  description: string
  amount?: number               // paise, if payment
  timestamp: Date
  id: string
}

interface UseRealtimeUpdatesOptions {
  pollIntervalMs?: number       // default 30000 (30s)
  enabled?: boolean             // default true
}

const INDIAN_NAMES = [
  'Sharma ji',
  'Mehta family',
  'Kumar saab',
  'Kapoor group',
  'Gupta ji',
  'Verma family',
  'Nair group',
  'Pillai saab',
]

const DESTINATIONS = [
  'Rajasthan',
  'Kerala',
  'Goa',
  'Ladakh',
  'Himachal Pradesh',
  'Uttarakhand',
  'Andaman',
  'Kashmir',
  'Coorg',
  'Varanasi',
]

const DRIVER_NAMES = [
  'Ramesh bhai',
  'Suresh ji',
  'Dinesh Kumar',
  'Mahesh Yadav',
  'Rakesh Singh',
  'Naresh Sharma',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateUpdate(): RealtimeUpdate {
  const updateTypes: RealtimeUpdate['type'][] = [
    'new_whatsapp',
    'payment_received',
    'trip_started',
    'new_lead',
    'driver_update',
  ]
  const type = randomItem(updateTypes)
  const name = randomItem(INDIAN_NAMES)
  const destination = randomItem(DESTINATIONS)

  switch (type) {
    case 'new_whatsapp':
      return {
        type,
        title: `New WhatsApp from ${name}`,
        description: `Inquiry about ${destination}`,
        timestamp: new Date(),
        id: generateUUID(),
      }
    case 'payment_received': {
      // Random amount between ₹5,000 and ₹75,000 in paise
      const amount = randomInt(5000, 75000) * 100
      return {
        type,
        title: 'Payment received',
        description: `₹${(amount / 100).toLocaleString('en-IN')} received from ${name}`,
        amount,
        timestamp: new Date(),
        id: generateUUID(),
      }
    }
    case 'trip_started':
      return {
        type,
        title: 'Trip started',
        description: `${destination} trip is underway`,
        timestamp: new Date(),
        id: generateUUID(),
      }
    case 'new_lead':
      return {
        type,
        title: 'New lead',
        description: `${name} enquired about ${destination}`,
        timestamp: new Date(),
        id: generateUUID(),
      }
    case 'driver_update':
      return {
        type,
        title: 'Driver update',
        description: `${randomItem(DRIVER_NAMES)} reached pickup point`,
        timestamp: new Date(),
        id: generateUUID(),
      }
  }
}

const INITIAL_METRICS: RealtimeMetrics = {
  activeTrips: 23,
  todayRevenue: 185000_00,     // ₹1,85,000 in paise
  pendingQuotes: 7,
  unreadWhatsApp: 4,
  driversOnRoute: 8,
  newLeadsToday: 3,
  lastUpdated: new Date(),
  isLive: true,
}

export function useRealtimeUpdates(options?: UseRealtimeUpdatesOptions): {
  metrics: RealtimeMetrics
  updates: RealtimeUpdate[]
  isConnected: boolean
  lastPing: Date | null
  clearUpdates: () => void
} {
  const pollIntervalMs = options?.pollIntervalMs ?? 30_000
  const enabled = options?.enabled ?? true

  const [metrics, setMetrics] = useState<RealtimeMetrics>(INITIAL_METRICS)
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([])
  const [lastPing, setLastPing] = useState<Date | null>(null)

  const clearUpdates = useCallback(() => {
    setUpdates([])
  }, [])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      // Randomly update 1–2 metrics with small deltas
      setMetrics((prev) => {
        const next = { ...prev, lastUpdated: new Date() }

        // Always nudge revenue
        const revDelta = (randomInt(-5, 5) * 5000_00) as number
        next.todayRevenue = Math.max(0, prev.todayRevenue + revDelta)

        // Randomly pick one count metric to bump
        const countTargets = [
          'activeTrips',
          'pendingQuotes',
          'unreadWhatsApp',
          'driversOnRoute',
          'newLeadsToday',
        ] as const

        const target = randomItem([...countTargets])
        const delta = randomInt(-1, 3)
        next[target] = Math.max(0, (prev[target] as number) + delta)

        // Occasionally bump a second metric
        if (Math.random() > 0.5) {
          const target2 = randomItem([...countTargets])
          const delta2 = randomInt(-1, 2)
          next[target2] = Math.max(0, (prev[target2] as number) + delta2)
        }

        return next
      })

      // Generate a new update notification
      const newUpdate = generateUpdate()
      setUpdates((prev) => [newUpdate, ...prev].slice(0, 10))

      setLastPing(new Date())
    }

    const intervalId = setInterval(tick, pollIntervalMs)

    // Fire once immediately so UI feels live on mount
    tick()

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, pollIntervalMs])

  return {
    metrics,
    updates,
    isConnected: true, // stub: always true (real: Supabase Realtime channel status)
    lastPing,
    clearUpdates,
  }
}
