'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DietaryPreference = 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan' | 'No preference'

export interface Traveler {
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

export const DIETARY_OPTIONS: DietaryPreference[] = ['Veg', 'Non-Veg', 'Jain', 'Vegan', 'No preference']

export const DIETARY_COLORS: Record<DietaryPreference, string> = {
  Veg: 'bg-green-500/15 text-green-400 border-green-500/25',
  'Non-Veg': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  Jain: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  Vegan: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  'No preference': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
}

export const MESSAGE_TEMPLATES = [
  'Your trip is confirmed! Please ensure all documents are ready.',
  'Reminder: Departure is tomorrow. Assemble at hotel lobby by 08:00.',
  'Important update regarding your itinerary. Please check details.',
  'Your driver has been assigned. We will share contact details shortly.',
  'Please confirm receipt of your travel insurance documents.',
]

export const DEFAULT_TRAVELERS: Traveler[] = [
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

export function generateId(): string {
  return `t-${crypto.randomUUID()}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function avatarColor(name: string): string {
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-sky-600',
  ]
  let hash = 0
  for (let index = 0; index < name.length; index++) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function GlassInput({
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
          props.className,
        )}
      />
    </div>
  )
}

export function SelectInput({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'w-full appearance-none bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5 pr-9',
            'text-sm font-medium text-white',
            'focus:outline-none focus:ring-2 focus:ring-[#00d084]/40 focus:border-[#00d084]/50',
            'transition-all duration-200',
          )}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}
