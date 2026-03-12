'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  FileDown,
  Printer,
  Send,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  avatarColor,
  DIETARY_COLORS,
  getInitials,
  MESSAGE_TEMPLATES,
  type Traveler,
} from './group-manager-shared'

interface ManifestModalProps {
  manifestRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  onPrint: () => void
  showManifest: boolean
  travelers: Traveler[]
  tripName?: string
}

export function ManifestModal({
  manifestRef,
  onClose,
  onPrint,
  showManifest,
  travelers,
  tripName,
}: ManifestModalProps) {
  return (
    <AnimatePresence>
      {showManifest && (
        <motion.div
          key="manifest-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl bg-[#0a1628] border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl"
          >
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
                  onClick={onPrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/60 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={onPrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d084]/15 text-[#00d084] text-[10px] font-black uppercase tracking-widest border border-[#00d084]/25 hover:bg-[#00d084]/25 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div ref={manifestRef} className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 bg-slate-800/40">
                    {['Sr.', 'Name', 'Age', 'Dietary', 'Passport', 'Notes'].map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {travelers.map((traveler, index) => (
                    <tr key={traveler.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{traveler.fullName}</td>
                      <td className="px-4 py-3 text-slate-300">{traveler.age || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                            DIETARY_COLORS[traveler.dietary],
                          )}
                        >
                          {traveler.dietary}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {traveler.passport || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                        {traveler.notes || '—'}
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
  )
}

interface WhatsAppBroadcastModalProps {
  onClose: () => void
  onSend: () => void
  selectedForWA: Set<string>
  setSelectedForWA: React.Dispatch<React.SetStateAction<Set<string>>>
  setWaCustom: React.Dispatch<React.SetStateAction<string>>
  setWaMessage: React.Dispatch<React.SetStateAction<string>>
  showWhatsAppModal: boolean
  travelers: Traveler[]
  waCustom: string
  waMessage: string
}

export function WhatsAppBroadcastModal({
  onClose,
  onSend,
  selectedForWA,
  setSelectedForWA,
  setWaCustom,
  setWaMessage,
  showWhatsAppModal,
  travelers,
  waCustom,
  waMessage,
}: WhatsAppBroadcastModalProps) {
  const travelersWithWhatsApp = travelers.filter((traveler) => traveler.whatsapp)

  return (
    <AnimatePresence>
      {showWhatsAppModal && (
        <motion.div
          key="wa-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-[#0a1628] border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/40">
              <div>
                <h3 className="text-base font-bold text-white">WhatsApp Broadcast</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Send a message to selected travelers
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Select Travelers
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const travelerIds = travelersWithWhatsApp.map((traveler) => traveler.id)
                      if (selectedForWA.size === travelerIds.length) {
                        setSelectedForWA(new Set())
                      } else {
                        setSelectedForWA(new Set(travelerIds))
                      }
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-[#00d084] hover:text-[#00d084]/80 transition-colors"
                  >
                    {selectedForWA.size === travelersWithWhatsApp.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-2">
                  {travelersWithWhatsApp.map((traveler) => (
                    <label
                      key={traveler.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                        selectedForWA.has(traveler.id)
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedForWA.has(traveler.id)}
                        onChange={() => {
                          const next = new Set(selectedForWA)
                          if (next.has(traveler.id)) next.delete(traveler.id)
                          else next.add(traveler.id)
                          setSelectedForWA(next)
                        }}
                        className="w-4 h-4 accent-[#00d084]"
                      />
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0',
                          'bg-gradient-to-br',
                          avatarColor(traveler.fullName),
                        )}
                      >
                        {getInitials(traveler.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{traveler.fullName}</p>
                        <p className="text-[10px] text-slate-400">{traveler.whatsapp}</p>
                      </div>
                    </label>
                  ))}
                  {travelersWithWhatsApp.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">
                      No travelers with WhatsApp numbers added.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Message Template
                </span>
                <div className="space-y-2">
                  {MESSAGE_TEMPLATES.map((template) => (
                    <label
                      key={template}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm',
                        waMessage === template && !waCustom
                          ? 'bg-[#00d084]/10 border-[#00d084]/30 text-white'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600',
                      )}
                    >
                      <input
                        type="radio"
                        name="wa-template"
                        checked={waMessage === template && !waCustom}
                        onChange={() => {
                          setWaMessage(template)
                          setWaCustom('')
                        }}
                        className="mt-0.5 accent-[#00d084]"
                      />
                      {template}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Custom Message (overrides template)
                </label>
                <textarea
                  rows={3}
                  placeholder="Type a custom message..."
                  value={waCustom}
                  onChange={(event) => setWaCustom(event.target.value)}
                  className={cn(
                    'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5',
                    'text-sm font-medium text-white placeholder:text-slate-500 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-[#00d084]/40 focus:border-[#00d084]/50',
                    'transition-all duration-200',
                  )}
                />
              </div>

              <button
                type="button"
                onClick={onSend}
                disabled={selectedForWA.size === 0}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                  'text-[10px] font-black uppercase tracking-widest transition-all',
                  selectedForWA.size > 0
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                    : 'bg-slate-700/60 text-slate-500 cursor-not-allowed',
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
  )
}
