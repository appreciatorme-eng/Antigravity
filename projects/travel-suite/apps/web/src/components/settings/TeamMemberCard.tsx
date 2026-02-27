'use client'

import { motion } from 'framer-motion'
import { X, RefreshCw } from 'lucide-react'
import { TeamRole, ROLES, canManageRole } from '@/lib/team/roles'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  phone: string
  avatar: string | null
  status: 'active' | 'pending' | 'suspended'
  joinedAt: string
  lastActive: string
  tripsManaged: number
}

interface TeamMemberCardProps {
  member: TeamMember
  currentUserRole: TeamRole
  onRoleChange?: (memberId: string, newRole: TeamRole) => void
  onRemove?: (memberId: string) => void
  index?: number
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

const STATUS_DOT: Record<TeamMember['status'], React.ReactNode> = {
  active: (
    <span className="inline-block w-2 h-2 rounded-full bg-green-400 shrink-0" />
  ),
  pending: (
    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
  ),
  suspended: (
    <span className="inline-block w-2 h-2 rounded-full bg-red-400 shrink-0" />
  ),
}

const STATUS_LABEL: Record<TeamMember['status'], string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
}

export default function TeamMemberCard({
  member,
  currentUserRole,
  onRoleChange,
  onRemove,
  index = 0,
}: TeamMemberCardProps) {
  const roleDef = ROLES[member.role]
  const canManage = canManageRole(currentUserRole, member.role)
  const isOwner = member.role === 'owner'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Top row: avatar + name + status */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${roleDef.bgColor} ${roleDef.color}`}
        >
          {getInitials(member.name)}
        </div>

        {/* Name / email */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{member.name}</p>
          <p className="text-white/50 text-xs truncate">{member.email}</p>
          {member.phone && (
            <p className="text-white/40 text-xs mt-0.5">{member.phone}</p>
          )}
        </div>

        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 shrink-0">
          {STATUS_DOT[member.status]}
          <span className="text-xs text-white/50">{STATUS_LABEL[member.status]}</span>
        </div>
      </div>

      {/* Role badge + trips stat row */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleDef.bgColor} ${roleDef.color} border border-white/5`}
        >
          {roleDef.label}
        </span>

        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{member.tripsManaged} trips</span>
          <span>·</span>
          <span>Last active: {member.lastActive}</span>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="border-t border-white/5 pt-3 flex items-center gap-3">
          {member.status === 'pending' ? (
            <button
              className="flex items-center gap-1.5 text-xs text-[#00d084] hover:text-[#00b873] font-semibold transition-colors"
              onClick={() => {/* resend invite */ }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Invite
            </button>
          ) : (
            <div className="flex-1">
              <select
                value={member.role}
                onChange={(e) => onRoleChange?.(member.id, e.target.value as TeamRole)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#00d084]/50 cursor-pointer"
              >
                {(Object.keys(ROLES) as TeamRole[]).map((r) => (
                  <option key={r} value={r} className="bg-[#0f2040] text-white">
                    {ROLES[r].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isOwner && member.status !== 'pending' && (
            <button
              onClick={() => onRemove?.(member.id)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors px-2 py-2 rounded-lg hover:bg-red-400/10"
              title="Remove member"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
