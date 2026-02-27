'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, CheckCircle, Clock, Send, Eye, AlertCircle } from 'lucide-react'
import {
  getPaymentLink,
  recordEvent,
  formatPaymentAmount,
  getStatusColor,
  isExpired,
  createPaymentLink,
  type PaymentLinkData,
  type PaymentEvent,
} from '@/lib/payments/link-tracker'

interface PaymentTrackerProps {
  token?: string
  tripId?: string
  clientName?: string
  amount?: number // paise
  className?: string
}

interface TimelineStep {
  key: string
  label: string
  eventType: string
  icon: React.ReactNode
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: 'created', label: 'Link Created', eventType: 'created', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'sent', label: 'Sent via WhatsApp', eventType: 'sent', icon: <Send className="w-3.5 h-3.5" /> },
  { key: 'viewed', label: 'Client Viewed', eventType: 'viewed', icon: <Eye className="w-3.5 h-3.5" /> },
  { key: 'paid', label: 'Payment Received', eventType: 'paid', icon: <CheckCircle className="w-3.5 h-3.5" /> },
]

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PaymentTracker({
  token,
  tripId,
  clientName,
  amount,
  className = '',
}: PaymentTrackerProps) {
  const [link, setLink] = useState<PaymentLinkData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [spin, setSpin] = useState(false)

  const loadLink = useCallback(() => {
    if (!token) return
    const data = getPaymentLink(token)
    if (data) {
      // Auto-mark expired if needed
      if (isExpired(data) && data.status !== 'paid' && data.status !== 'expired') {
        recordEvent(token, { type: 'expired', timestamp: new Date().toISOString() })
        setLink({ ...data, status: 'expired' })
      } else {
        setLink(data)
      }
    }
  }, [token])

  const handleRefresh = useCallback(() => {
    setSpin(true)
    setIsRefreshing(true)
    loadLink()
    setTimeout(() => {
      setIsRefreshing(false)
      setSpin(false)
    }, 600)
  }, [loadLink])

  useEffect(() => {
    loadLink()
    const interval = setInterval(loadLink, 5000)
    return () => clearInterval(interval)
  }, [loadLink])

  const getStepStatus = (step: TimelineStep): 'done' | 'active' | 'pending' => {
    if (!link) return 'pending'
    const hasEvent = link.events.some((e: PaymentEvent) => e.type === step.eventType)
    if (hasEvent) return 'done'

    const stepIndex = TIMELINE_STEPS.findIndex((s) => s.key === step.key)
    const lastDoneIndex = TIMELINE_STEPS.reduce((acc, s, idx) => {
      const has = link.events.some((e: PaymentEvent) => e.type === s.eventType)
      return has ? idx : acc
    }, -1)

    if (stepIndex === lastDoneIndex + 1) return 'active'
    return 'pending'
  }

  const getStepTimestamp = (step: TimelineStep): string | null => {
    if (!link) return null
    const event = link.events.find((e: PaymentEvent) => e.type === step.eventType)
    return event ? event.timestamp : null
  }

  const lastViewedEvent = link?.events
    .filter((e: PaymentEvent) => e.type === 'viewed')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  const paidEvent = link?.events.find((e: PaymentEvent) => e.type === 'paid')

  const statusLabel = link
    ? link.status.charAt(0).toUpperCase() + link.status.slice(1)
    : 'Loading'

  const statusColorClass = link ? getStatusColor(link.status) : 'text-white/40'

  const displayAmount = link?.amount ?? amount
  const displayClientName = link?.clientName ?? clientName ?? 'Client'

  if (!token) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 ${className}`}>
        <p className="text-white/40 text-sm text-center py-4">No payment token provided.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-sm">Payment Status</h3>
          {link && (
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                link.status === 'paid'
                  ? 'bg-green-400/10 border-green-400/30 text-green-400'
                  : link.status === 'viewed'
                  ? 'bg-blue-400/10 border-blue-400/30 text-blue-400'
                  : link.status === 'expired'
                  ? 'bg-red-400/10 border-red-400/30 text-red-400'
                  : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-white/60 transition-transform duration-500 ${
              spin ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>

      {/* Paid celebration */}
      {link?.status === 'paid' && paidEvent && (
        <div className="mb-5 rounded-xl bg-green-400/10 border border-green-400/20 p-4 text-center">
          <div className="text-3xl mb-1">✓</div>
          <p className="text-green-400 font-bold text-base">Payment Received!</p>
          {displayAmount && (
            <p className="text-green-300 text-lg font-semibold mt-1">
              {formatPaymentAmount(displayAmount)}
            </p>
          )}
          <p className="text-white/40 text-xs mt-1">{formatDate(paidEvent.timestamp)}</p>
        </div>
      )}

      {/* Expired state */}
      {link?.status === 'expired' && (
        <div className="mb-5 rounded-xl bg-red-400/10 border border-red-400/20 p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-bold text-sm">Link Expired</p>
          <p className="text-white/40 text-xs mt-1 mb-3">This payment link has expired.</p>
          <button
            type="button"
            onClick={() => {
              if (!link) return
              const newLink = createPaymentLink({
                tripId: link.tripId,
                clientName: link.clientName,
                amount: link.amount,
                currency: 'INR',
                description: link.description,
              })
              setLink(newLink)
            }}
            className="text-xs bg-[#00d084] hover:bg-[#00b873] text-black font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Regenerate Link
          </button>
        </div>
      )}

      {/* Amount display (not paid) */}
      {link?.status !== 'paid' && link?.status !== 'expired' && displayAmount && (
        <div className="mb-5 text-center">
          <p className="text-white text-2xl font-bold">{formatPaymentAmount(displayAmount)}</p>
          <p className="text-white/40 text-xs mt-0.5">Due from {displayClientName}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step)
          const ts = getStepTimestamp(step)
          const isLast = index === TIMELINE_STEPS.length - 1

          return (
            <div key={step.key} className="flex gap-3">
              {/* Line + dot column */}
              <div className="flex flex-col items-center" style={{ width: 24 }}>
                {/* Dot */}
                <div
                  className={`relative flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    stepStatus === 'done'
                      ? 'bg-[#00d084] border-[#00d084] text-black'
                      : stepStatus === 'active'
                      ? 'bg-transparent border-[#00d084] text-[#00d084]'
                      : 'bg-transparent border-white/10 text-white/30'
                  }`}
                >
                  {step.icon}
                  {stepStatus === 'active' && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-[#00d084]/30" />
                  )}
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 min-h-[20px] rounded-full transition-colors ${
                      stepStatus === 'done' ? 'bg-[#00d084]/50' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`pb-4 ${isLast ? '' : ''}`} style={{ minWidth: 0, flex: 1 }}>
                <p
                  className={`text-sm font-medium leading-6 ${
                    stepStatus === 'done'
                      ? 'text-white'
                      : stepStatus === 'active'
                      ? 'text-[#00d084]'
                      : 'text-white/30'
                  }`}
                >
                  {step.label}
                </p>
                {ts && (
                  <p className="text-[11px] text-white/40 mt-0.5">{formatDate(ts)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Last viewed / footer */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-[11px] text-white/40">
          {lastViewedEvent
            ? `Last viewed: ${timeAgo(lastViewedEvent.timestamp)}`
            : 'Not yet opened'}
        </p>
        {link?.token && (
          <p className="text-[10px] text-white/20 mt-0.5 font-mono truncate">{link.token}</p>
        )}
      </div>
    </div>
  )
}
