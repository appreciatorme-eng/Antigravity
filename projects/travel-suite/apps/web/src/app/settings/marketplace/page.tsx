'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit2, Trash2, Eye, MessageSquare, TrendingUp,
  MapPin, DollarSign, Users, Star, Copy, BarChart3,
  Save, X, Upload, AlertCircle, Check, Settings,
} from 'lucide-react'

type Tab = 'listings' | 'profile' | 'analytics'

interface Listing {
  id: string
  name: string
  destination: string
  duration: number
  basePrice: number
  margin: number
  views: number
  leads: number
  conversions: number
  rating: number
  photos: number
  active: boolean
}

interface ProfileData {
  businessName: string
  description: string
  phone: string
  email: string
  website: string
  rating: number
  reviews: number
  featuredListings: number
}

interface Analytics {
  totalViews: number
  totalLeads: number
  totalConversions: number
  conversionRate: number
  avgRating: number
  totalEarnings: number
}

// Mock data
const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    name: 'Rajasthan Royal 7N/8D',
    destination: 'Rajasthan',
    duration: 7,
    basePrice: 85000,
    margin: 25,
    views: 342,
    leads: 18,
    conversions: 4,
    rating: 4.8,
    photos: 12,
    active: true,
  },
  {
    id: '2',
    name: 'Kerala Backwaters 5N/6D',
    destination: 'Kerala',
    duration: 5,
    basePrice: 65000,
    margin: 20,
    views: 287,
    leads: 12,
    conversions: 3,
    rating: 4.9,
    photos: 15,
    active: true,
  },
  {
    id: '3',
    name: 'Goa Beach Escape 3N/4D',
    destination: 'Goa',
    duration: 3,
    basePrice: 45000,
    margin: 30,
    views: 156,
    leads: 8,
    conversions: 2,
    rating: 4.5,
    photos: 10,
    active: true,
  },
]

const MOCK_PROFILE: ProfileData = {
  businessName: 'TravelOS Adventures',
  description: 'Premier tour operator specializing in curated Indian experiences for families and groups.',
  phone: '+91 98765 43210',
  email: 'hello@travelos.in',
  website: 'www.travelos.in',
  rating: 4.7,
  reviews: 127,
  featuredListings: 3,
}

const MOCK_ANALYTICS: Analytics = {
  totalViews: 1847,
  totalLeads: 48,
  totalConversions: 12,
  conversionRate: 25,
  avgRating: 4.8,
  totalEarnings: 485000,
}

// ─── Listings Tab ─────────────────────────────────────────────────────────

