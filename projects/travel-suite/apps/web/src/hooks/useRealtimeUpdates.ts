'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

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
  organizationId?: string       // scope queries to an org
  enabled?: boolean             // default true
}

const ZERO_METRICS: RealtimeMetrics = {
  activeTrips: 0,
  todayRevenue: 0,
  pendingQuotes: 0,
  unreadWhatsApp: 0,
  driversOnRoute: 0,
  newLeadsToday: 0,
  lastUpdated: new Date(),
  isLive: false,
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

async function fetchMetrics(organizationId: string | undefined): Promise<RealtimeMetrics> {
  const supabase = createClient()
  const today = todayIso()

  const [
    activeTripsRes,
    driversOnRouteRes,
    todayRevenueRes,
    pendingQuotesRes,
    newLeadsTodayRes,
    unreadWhatsAppRes,
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .match(organizationId ? { organization_id: organizationId } : {}),

    supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .not('driver_id', 'is', null)
      .match(organizationId ? { organization_id: organizationId } : {}),

    supabase
      .from('payment_links')
      .select('amount_paise')
      .eq('status', 'paid')
      .gte('paid_at', `${today}T00:00:00.000Z`)
      .match(organizationId ? { organization_id: organizationId } : {}),

    supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'pending'])
      .match(organizationId ? { organization_id: organizationId } : {}),

    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('lifecycle_stage', 'lead')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .match(organizationId ? { organization_id: organizationId } : {}),

    supabase
      .from('whatsapp_webhook_events')
      .select('id', { count: 'exact', head: true })
      .eq('processing_status', 'pending')
      .gte('received_at', `${today}T00:00:00.000Z`),
  ])

  const todayRevenue = (todayRevenueRes.data ?? []).reduce(
    (sum, row) => sum + (row.amount_paise ?? 0),
    0,
  )

  return {
    activeTrips: activeTripsRes.count ?? 0,
    driversOnRoute: driversOnRouteRes.count ?? 0,
    todayRevenue,
    pendingQuotes: pendingQuotesRes.count ?? 0,
    newLeadsToday: newLeadsTodayRes.count ?? 0,
    unreadWhatsApp: unreadWhatsAppRes.count ?? 0,
    lastUpdated: new Date(),
    isLive: true,
  }
}

function makeUpdateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function useRealtimeUpdates(options?: UseRealtimeUpdatesOptions): {
  metrics: RealtimeMetrics
  updates: RealtimeUpdate[]
  isConnected: boolean
  lastPing: Date | null
  clearUpdates: () => void
} {
  const enabled = options?.enabled ?? true
  const organizationId = options?.organizationId

  const [metrics, setMetrics] = useState<RealtimeMetrics>(ZERO_METRICS)
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastPing, setLastPing] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const clearUpdates = useCallback(() => {
    setUpdates([])
  }, [])

  const pushUpdate = useCallback((update: RealtimeUpdate) => {
    setUpdates((prev) => [update, ...prev].slice(0, 10))
    setLastPing(new Date())
  }, [])

  const refreshMetrics = useCallback(() => {
    fetchMetrics(organizationId).then((fresh) => {
      setMetrics(fresh)
    }).catch((err: unknown) => {
      console.error('[useRealtimeUpdates] metrics refresh failed:', err)
    })
  }, [organizationId])

  useEffect(() => {
    if (!enabled) return

    // Initial load
    refreshMetrics()

    const supabase = createClient()
    const channel = supabase.channel('dashboard-realtime')

    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: 'status=eq.in_progress' }, (payload) => {
        const row = payload.new as { destination?: string; name?: string }
        pushUpdate({
          type: 'trip_started',
          title: 'Trip started',
          description: `${row.destination ?? row.name ?? 'A trip'} is now underway`,
          timestamp: new Date(),
          id: makeUpdateId(),
        })
        refreshMetrics()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_links' }, (payload) => {
        const row = payload.new as { amount_paise?: number; client_name?: string; status?: string }
        if (row.status === 'paid') {
          pushUpdate({
            type: 'payment_received',
            title: 'Payment received',
            description: `₹${((row.amount_paise ?? 0) / 100).toLocaleString('en-IN')} received${row.client_name ? ` from ${row.client_name}` : ''}`,
            amount: row.amount_paise ?? 0,
            timestamp: new Date(),
            id: makeUpdateId(),
          })
          refreshMetrics()
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payment_links', filter: 'status=eq.paid' }, (payload) => {
        const row = payload.new as { amount_paise?: number; client_name?: string }
        pushUpdate({
          type: 'payment_received',
          title: 'Payment received',
          description: `₹${((row.amount_paise ?? 0) / 100).toLocaleString('en-IN')} received${row.client_name ? ` from ${row.client_name}` : ''}`,
          amount: row.amount_paise ?? 0,
          timestamp: new Date(),
          id: makeUpdateId(),
        })
        refreshMetrics()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'proposals' }, (payload) => {
        const row = payload.new as { title?: string }
        pushUpdate({
          type: 'new_lead',
          title: 'New quote request',
          description: row.title ?? 'A new proposal was created',
          timestamp: new Date(),
          id: makeUpdateId(),
        })
        refreshMetrics()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_webhook_events' }, (payload) => {
        const row = payload.new as { event_type?: string; wa_id?: string }
        pushUpdate({
          type: 'new_whatsapp',
          title: 'New WhatsApp message',
          description: `Incoming ${row.event_type ?? 'message'}${row.wa_id ? ` from ${row.wa_id}` : ''}`,
          timestamp: new Date(),
          id: makeUpdateId(),
        })
        refreshMetrics()
      })
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        setIsConnected(connected)
        if (connected) {
          setLastPing(new Date())
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel).catch((err: unknown) => {
        console.error('[useRealtimeUpdates] channel cleanup failed:', err)
      })
    }
  }, [enabled, organizationId, pushUpdate, refreshMetrics])

  return {
    metrics,
    updates,
    isConnected,
    lastPing,
    clearUpdates,
  }
}
