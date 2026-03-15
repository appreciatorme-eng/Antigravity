'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
} from 'lucide-react'
import { GlassButton } from '@/components/glass/GlassButton'
import { GlassCard } from '@/components/glass/GlassCard'
import { GlassModal } from '@/components/glass/GlassModal'
import { formatPaymentAmount } from '@/lib/payments/payment-links'
import { logError } from "@/lib/observability/logger"

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
    }
  }
}

interface PaymentVerificationPayload {
  data?: {
    link?: {
      status?: string
      paidAt?: string | null
    }
    verified?: boolean
  }
  error?: string | null
}

export interface RazorpayModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number // paise
  clientName: string
  tripName: string
  description?: string
  organizationName?: string | null
  clientEmail?: string | null
  clientPhone?: string | null
  linkToken?: string | null
  razorpayOrderId?: string | null
  onSuccess?: (paymentId: string) => void
}

type ModalStatus = 'idle' | 'launching' | 'verifying' | 'success' | 'error'

async function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.Razorpay) return

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    )

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay checkout')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RazorpayModal({
  isOpen,
  onClose,
  amount,
  clientName,
  tripName,
  description,
  organizationName,
  clientEmail,
  clientPhone,
  linkToken,
  razorpayOrderId,
  onSuccess,
}: RazorpayModalProps) {
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paidAt, setPaidAt] = useState<string | null>(null)

  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const isConfigured = Boolean(razorpayKey)
  const isCheckoutReady = Boolean(isConfigured && linkToken && razorpayOrderId)

  const summaryRows = useMemo(
    () => [
      { label: 'Traveler', value: clientName },
      { label: 'Trip', value: tripName },
      { label: 'Amount due', value: formatPaymentAmount(amount) },
    ],
    [amount, clientName, tripName],
  )

  useEffect(() => {
    if (!isOpen) return
    setStatus('idle')
    setError(null)
    setPaymentId(null)
    setPaidAt(null)
  }, [isOpen])

  async function handleLaunchCheckout() {
    if (!linkToken || !razorpayOrderId) {
      setStatus('error')
      setError('This payment request is missing its Razorpay order. Generate a fresh payment link.')
      return
    }

    if (!razorpayKey) {
      setStatus('error')
      setError('Payment gateway is not configured yet. Please contact the operator.')
      return
    }

    setStatus('launching')
    setError(null)

    try {
      await loadRazorpayCheckoutScript()
      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is unavailable')
      }

      const checkout = new window.Razorpay({
        key: razorpayKey,
        amount,
        currency: 'INR',
        name: organizationName || 'Travel Suite',
        description: description || tripName,
        order_id: razorpayOrderId,
        prefill: {
          name: clientName || undefined,
          email: clientEmail || undefined,
          contact: clientPhone?.replace(/\D/g, '') || undefined,
        },
        theme: {
          color: '#00d084',
        },
        modal: {
          ondismiss: () => {
            setStatus('idle')
          },
        },
        handler: async (response: Record<string, unknown>) => {
          setStatus('verifying')

          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: linkToken,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const payload = (await verifyResponse.json().catch(() => null)) as
              | PaymentVerificationPayload
              | null

            if (!verifyResponse.ok || !payload?.data?.verified) {
              throw new Error(payload?.error || 'Payment verification failed')
            }

            const nextPaymentId =
              typeof response.razorpay_payment_id === 'string'
                ? response.razorpay_payment_id
                : null

            setPaymentId(nextPaymentId)
            setPaidAt(payload.data.link?.paidAt || null)
            setStatus('success')

            if (nextPaymentId) {
              onSuccess?.(nextPaymentId)
            }
          } catch (verificationError) {
            logError('Razorpay verification failed', verificationError)
            setStatus('error')
            setError(
              verificationError instanceof Error
                ? verificationError.message
                : 'Payment verification failed',
            )
          }
        },
      })

      checkout.open()
    } catch (checkoutError) {
      logError('Razorpay checkout launch failed', checkoutError)
      setStatus('error')
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Unable to launch Razorpay checkout',
      )
    }
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Secure payment checkout"
      description="This modal now launches the real Razorpay checkout flow and verifies the payment signature on the server."
    >
      <div className="space-y-5">
        <GlassCard
          className="border-white/10 bg-[#081220]/80 text-white"
          opacity="low"
          padding="lg"
          blur="lg"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00d084]">
                  Razorpay
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{tripName}</h3>
                <p className="mt-1 text-sm text-white/75">
                  {description || `Secure payment request for ${clientName}`}
                </p>
              </div>
              <div className="rounded-2xl border border-[#00d084]/20 bg-[#00d084]/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[#00d084]/70">Amount due</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {formatPaymentAmount(amount)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {summaryRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/70">{row.label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard
          className="border-white/10 bg-white/5 text-white"
          opacity="low"
          padding="lg"
          blur="md"
        >
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-[#00d084]" />
            <div className="space-y-2 text-sm text-white/70">
              <p className="font-medium text-white">Verified checkout only</p>
              <p>
                This flow opens Razorpay Checkout with the server-generated order ID and only marks
                the payment as successful after backend HMAC verification.
              </p>
              {!isConfigured && (
                <p className="text-amber-200">
                  Configure <code>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> before using this checkout.
                </p>
              )}
              {isConfigured && !isCheckoutReady && (
                <p className="text-amber-200">
                  Generate a fresh payment link first. This modal needs both a payment token and a
                  Razorpay order ID.
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {status === 'success' && (
          <GlassCard
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-50"
            opacity="low"
            padding="lg"
            blur="md"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Payment verified successfully</p>
                {paymentId && <p>Razorpay payment ID: {paymentId}</p>}
                {paidAt && <p>Paid at: {formatTimestamp(paidAt)}</p>}
              </div>
            </div>
          </GlassCard>
        )}

        {status === 'error' && error && (
          <GlassCard
            className="border-red-500/20 bg-red-500/10 text-red-50"
            opacity="low"
            padding="lg"
            blur="md"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-200" />
              <p className="text-sm">{error}</p>
            </div>
          </GlassCard>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={() => {
              onClose()
            }}
          >
            Close
          </GlassButton>
          <GlassButton
            type="button"
            variant="primary"
            loading={status === 'launching' || status === 'verifying'}
            disabled={!isCheckoutReady || status === 'success'}
            onClick={() => {
              void handleLaunchCheckout()
            }}
          >
            {status === 'launching' || status === 'verifying' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === 'verifying' ? 'Verifying payment...' : 'Launching Razorpay...'}
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Open secure checkout
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  )
}