function ListingsTab() {
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleDelete = (id: string) => {
    setListings(listings.filter((l) => l.id !== id))
  }

  const handleMarginChange = (id: string, newMargin: number) => {
    setListings(
      listings.map((l) =>
        l.id === id ? { ...l, margin: Math.max(5, Math.min(50, newMargin)) } : l
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">My Listings</h2>
          <p className="text-white/40 text-sm mt-1">
            {listings.length} active packages on marketplace
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#00d084] hover:bg-[#00b873] text-black font-semibold rounded-xl px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Listing
        </button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {listings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {listing.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-white/50 text-xs">
                    <MapPin className="w-3 h-3" />
                    {listing.destination} • {listing.duration} days
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Price & Margin */}
              <div className="bg-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Base Price</span>
                  <span className="font-semibold">
                    ₹{(listing.basePrice / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#00d084]" />
                    <span className="text-white/60 text-sm">Your Margin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={listing.margin}
                      onChange={(e) =>
                        handleMarginChange(listing.id, parseInt(e.target.value) || 0)
                      }
                      className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-[#00d084]/50"
                      min="5"
                      max="50"
                    />
                    <span className="text-white/60 text-sm">%</span>
                  </div>
                </div>
                <div className="text-xs text-white/40">
                  Your selling price: ₹
                  {(listing.basePrice * (1 + listing.margin / 100) / 100000).toFixed(1)}L
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-blue-400/10 rounded-lg p-2">
                  <div className="font-semibold text-blue-400">{listing.views}</div>
                  <div className="text-white/50">Views</div>
                </div>
                <div className="bg-green-400/10 rounded-lg p-2">
                  <div className="font-semibold text-green-400">{listing.leads}</div>
                  <div className="text-white/50">Leads</div>
                </div>
                <div className="bg-purple-400/10 rounded-lg p-2">
                  <div className="font-semibold text-purple-400">
                    {Math.round((listing.conversions / listing.leads) * 100)}%
                  </div>
                  <div className="text-white/50">Conv.</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{listing.rating}</span>
                </div>
                <span className="text-white/40">{listing.photos} photos</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 bg-[#0a1628] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#00d084]" /> Add New Listing
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-blue-200 text-sm">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                  <p>To add a new package to the marketplace, you need to first build and finalize an itinerary in the Planner module.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <a 
                  href="/planner" 
                  className="px-4 py-2 rounded-xl bg-[#00d084] text-black font-semibold hover:bg-[#00b873] transition-colors"
                >
                  Go to Planner
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────

function ProfileTab() {
  const [profile, setProfile] = useState<ProfileData>(MOCK_PROFILE)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile)

  const handleSave = () => {
    setProfile(formData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Marketplace Profile</h2>
          <p className="text-white/40 text-sm mt-1">
            How you appear to customers browsing listings
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl px-4 py-2.5 transition-colors border border-white/10"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4"
          >
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00d084]/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#00d084]/50 resize-none"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00d084]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00d084]/50"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00d084]/50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 flex-1 bg-[#00d084] hover:bg-[#00b873] text-black font-semibold rounded-xl px-4 py-2.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setFormData(profile)
                  setIsEditing(false)
                }}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl px-4 py-2.5 transition-colors border border-white/10"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
          >
            {/* Business Card */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{profile.businessName}</h3>
              <p className="text-white/60 mb-4">{profile.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4 text-[#00d084]" />
                  {profile.reviews} reviews
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Star className="w-4 h-4 text-yellow-400" />
                  {profile.rating} rating
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {profile.featuredListings} featured
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t border-white/10 pt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Email</span>
                <span className="text-white">{profile.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Phone</span>
                <span className="text-white">{profile.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Website</span>
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00d084] hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────────────────

function AnalyticsTab() {
  const analytics = MOCK_ANALYTICS

  const cards = [
    {
      label: 'Total Views',
      value: analytics.totalViews.toLocaleString('en-IN'),
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Total Leads',
      value: analytics.totalLeads.toLocaleString('en-IN'),
      icon: MessageSquare,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Conversions',
      value: analytics.totalConversions.toLocaleString('en-IN'),
      icon: Check,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Conversion Rate',
      value: `${analytics.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Marketplace Analytics</h2>
        <p className="text-white/40 text-sm mt-1">
          Performance across all your listings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${card.bg} backdrop-blur-xl border border-white/10 rounded-2xl p-5`}
          >
            <div className="flex items-center gap-3 mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-white/60 text-sm">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-[#00d084]/20 to-[#00d084]/5 backdrop-blur-xl border border-[#00d084]/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Total Earnings</h3>
            <p className="text-white/50 text-sm mt-1">Gross marketplace revenue</p>
          </div>
          <DollarSign className="w-6 h-6 text-[#00d084] opacity-50" />
        </div>

        <div className="space-y-2">
          <p className="text-4xl font-bold text-[#00d084]">
            ₹{(analytics.totalEarnings / 100000).toFixed(1)}L
          </p>
          <p className="text-white/40 text-sm">
            From {analytics.totalConversions} successful conversions
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-white">Opportunity:</p>
            <p className="text-white/60 text-sm mt-1">
              Your 7N/8D Rajasthan package has 25% conversion rate. Consider
              increasing its margin or promoting it more actively.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<Tab>('listings')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'listings', label: 'My Listings', icon: MapPin },
    { id: 'profile', label: 'Profile', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-[#0a1628] p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold">Marketplace Manager</h1>
          <p className="text-white/50 mt-2">
            Manage your listings, profile, and track performance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? 'bg-[#00d084] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {activeTab === 'listings' && <ListingsTab />}
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
