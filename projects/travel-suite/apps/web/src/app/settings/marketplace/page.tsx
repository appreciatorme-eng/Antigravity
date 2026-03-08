'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, BadgeCheck, Building2, ExternalLink, FileText, Image as ImageIcon, Plus, Save, Trash2, TrendingUp } from 'lucide-react'
import SearchableCreatableMultiSelect from '@/components/forms/SearchableCreatableMultiSelect'
import { GlassBadge } from '@/components/glass/GlassBadge'
import { GlassButton } from '@/components/glass/GlassButton'
import { GlassCard } from '@/components/glass/GlassCard'
import { GlassInput, GlassTextarea } from '@/components/glass/GlassInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardSkeleton } from '@/components/ui/skeletons/DashboardSkeleton'
import { MarketplaceListingPlans } from './MarketplaceListingPlans'
import { useMarketplacePresence } from './useMarketplacePresence'

export default function MarketplaceSettingsPage() {
  const {
    loading,
    saving,
    error,
    organization,
    formData,
    setFormData,
    stats,
    options,
    saveChanges,
    requestVerification,
    refresh,
    listingState,
  } = useMarketplacePresence()
  const [galleryUrl, setGalleryUrl] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [serviceMargin, setServiceMargin] = useState('')
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [docType, setDocType] = useState('Other')
  const [docExpiry, setDocExpiry] = useState('')

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pb-12">
        <DashboardSkeleton />
      </div>
    )
  }

  const verificationVariant =
    formData.verification_status === 'verified'
      ? 'success'
      : formData.verification_status === 'pending'
        ? 'warning'
        : 'default'

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to settings
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Marketplace Presence</h1>
            <GlassBadge variant={verificationVariant}>
              {formData.verification_status === 'verified'
                ? 'Verified partner'
                : formData.verification_status === 'pending'
                  ? 'Verification pending'
                  : 'Standard listing'}
            </GlassBadge>
          </div>
          <p className="text-sm text-slate-600 dark:text-white/60">
            Manage the real marketplace profile your organization exposes to partner discovery and inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {formData.verification_status === 'none' ? (
            <GlassButton variant="outline" onClick={() => void requestVerification()} loading={saving}>
              <BadgeCheck className="w-4 h-4" />
              Request verification
            </GlassButton>
          ) : null}
          <GlassButton onClick={() => void saveChanges()} loading={saving}>
            <Save className="w-4 h-4" />
            Save changes
          </GlassButton>
        </div>
      </div>

      {error ? (
        <GlassCard className="space-y-4 border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Could not load marketplace data</h2>
            <p className="text-sm text-slate-700 dark:text-white/70">{error}</p>
          </div>
          <GlassButton variant="secondary" onClick={refresh}>
            Retry
          </GlassButton>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-white/60">Marketplace views</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.views}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-white/60">Inbound inquiries</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.inquiries}</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-white/60">Conversion rate</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.conversionRate}%</p>
        </GlassCard>
        <GlassCard className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-white/60">Recent interest</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {stats.recentViews[0] || stats.recentInquiries[0] || 'No activity yet'}
          </p>
        </GlassCard>
      </div>

      <MarketplaceListingPlans
        listingState={listingState}
        organizationName={organization?.name}
        onRefresh={refresh}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-600 dark:text-white/70" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{organization?.name || 'Organization profile'}</h2>
              <p className="text-sm text-slate-600 dark:text-white/60">
                Subscription tier: {organization?.subscription_tier || 'free'}
              </p>
            </div>
          </div>

          <GlassTextarea
            label="Marketplace description"
            rows={5}
            value={formData.description}
            onChange={(event) =>
              setFormData((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Describe your destinations, specialties, service quality, and why partners should trust your team."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SearchableCreatableMultiSelect
              label="Service regions"
              selectedValues={formData.service_regions}
              options={options.serviceRegions}
              onChange={(nextValues) =>
                setFormData((current) => ({ ...current, service_regions: nextValues }))
              }
              helperText="These regions help buyers discover your organization."
            />
            <SearchableCreatableMultiSelect
              label="Specialties"
              selectedValues={formData.specialties}
              options={options.specialties}
              onChange={(nextValues) =>
                setFormData((current) => ({ ...current, specialties: nextValues }))
              }
              helperText="Choose the trip types and services you actually operate."
            />
          </div>

          <GlassInput
            label="Default margin percentage"
            type="number"
            min="0"
            max="100"
            value={formData.margin_rate ?? ''}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                margin_rate: event.target.value === '' ? null : Number(event.target.value),
              }))
            }
            helperText="Applied when a specific service margin is not listed below."
          />
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent visibility</h2>
          </div>
          {stats.recentViews.length === 0 && stats.recentInquiries.length === 0 ? (
            <EmptyState
              icon="🔌"
              title="No integrations connected"
              description="Connect marketplace channels and complete your listing to start seeing visibility data here."
              action={{ label: 'Browse Integrations', href: '/settings/marketplace' }}
              className="py-10"
            />
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-white/50">Recent views</p>
                {stats.recentViews.length > 0 ? (
                  stats.recentViews.map((name) => (
                    <div key={`view-${name}`} className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80">
                      {name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-white/60">No profile views yet.</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-white/50">Recent inquiries</p>
                {stats.recentInquiries.length > 0 ? (
                  stats.recentInquiries.map((name) => (
                    <div key={`inquiry-${name}`} className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-700 dark:text-white/80">
                      {name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-white/60">No inquiries yet.</p>
                )}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard className="space-y-5">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gallery</h2>
          </div>
          <div className="flex gap-2">
            <GlassInput
              value={galleryUrl}
              onChange={(event) => setGalleryUrl(event.target.value)}
              placeholder="Paste a hosted image URL"
            />
            <GlassButton
              variant="secondary"
              onClick={() => {
                if (!galleryUrl.trim()) return
                setFormData((current) => ({
                  ...current,
                  gallery_urls: current.gallery_urls.includes(galleryUrl.trim())
                    ? current.gallery_urls
                    : [...current.gallery_urls, galleryUrl.trim()],
                }))
                setGalleryUrl('')
              }}
            >
              <Plus className="w-4 h-4" />
              Add
            </GlassButton>
          </div>
          <div className="space-y-2">
            {formData.gallery_urls.length > 0 ? (
              formData.gallery_urls.map((url) => (
                <div key={url} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2">
                  <a href={url} target="_blank" rel="noreferrer" className="truncate text-sm text-slate-700 dark:text-white/80 hover:text-primary">
                    {url}
                  </a>
                  <button
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        gallery_urls: current.gallery_urls.filter((entry) => entry !== url),
                      }))
                    }
                    className="text-slate-500 hover:text-red-500"
                    aria-label="Remove gallery image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-white/60">No gallery assets yet.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compliance vault</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GlassInput value={docName} onChange={(event) => setDocName(event.target.value)} placeholder="Document name" />
            <GlassInput value={docUrl} onChange={(event) => setDocUrl(event.target.value)} placeholder="Hosted document URL" />
            <GlassInput value={docType} onChange={(event) => setDocType(event.target.value)} placeholder="Document type" />
            <GlassInput type="date" value={docExpiry} onChange={(event) => setDocExpiry(event.target.value)} />
          </div>
          <GlassButton
            variant="secondary"
            onClick={() => {
              if (!docName.trim() || !docUrl.trim()) return
              setFormData((current) => ({
                ...current,
                compliance_documents: [
                  ...current.compliance_documents,
                  {
                    id: crypto.randomUUID(),
                    name: docName.trim(),
                    url: docUrl.trim(),
                    type: docType.trim() || 'Other',
                    ...(docExpiry ? { expiry_date: docExpiry } : {}),
                  },
                ],
              }))
              setDocName('')
              setDocUrl('')
              setDocType('Other')
              setDocExpiry('')
            }}
          >
            <Plus className="w-4 h-4" />
            Add document
          </GlassButton>
          <div className="space-y-2">
            {formData.compliance_documents.length > 0 ? (
              formData.compliance_documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{document.name}</p>
                    <p className="text-xs text-slate-600 dark:text-white/60">
                      {document.type}
                      {document.expiry_date ? ` • Expires ${document.expiry_date}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={document.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-primary" aria-label="Open document">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          compliance_documents: current.compliance_documents.filter((entry) => entry.id !== document.id),
                        }))
                      }
                      className="text-slate-500 hover:text-red-500"
                      aria-label="Remove document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-white/60">No compliance documents attached yet.</p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="space-y-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Rate card</h2>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3">
          <GlassInput value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="Service name" />
          <GlassInput value={serviceMargin} onChange={(event) => setServiceMargin(event.target.value)} placeholder="Margin %" type="number" min="0" max="100" />
          <GlassButton
            variant="secondary"
            onClick={() => {
              if (!serviceName.trim() || !serviceMargin.trim()) return
              setFormData((current) => ({
                ...current,
                rate_card: [
                  ...current.rate_card,
                  {
                    id: crypto.randomUUID(),
                    service: serviceName.trim(),
                    margin: Number(serviceMargin),
                  },
                ],
              }))
              setServiceName('')
              setServiceMargin('')
            }}
          >
            <Plus className="w-4 h-4" />
            Add
          </GlassButton>
        </div>
        <div className="space-y-2">
          {formData.rate_card.length > 0 ? (
            formData.rate_card.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.service}</p>
                  <p className="text-xs text-slate-600 dark:text-white/60">{item.margin}% margin</p>
                </div>
                <button
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      rate_card: current.rate_card.filter((entry) => entry.id !== item.id),
                    }))
                  }
                  className="text-slate-500 hover:text-red-500"
                  aria-label="Remove rate item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-white/60">
              No service-specific margins yet. The baseline margin will be used until you add rate items.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
