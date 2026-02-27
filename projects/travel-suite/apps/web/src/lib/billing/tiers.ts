// Tier definitions for Indian tour operator SaaS
export type TierName = 'free' | 'pro' | 'business' | 'enterprise'

export interface Tier {
  name: TierName
  displayName: string
  price: { monthly: number; annual: number } // INR
  badge?: string // "Most Popular" etc
  color: string // tailwind gradient classes
  limits: {
    activeTrips: number | 'unlimited'
    clients: number | 'unlimited'
    teamMembers: number | 'unlimited'
    whatsappAutomations: boolean
    tripTemplates: boolean
    clientPortal: boolean
    gstInvoicing: boolean
    upiPayments: boolean
    aiInsights: boolean
    revenueAnalytics: boolean
    apiAccess: boolean
    whiteLabelPortal: boolean
    razorpayIntegration: boolean
    prioritySupport: boolean
    // Social Studio V2 limits
    socialTemplates: 'basic' | 'all'
    socialCarouselSlides: number | 'unlimited'
    socialAiPostersPerMonth: number | 'unlimited'
    socialAiCaptionsPerMonth: number | 'unlimited'
    socialAutoPosting: 'none' | 'manual' | 'scheduled'
    socialWhatsAppPhotos: number | 'unlimited'
    socialMediaLibraryMB: number
    socialPostHistory: number | 'unlimited'
  }
  features: string[] // bullet points shown on pricing card
}

export const TIERS: Record<TierName, Tier> = {
  free: {
    name: 'free',
    displayName: 'Starter',
    price: { monthly: 0, annual: 0 },
    color: 'from-slate-500 to-slate-600',
    limits: {
      activeTrips: 5,
      clients: 20,
      teamMembers: 1,
      whatsappAutomations: false,
      tripTemplates: false,
      clientPortal: false,
      gstInvoicing: false,
      upiPayments: false,
      aiInsights: false,
      revenueAnalytics: false,
      apiAccess: false,
      whiteLabelPortal: false,
      razorpayIntegration: false,
      prioritySupport: false,
      socialTemplates: 'basic',
      socialCarouselSlides: 0,
      socialAiPostersPerMonth: 5,
      socialAiCaptionsPerMonth: 10,
      socialAutoPosting: 'none',
      socialWhatsAppPhotos: 0,
      socialMediaLibraryMB: 100,
      socialPostHistory: 10,
    },
    features: [
      '5 active trips',
      '20 clients',
      'Manual WhatsApp messaging',
      'Basic trip planner',
      'Quick Quote calculator',
      '10 Social Media templates',
    ],
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    price: { monthly: 3499, annual: 2799 }, // annual = 20% off
    badge: 'Most Popular',
    color: 'from-emerald-500 to-teal-600',
    limits: {
      activeTrips: 'unlimited',
      clients: 'unlimited',
      teamMembers: 1,
      whatsappAutomations: true,
      tripTemplates: true,
      clientPortal: false,
      gstInvoicing: true,
      upiPayments: true,
      aiInsights: false,
      revenueAnalytics: true,
      apiAccess: false,
      whiteLabelPortal: false,
      razorpayIntegration: false,
      prioritySupport: false,
      socialTemplates: 'all',
      socialCarouselSlides: 5,
      socialAiPostersPerMonth: 50,
      socialAiCaptionsPerMonth: 'unlimited',
      socialAutoPosting: 'manual',
      socialWhatsAppPhotos: 50,
      socialMediaLibraryMB: 1024,
      socialPostHistory: 'unlimited',
    },
    features: [
      'Everything in Starter',
      'Unlimited trips & clients',
      'WhatsApp automations',
      'All 100+ Social Media templates',
      'AI Poster generator (50/mo)',
      'GST invoicing & UPI collection',
    ],
  },
  business: {
    name: 'business',
    displayName: 'Business',
    price: { monthly: 10999, annual: 8799 },
    badge: 'Scale Fast',
    color: 'from-violet-500 to-purple-600',
    limits: {
      activeTrips: 'unlimited',
      clients: 'unlimited',
      teamMembers: 5,
      whatsappAutomations: true,
      tripTemplates: true,
      clientPortal: true,
      gstInvoicing: true,
      upiPayments: true,
      aiInsights: true,
      revenueAnalytics: true,
      apiAccess: false,
      whiteLabelPortal: true,
      razorpayIntegration: true,
      prioritySupport: false,
      socialTemplates: 'all',
      socialCarouselSlides: 10,
      socialAiPostersPerMonth: 200,
      socialAiCaptionsPerMonth: 'unlimited',
      socialAutoPosting: 'scheduled',
      socialWhatsAppPhotos: 'unlimited',
      socialMediaLibraryMB: 5120,
      socialPostHistory: 'unlimited',
    },
    features: [
      'Everything in Pro',
      'Scheduled Auto-posting (IG/FB)',
      'WhatsApp Photo Integration',
      '5 team members',
      'Branded client portal',
      'AI insights & lead scoring',
    ],
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: { monthly: 29999, annual: 23999 },
    badge: 'Full Control',
    color: 'from-amber-500 to-orange-600',
    limits: {
      activeTrips: 'unlimited',
      clients: 'unlimited',
      teamMembers: 'unlimited',
      whatsappAutomations: true,
      tripTemplates: true,
      clientPortal: true,
      gstInvoicing: true,
      upiPayments: true,
      aiInsights: true,
      revenueAnalytics: true,
      apiAccess: true,
      whiteLabelPortal: true,
      razorpayIntegration: true,
      prioritySupport: true,
      socialTemplates: 'all',
      socialCarouselSlides: 'unlimited',
      socialAiPostersPerMonth: 'unlimited',
      socialAiCaptionsPerMonth: 'unlimited',
      socialAutoPosting: 'scheduled',
      socialWhatsAppPhotos: 'unlimited',
      socialMediaLibraryMB: 25600,
      socialPostHistory: 'unlimited',
    },
    features: [
      'Everything in Business',
      'Unlimited team members',
      'API access for custom integrations',
      'Priority support',
      'Custom Social Media templates',
    ],
  },
}

export function isFeatureAllowed(tier: TierName, feature: keyof Tier['limits']): boolean {
  const limit = TIERS[tier].limits[feature]
  if (typeof limit === 'boolean') return limit
  return limit === 'unlimited' || (typeof limit === 'number' && limit > 0)
}

export function getTripLimit(tier: TierName): number | 'unlimited' {
  return TIERS[tier].limits.activeTrips
}

export function formatPrice(amount: number): string {
  if (amount === 0) return 'Free'
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`
  }
  return `₹${amount}`
}
