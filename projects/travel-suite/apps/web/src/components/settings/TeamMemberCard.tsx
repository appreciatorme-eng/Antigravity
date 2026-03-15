'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, X } from 'lucide-react'
import { TeamRole, ROLES, canManageRole } from '@/lib/team/roles'
import type { TeamMember } from '@/app/settings/team/team.types'
import { GlassBadge } from '@/components/glass/GlassBadge'
import { GlassButton } from '@/components/glass/GlassButton'
import { GlassCard } from '@/components/glass/GlassCard'

export interface TeamMemberCardProps {
  member: TeamMember
  currentUserRole: TeamRole
  onRoleChange?: (memberId: string, newRole: Exclude<TeamRole, 'owner'>) => Promise<void> | void
  onRemove?: (memberId: string) => Promise<void> | void
  onResendInvite?: (memberId: string) => Promise<void> | void
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
  onResendInvite,
  index = 0,
}: TeamMemberCardProps) {
  const [busyAction, setBusyAction] = useState<'role' | 'remove' | 'resend' | null>(null)
  const roleDef = ROLES[member.role]
  const canManage = canManageRole(currentUserRole, member.role)
  const isOwner = member.role === 'owner'
  const roleOptions: Array<Exclude<TeamRole, 'owner'>> =
    currentUserRole === 'owner' ? ['manager', 'agent', 'driver'] : ['agent', 'driver']

  const statusVariant =
    member.status === 'active'
      ? 'success'
      : member.status === 'pending'
        ? 'warning'
        : 'danger'

  const handleRoleChange = async (nextRole: string) => {
    if (!onRoleChange) return
    setBusyAction('role')
    try {
      await onRoleChange(member.id, nextRole as Exclude<TeamRole, 'owner'>)
    } finally {
      setBusyAction(null)
    }
  }

  const handleRemove = async () => {
    if (!onRemove) return
    setBusyAction('remove')
    try {
      await onRemove(member.id)
    } finally {
      setBusyAction(null)
    }
  }

  const handleResend = async () => {
    if (!onResendInvite) return
    setBusyAction('resend')
    try {
      await onResendInvite(member.id)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <GlassCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      padding="lg"
      className="flex flex-col gap-4 border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5"
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
          <p className="text-white/75 text-xs truncate">{member.email}</p>
          {member.phone && (
            <p className="text-white/70 text-xs mt-0.5">{member.phone}</p>
          )}
        </div>

        {/* Status dot + label */}
        <div className="flex items-center gap-2 shrink-0">
          {STATUS_DOT[member.status]}
          <GlassBadge variant={statusVariant} size="sm">
            {STATUS_LABEL[member.status]}
          </GlassBadge>
        </div>
      </div>

      {/* Role badge + trips stat row */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleDef.bgColor} ${roleDef.color} border border-white/5`}
        >
          {roleDef.label}
        </span>

        <div className="flex items-center gap-3 text-xs text-white/75">
          <span>{member.tripsManaged} trips</span>
          <span>·</span>
          <span>Last active: {member.lastActive}</span>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="border-t border-white/5 pt-3 flex items-center gap-3">
          {member.status === 'pending' ? (
            <GlassButton
              variant="secondary"
              size="sm"
              loading={busyAction === 'resend'}
              className="rounded-xl"
              onClick={handleResend}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Invite
            </GlassButton>
          ) : (
            <div className="flex-1">
              <select
                value={member.role}
                disabled={busyAction === 'role'}
                onChange={(e) => void handleRoleChange(e.target.value)}
                aria-label={`Change role for ${member.name}`}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-[#00d084]/50 cursor-pointer"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r} className="bg-[#0f2040] text-white">
                    {ROLES[r].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isOwner && member.status !== 'pending' && (
            <GlassButton
              variant="danger"
              size="sm"
              loading={busyAction === 'remove'}
              onClick={handleRemove}
              title="Remove member"
            >
              {busyAction !== 'remove' ? <X className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Remove
            </GlassButton>
          )}
        </div>
      )}
    </GlassCard>
  )
}
