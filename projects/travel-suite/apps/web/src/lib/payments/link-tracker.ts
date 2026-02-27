export type PaymentEventType =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'reminder_sent'
  | 'paid'
  | 'expired'

export interface PaymentEvent {
  type: PaymentEventType
  timestamp: string // ISO string
  metadata?: Record<string, string>
}

export interface PaymentLinkData {
  token: string
  tripId: string
  clientName: string
  amount: number // in paise
  currency: 'INR'
  description: string
  createdAt: string
  expiresAt: string // 7 days from creation
  events: PaymentEvent[]
  status: 'pending' | 'viewed' | 'paid' | 'expired'
}

const STORAGE_KEY = 'touros_payment_links'

export function generatePaymentToken(): string {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createPaymentLink(
  data: Omit<PaymentLinkData, 'token' | 'events' | 'status' | 'createdAt' | 'expiresAt'>
): PaymentLinkData {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const link: PaymentLinkData = {
    ...data,
    token: generatePaymentToken(),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    events: [
      {
        type: 'created',
        timestamp: now.toISOString(),
      },
    ],
    status: 'pending',
  }

  if (typeof window !== 'undefined') {
    const existing = getAllLinks()
    existing[link.token] = link
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  }

  return link
}

function getAllLinks(): Record<string, PaymentLinkData> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PaymentLinkData>) : {}
  } catch {
    return {}
  }
}

export function recordEvent(token: string, event: PaymentEvent): void {
  if (typeof window === 'undefined') return

  const all = getAllLinks()
  const link = all[token]
  if (!link) return

  link.events = [...link.events, event]

  if (event.type === 'viewed' && link.status === 'pending') {
    link.status = 'viewed'
  } else if (event.type === 'paid') {
    link.status = 'paid'
  } else if (event.type === 'expired') {
    link.status = 'expired'
  }

  all[token] = link
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getPaymentLink(token: string): PaymentLinkData | null {
  if (typeof window === 'undefined') return null
  const all = getAllLinks()
  return all[token] ?? null
}

export function formatPaymentAmount(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN')}`
}

export function getStatusColor(status: PaymentLinkData['status']): string {
  switch (status) {
    case 'pending':
      return 'text-amber-400'
    case 'viewed':
      return 'text-blue-400'
    case 'paid':
      return 'text-green-400'
    case 'expired':
      return 'text-red-400'
    default:
      return 'text-white/60'
  }
}

export function isExpired(link: PaymentLinkData): boolean {
  return new Date(link.expiresAt) < new Date()
}
