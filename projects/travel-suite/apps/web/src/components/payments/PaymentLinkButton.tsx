'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Copy, MessageCircle, ExternalLink } from 'lucide-react'
import {
  createPaymentLink,
  getPaymentLink,
  formatPaymentAmount,
  getStatusColor,
  isExpired,
  type PaymentLinkData,
} from '@/lib/payments/link-tracker'
import PaymentTracker from './PaymentTracker'
import { logError } from "@/lib/observability/logger"

interface PaymentLinkButtonProps {
  proposalId?: string
  bookingId?: string
  clientId?: string
  clientName: string
  clientPhone?: string | null
  clientEmail?: string | null
  amount: number // paise
  description?: string
  onLinkCreated?: (token: string) => void
}

type State = 'idle' | 'creating' | 'created'

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`
}

export default function PaymentLinkButton({
  proposalId,
  bookingId,
  clientId,
  clientName,
  clientPhone,
  clientEmail,
  amount,
  description = 'Trip payment',
  onLinkCreated,
}: PaymentLinkButtonProps) {
  const [state, setState] = useState<State>('idle')
  const [link, setLink] = useState<PaymentLinkData | null>(null)
  const [copied, setCopied] = useState(false)
  const [showTracker, setShowTracker] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const refreshLink = useCallback(async () => {
    if (!link?.token) return
    const fresh = await getPaymentLink(link.token)
    if (fresh) setLink(fresh)
  }, [link?.token])

  useEffect(() => {
    if (state !== 'created') return
    const controller = new AbortController()
    const interval = setInterval(() => {
      if (!controller.signal.aborted) {
        void refreshLink()
      }
    }, 5000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [state, refreshLink])

  async function handleCreate() {
    setState('creating')
    setShareError(null)
    try {
      const newLink = await createPaymentLink({
        proposalId,
        bookingId,
        clientId,
        clientName,
        clientPhone: clientPhone || undefined,
        clientEmail: clientEmail || undefined,
        amount,
        currency: 'INR',
        description,
      })
      setLink(newLink)
      setState('created')
      onLinkCreated?.(newLink.token)
    } catch (error) {
      logError('Payment link creation failed', error)
      setState('idle')
      setShareError(error instanceof Error ? error.message : 'Failed to create payment link')
    }
  }

  function getPortalUrl(token: string): string {
    if (link?.paymentUrl) return link.paymentUrl
    if (typeof window === 'undefined') return `/pay/${token}`
    return `${window.location.origin}/pay/${token}`
  }

  function handleCopyLink() {
    if (!link) return
    void navigator.clipboard.writeText(getPortalUrl(link.token)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleWhatsApp() {
    if (!link) return
    const sharePhone = link.clientPhone || clientPhone
    if (!sharePhone) {
      setShareError('Add the client WhatsApp number before sharing this payment link.')
      return
    }

    const url = getPortalUrl(link.token)
    const msg = encodeURIComponent(
      `Hi ${clientName}! 🙏\n\nHere is your secure payment link for your trip:\n\n` +
        `*Amount Due:* ${formatPaymentAmount(amount)}\n` +
        `*Payment Link:* ${url}\n\n` +
        `The link is valid for 7 days. Please complete the payment at your earliest convenience.\n\n` +
        `Thank you!`
    )
    const digits = sharePhone.replace(/\D/g, '')
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank')
  }

  // Status badge
  const renderStatusBadge = () => {
    if (!link) return null

    const lastViewed = link.events
      .filter((e) => e.type === 'viewed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    const isPaid = link.status === 'paid'
    const isView = link.status === 'viewed'
    const expired = isExpired(link) && !isPaid

    return (
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            isPaid
              ? 'bg-green-400'
              : isView
              ? 'bg-blue-400'
              : expired
              ? 'bg-red-400'
              : 'bg-amber-400'
          }`}
        />
        <span className={`text-xs ${getStatusColor(link.status)}`}>
          {isPaid
            ? 'Paid ✓'
            : isView && lastViewed
            ? `Viewed ${timeAgo(lastViewed.timestamp)}`
            : expired
            ? 'Link expired'
            : 'Not yet opened'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Idle state */}
      {state === 'idle' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              void handleCreate()
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors backdrop-blur-sm"
          >
            <span>💳</span>
            Create Payment Link
          </button>
          {shareError && <p className="text-xs text-red-300">{shareError}</p>}
        </div>
      )}

      {/* Creating state */}
      {state === 'creating' && (
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-white/60 text-sm font-medium cursor-not-allowed"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </button>
      )}

      {/* Created state */}
      {state === 'created' && link && (
        <div className="space-y-2">
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : '📋 Copy Link'}
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-[#25D366] text-xs font-medium transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              📱 Send WhatsApp
            </button>

            <button
              type="button"
              onClick={() => setShowTracker(true)}
              className="inline-flex items-center gap-1 px-2 py-2 rounded-xl text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View Tracker
            </button>
          </div>

          {/* Status badge */}
          {renderStatusBadge()}
          {shareError && <p className="text-xs text-red-300">{shareError}</p>}
        </div>
      )}

      {/* Tracker Modal */}
      {showTracker && link && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTracker(false)
          }}
        >
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setShowTracker(false)}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <PaymentTracker
              token={link.token}
              clientName={clientName}
              amount={amount}
            />
          </div>
        </div>
      )}
    </div>
  )
}
