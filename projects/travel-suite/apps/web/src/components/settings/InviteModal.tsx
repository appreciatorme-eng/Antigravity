'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Send } from 'lucide-react'
import { TeamRole, ROLES, Permission } from '@/lib/team/roles'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite?: (email: string, role: TeamRole, name: string) => void
}

const ROLE_KEY_PERMISSIONS: Record<TeamRole, Permission[]> = {
  owner: ['manage_team', 'manage_billing', 'view_reports'],
  manager: ['view_all_trips', 'edit_all_trips', 'manage_drivers'],
  agent: ['view_assigned_trips', 'edit_proposals', 'send_whatsapp'],
  driver: ['driver_daily_view', 'view_assigned_trips'],
}

const PERMISSION_LABELS: Record<Permission, string> = {
  view_all_trips: 'View all trips',
  edit_all_trips: 'Edit all trips',
  view_assigned_trips: 'View assigned trips',
  edit_assigned_trips: 'Edit assigned trips',
  view_clients: 'View clients',
  edit_clients: 'Edit clients',
  view_revenue: 'View revenue',
  manage_billing: 'Manage billing',
  send_whatsapp: 'Send WhatsApp messages',
  view_proposals: 'View proposals',
  edit_proposals: 'Create & edit proposals',
  manage_team: 'Manage team members',
  view_reports: 'View analytics & reports',
  manage_drivers: 'Manage drivers',
  driver_daily_view: 'Daily trip dashboard',
}

const ORDERED_ROLES: TeamRole[] = ['owner', 'manager', 'agent', 'driver']

export default function InviteModal({ isOpen, onClose, onInvite }: InviteModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedRole, setSelectedRole] = useState<TeamRole>('agent')
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSubmittedEmail(email)
    onInvite?.(email, selectedRole, name)
    setSubmitted(true)
  }

  const handleClose = () => {
    onClose()
    // Reset after animation completes
    setTimeout(() => {
      setName('')
      setEmail('')
      setPhone('')
      setSelectedRole('agent')
      setSubmitted(false)
      setSubmittedEmail('')
    }, 300)
  }

  const glassInput =
    'w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#00d084]/60 focus:bg-white/8 transition-colors'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="invite-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="invite-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative bg-[#0f2040]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
                    <button
                      onClick={handleClose}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        required
                        className={glassInput}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="priya@tourfirm.in"
                        required
                        className={glassInput}
                      />
                    </div>

                    {/* Role Selector — 2×2 grid */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        Role
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ORDERED_ROLES.map((role) => {
                          const def = ROLES[role]
                          const isSelected = selectedRole === role
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setSelectedRole(role)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-[#00d084] bg-[#00d084]/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              }`}
                            >
                              <p className={`text-sm font-semibold ${def.color}`}>
                                {def.label}
                              </p>
                              <p className="text-white/40 text-xs mt-0.5 leading-snug">
                                {def.description}
                              </p>
                              <p className="text-white/30 text-xs mt-1">
                                {def.permissions.length} permissions
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Permissions preview */}
                    <div className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Key permissions for {ROLES[selectedRole].label}
                      </p>
                      {ROLE_KEY_PERMISSIONS[selectedRole].map((perm) => (
                        <div key={perm} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] shrink-0" />
                          <span className="text-xs text-white/70">{PERMISSION_LABELS[perm]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Phone (optional) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        Phone Number{' '}
                        <span className="text-white/30 normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className={glassInput}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full bg-[#00d084] hover:bg-[#00b873] text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                    >
                      Send Invite
                      <Send className="w-4 h-4" />
                    </button>

                    <p className="text-center text-xs text-white/30 leading-relaxed">
                      They'll receive an email with a link to join your workspace.
                      <br />
                      Invite expires in 7 days.
                    </p>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center py-8 text-center gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-[#00d084]" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-white">
                      Invite sent to {submittedEmail}!
                    </h3>
                    <p className="text-white/50 text-sm">They'll receive an email shortly.</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-4 bg-[#00d084] hover:bg-[#00b873] text-black font-semibold rounded-xl px-8 py-3 transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
