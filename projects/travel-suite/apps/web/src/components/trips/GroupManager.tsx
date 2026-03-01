'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  Printer,
  FileDown,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
  Send,
  ClipboardList,
  BarChart2,
  FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DietaryPreference = 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan' | 'No preference'

interface Traveler {
  id: string
  fullName: string
  whatsapp: string
  dietary: DietaryPreference
  passport: string
  age: string
  notes: string
  docs: {
    passport: boolean
    visa: boolean
    insurance: boolean
  }
}

const DIETARY_OPTIONS: DietaryPreference[] = ['Veg', 'Non-Veg', 'Jain', 'Vegan', 'No preference']

const DIETARY_COLORS: Record<DietaryPreference, string> = {
  Veg: 'bg-green-500/15 text-green-400 border-green-500/25',
  'Non-Veg': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  Jain: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  Vegan: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  'No preference': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

const MESSAGE_TEMPLATES = [
  'Your trip is confirmed! Please ensure all documents are ready.',
  'Reminder: Departure is tomorrow. Assemble at hotel lobby by 08:00.',
  'Important update regarding your itinerary. Please check details.',
  'Your driver has been assigned. We will share contact details shortly.',
  'Please confirm receipt of your travel insurance documents.',
]

const DEFAULT_TRAVELERS: Traveler[] = [
  {
    id: 'sample-1',
    fullName: 'Rajesh Sharma',
    whatsapp: '+919876543210',
    dietary: 'Veg',
    passport: 'P1234567',
    age: '42',
    notes: 'Window seat preferred',
    docs: { passport: true, visa: true, insurance: false },
  },
  {
    id: 'sample-2',
    fullName: 'Priya Mehta',
    whatsapp: '+919876543211',
    dietary: 'Jain',
    passport: 'P7654321',
    age: '38',
    notes: 'Strictly Jain meals, no root vegetables',
    docs: { passport: true, visa: false, insurance: false },
  },
  {
    id: 'sample-3',
    fullName: 'Arjun Nair',
    whatsapp: '+919876543212',
    dietary: 'Non-Veg',
    passport: '',
    age: '55',
    notes: 'Requires wheelchair assistance at airports',
    docs: { passport: false, visa: false, insurance: true },
  },
]

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function generateId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function avatarColor(name: string): string {
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-sky-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GlassInput({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={cn(
          'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5',
          'text-sm font-medium text-white placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-[#00d084]/40 focus:border-[#00d084]/50',
          'transition-all duration-200',
          props.className
        )}
      />
    </div>
  )
}

function SelectInput({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5 pr-9',
            'text-sm font-medium text-white',
            'focus:outline-none focus:ring-2 focus:ring-[#00d084]/40 focus:border-[#00d084]/50',
            'transition-all duration-200'
          )}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface GroupManagerProps {
  tripId: string
  tripName?: string
}

export function GroupManager({ tripId, tripName }: GroupManagerProps) {
  const storageKey = `group-${tripId}`

  const [travelers, setTravelers] = useState<Traveler[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_TRAVELERS
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as Traveler[]) : DEFAULT_TRAVELERS
    } catch {
      return DEFAULT_TRAVELERS
    }
  })

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showManifest, setShowManifest] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [selectedForWA, setSelectedForWA] = useState<Set<string>>(new Set())
  const [waMessage, setWaMessage] = useState(MESSAGE_TEMPLATES[0])
  const [waCustom, setWaCustom] = useState('')

  // Form state
  const emptyForm = (): Omit<Traveler, 'id' | 'docs'> => ({
    fullName: '',
    whatsapp: '',
    dietary: 'No preference',
    passport: '',
    age: '',
    notes: '',
  })
  const [form, setForm] = useState(emptyForm())
  const [formErrors, setFormErrors] = useState<{ fullName?: string; whatsapp?: string }>({})

  const manifestRef = useRef<HTMLDivElement>(null)

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(travelers))
    }
  }, [travelers, storageKey])

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  function validateForm(): boolean {
    const errors: { fullName?: string; whatsapp?: string } = {}
    if (!form.fullName.trim()) errors.fullName = 'Full name is required.'
    if (form.whatsapp && !/^\+\d{10,15}$/.test(form.whatsapp.trim())) {
      errors.whatsapp = 'Enter a valid number starting with + (e.g. +919876543210).'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmitTraveler() {
    if (!validateForm()) return

    if (editingId) {
      setTravelers((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, ...form, dietary: form.dietary as DietaryPreference }
            : t
        )
      )
      setEditingId(null)
    } else {
      const newTraveler: Traveler = {
        id: generateId(),
        ...form,
        dietary: form.dietary as DietaryPreference,
        docs: { passport: false, visa: false, insurance: false },
      }
      setTravelers((prev) => [...prev, newTraveler])
    }

    setForm(emptyForm())
    setFormErrors({})
    setShowAddForm(false)
  }

  function handleEdit(traveler: Traveler) {
    setForm({
      fullName: traveler.fullName,
      whatsapp: traveler.whatsapp,
      dietary: traveler.dietary,
      passport: traveler.passport,
      age: traveler.age,
      notes: traveler.notes,
    })
    setEditingId(traveler.id)
    setShowAddForm(true)
  }

  function handleDelete(id: string) {
    setTravelers((prev) => prev.filter((t) => t.id !== id))
  }

  function handleCancelForm() {
    setForm(emptyForm())
    setFormErrors({})
    setShowAddForm(false)
    setEditingId(null)
  }

  function toggleDoc(travelerId: string, doc: keyof Traveler['docs']) {
    setTravelers((prev) =>
      prev.map((t) =>
        t.id === travelerId
          ? { ...t, docs: { ...t.docs, [doc]: !t.docs[doc] } }
          : t
      )
    )
  }

  // ---------------------------------------------------------------------------
  // WhatsApp sender
  // ---------------------------------------------------------------------------

  function handleOpenWhatsApp() {
    const message = waCustom.trim() || waMessage
    const targets = travelers.filter(
      (t) => t.whatsapp && selectedForWA.has(t.id)
    )
    targets.forEach((t, i) => {
      setTimeout(() => {
        const encoded = encodeURIComponent(message)
        const num = t.whatsapp.replace(/\D/g, '')
        window.open(`https://wa.me/${num}?text=${encoded}`, '_blank')
      }, i * 600)
    })
    setShowWhatsAppModal(false)
  }

  function handleOpenWhatsAppModal() {
    setSelectedForWA(new Set(travelers.filter((t) => t.whatsapp).map((t) => t.id)))
    setShowWhatsAppModal(true)
  }

  function handlePrint() {
    window.print()
  }

  // ---------------------------------------------------------------------------
  // Dietary summary
  // ---------------------------------------------------------------------------

  const dietarySummary = DIETARY_OPTIONS.reduce(
    (acc, diet) => {
      const count = travelers.filter((t) => t.dietary === diet).length
      if (count > 0) acc[diet] = count
      return acc
    },
    {} as Partial<Record<DietaryPreference, number>>
  )

  const dietarySummaryText = Object.entries(dietarySummary)
    .map(([diet, count]) => `${count} ${diet}`)
    .join(', ')

  // ---------------------------------------------------------------------------
  // Docs checklist
  // ---------------------------------------------------------------------------

  const allDocsReceived =
    travelers.length > 0 &&
    travelers.every(
      (t) => t.docs.passport && t.docs.visa && t.docs.insurance
    )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* ===== SECTION 1: Traveler List ===== */}
      <div
        className={cn(
          'rounded-2xl border border-slate-700/50 overflow-hidden',
          'bg-[#0a1628]/70 backdrop-blur-xl'
        )}
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00d084]/10 border border-[#00d084]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#00d084]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Group Travelers</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                {travelers.length} traveler{travelers.length !== 1 ? 's' : ''} confirmed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showAddForm && !editingId) {
                handleCancelForm()
              } else {
                setEditingId(null)
                setForm(emptyForm())
                setFormErrors({})
                setShowAddForm(true)
              }
            }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-[10px] font-black uppercase tracking-widest transition-all',
              showAddForm && !editingId
                ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                : 'bg-[#00d084]/15 text-[#00d084] hover:bg-[#00d084]/25 border border-[#00d084]/25'
            )}
          >
            {showAddForm && !editingId ? (
              <><X className="w-3.5 h-3.5" /> Cancel</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Add Traveler</>
            )}
          </button>
        </div>

        {/* Add / Edit form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              key="traveler-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-700/40 bg-slate-800/30 space-y-4">
                <h4 className="text-sm font-bold text-white">
                  {editingId ? 'Edit Traveler' : 'New Traveler'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <GlassInput
                      label="Full Name"
                      required
                      placeholder="e.g. Rahul Gupta"
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <GlassInput
                      label="WhatsApp Number"
                      placeholder="+919876543210"
                      value={form.whatsapp}
                      onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    />
                    {formErrors.whatsapp && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.whatsapp}</p>
                    )}
                  </div>
                  <SelectInput
                    label="Dietary Preference"
                    options={DIETARY_OPTIONS}
                    value={form.dietary}
                    onChange={(v) => setForm((f) => ({ ...f, dietary: v as DietaryPreference }))}
                  />
                  <GlassInput
                    label="Age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="For insurance purposes"
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  />
                  <GlassInput
                    label="Passport Number (optional)"
                    placeholder="e.g. P1234567"
                    value={form.passport}
                    onChange={(e) => setForm((f) => ({ ...f, passport: e.target.value }))}
                  />
                  <GlassInput
                    label="Notes"
                    placeholder="Accessibility needs, preferences..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmitTraveler}
                    className="px-5 py-2.5 rounded-xl bg-[#00d084] text-[#0a1628] text-[10px] font-black uppercase tracking-widest hover:bg-[#00d084]/90 transition-colors"
                  >
                    {editingId ? 'Save Changes' : 'Add Traveler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-5 py-2.5 rounded-xl bg-slate-700/60 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Traveler cards */}
        <div className="divide-y divide-slate-700/30">
          <AnimatePresence>
            {travelers.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No travelers added yet. Click &quot;Add Traveler&quot; to get started.
              </div>
            ) : (
              travelers.map((traveler) => (
                <motion.div
                  key={traveler.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/25 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br text-white text-sm font-black flex-shrink-0',
                      avatarColor(traveler.fullName)
                    )}
                  >
                    {getInitials(traveler.fullName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{traveler.fullName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                          DIETARY_COLORS[traveler.dietary]
                        )}
                      >
                        {traveler.dietary}
                      </span>
                      {traveler.age && (
                        <span className="text-[10px] text-slate-400">Age {traveler.age}</span>
                      )}
                      {traveler.notes && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {traveler.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {traveler.whatsapp && (
                      <a
                        href={`https://wa.me/${traveler.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi ' + traveler.fullName + ', regarding your upcoming trip...')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400 hover:bg-green-500/25 transition-colors"
                        title="Open WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(traveler)}
                      className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 hover:bg-blue-500/25 transition-colors"
                      title="Edit traveler"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(traveler.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-colors"
                      title="Remove traveler"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== SECTION 2: Group Actions ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Group Manifest */}
        <button
          type="button"
          onClick={() => setShowManifest(true)}
          className={cn(
            'flex items-center gap-4 p-5 rounded-2xl text-left transition-all',
            'bg-[#0a1628]/70 border border-slate-700/50 hover:border-[#00d084]/30 hover:bg-[#00d084]/5',
            'backdrop-blur-xl group'
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-[#00d084]/10 border border-[#00d084]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00d084]/20 transition-colors">
            <ClipboardList className="w-5 h-5 text-[#00d084]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Group Manifest</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Print-ready traveler list</p>
          </div>
        </button>

        {/* WhatsApp All */}
        <button
          type="button"
          onClick={handleOpenWhatsAppModal}
          className={cn(
            'flex items-center gap-4 p-5 rounded-2xl text-left transition-all',
            'bg-[#0a1628]/70 border border-slate-700/50 hover:border-green-500/30 hover:bg-green-500/5',
            'backdrop-blur-xl group'
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">WhatsApp All</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Broadcast to group</p>
          </div>
        </button>

        {/* Dietary Summary */}
        <div
          className={cn(
            'flex items-start gap-4 p-5 rounded-2xl',
            'bg-[#0a1628]/70 border border-slate-700/50',
            'backdrop-blur-xl'
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Dietary Summary</p>
            <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
              {dietarySummaryText || 'No travelers yet'}
            </p>
            {travelers.some((t) => t.whatsapp) && (
              <button
                type="button"
                onClick={() => {
                  const msg = `Dietary requirements for ${tripName || 'trip'}: ${dietarySummaryText}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                }}
                className="mt-2 text-[9px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                Share with hotel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== SECTION 3: Documents Checklist ===== */}
      <div
        className={cn(
          'rounded-2xl border border-slate-700/50 overflow-hidden',
          'bg-[#0a1628]/70 backdrop-blur-xl'
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/40">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Documents Checklist</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
              Per-traveler document status
            </p>
          </div>
        </div>

        {allDocsReceived && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00d084]/10 border border-[#00d084]/25"
          >
            <CheckCircle2 className="w-5 h-5 text-[#00d084]" />
            <span className="text-sm font-bold text-[#00d084]">
              All documents received for every traveler.
            </span>
          </motion.div>
        )}

        {travelers.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            Add travelers to manage their documents.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {travelers.map((traveler) => (
              <div key={traveler.id} className="flex items-center gap-4 px-6 py-3.5">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0',
                    'bg-gradient-to-br text-white',
                    avatarColor(traveler.fullName)
                  )}
                >
                  {getInitials(traveler.fullName)}
                </div>
                <span className="text-sm font-medium text-white w-36 truncate flex-shrink-0">
                  {traveler.fullName}
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  {(
                    [
                      { key: 'passport', label: 'Passport' },
                      { key: 'visa', label: 'Visa' },
                      { key: 'insurance', label: 'Insurance' },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDoc(traveler.id, key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all',
                        traveler.docs[key]
                          ? 'bg-[#00d084]/15 border-[#00d084]/25 text-[#00d084]'
                          : 'bg-slate-700/40 border-slate-600/40 text-slate-500 hover:border-slate-500/50'
                      )}
                    >
                      {traveler.docs[key] ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== MANIFEST MODAL ===== */}
      <AnimatePresence>
        {showManifest && (
          <motion.div
            key="manifest-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowManifest(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl bg-[#0a1628] border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/40">
                <div>
                  <h3 className="text-base font-bold text-white">Group Manifest</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {tripName || 'Trip'} — {travelers.length} Traveler{travelers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/60 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d084]/15 text-[#00d084] text-[10px] font-black uppercase tracking-widest border border-[#00d084]/25 hover:bg-[#00d084]/25 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManifest(false)}
                    className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Manifest table */}
              <div ref={manifestRef} className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/40 bg-slate-800/40">
                      {['Sr.', 'Name', 'Age', 'Dietary', 'Passport', 'Notes'].map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {travelers.map((t, i) => (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-white">{t.fullName}</td>
                        <td className="px-4 py-3 text-slate-300">{t.age || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                              DIETARY_COLORS[t.dietary]
                            )}
                          >
                            {t.dietary}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">
                          {t.passport || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                          {t.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== WHATSAPP BROADCAST MODAL ===== */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <motion.div
            key="wa-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowWhatsAppModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-[#0a1628] border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/40">
                <div>
                  <h3 className="text-base font-bold text-white">WhatsApp Broadcast</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Send a message to selected travelers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Traveler selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Select Travelers
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const withWA = travelers.filter((t) => t.whatsapp).map((t) => t.id)
                        if (selectedForWA.size === withWA.length) {
                          setSelectedForWA(new Set())
                        } else {
                          setSelectedForWA(new Set(withWA))
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-[#00d084] hover:text-[#00d084]/80 transition-colors"
                    >
                      {selectedForWA.size === travelers.filter((t) => t.whatsapp).length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {travelers
                      .filter((t) => t.whatsapp)
                      .map((t) => (
                        <label
                          key={t.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                            selectedForWA.has(t.id)
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedForWA.has(t.id)}
                            onChange={() => {
                              const next = new Set(selectedForWA)
                              if (next.has(t.id)) next.delete(t.id)
                              else next.add(t.id)
                              setSelectedForWA(next)
                            }}
                            className="w-4 h-4 accent-[#00d084]"
                          />
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0',
                              'bg-gradient-to-br',
                              avatarColor(t.fullName)
                            )}
                          >
                            {getInitials(t.fullName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{t.fullName}</p>
                            <p className="text-[10px] text-slate-400">{t.whatsapp}</p>
                          </div>
                        </label>
                      ))}
                    {travelers.filter((t) => t.whatsapp).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-3">
                        No travelers with WhatsApp numbers added.
                      </p>
                    )}
                  </div>
                </div>

                {/* Message template */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Message Template
                  </span>
                  <div className="space-y-2">
                    {MESSAGE_TEMPLATES.map((tpl) => (
                      <label
                        key={tpl}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm',
                          waMessage === tpl && !waCustom
                            ? 'bg-[#00d084]/10 border-[#00d084]/30 text-white'
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600'
                        )}
                      >
                        <input
                          type="radio"
                          name="wa-template"
                          checked={waMessage === tpl && !waCustom}
                          onChange={() => { setWaMessage(tpl); setWaCustom('') }}
                          className="mt-0.5 accent-[#00d084]"
                        />
                        {tpl}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Custom Message (overrides template)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Type a custom message..."
                    value={waCustom}
                    onChange={(e) => setWaCustom(e.target.value)}
                    className={cn(
                      'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5',
                      'text-sm font-medium text-white placeholder:text-slate-500 resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-[#00d084]/40 focus:border-[#00d084]/50',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Send button */}
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  disabled={selectedForWA.size === 0}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                    'text-[10px] font-black uppercase tracking-widest transition-all',
                    selectedForWA.size > 0
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                      : 'bg-slate-700/60 text-slate-500 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                  Open WhatsApp for {selectedForWA.size} Traveler{selectedForWA.size !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupManager
