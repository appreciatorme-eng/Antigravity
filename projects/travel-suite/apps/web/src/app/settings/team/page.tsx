'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Plus, TrendingUp, UserCheck, Users } from 'lucide-react'
import { GlassButton } from '@/components/glass/GlassButton'
import { GlassCard } from '@/components/glass/GlassCard'
import { GlassBadge } from '@/components/glass/GlassBadge'
import InviteModal from '@/components/settings/InviteModal'
import TeamMemberCard from '@/components/settings/TeamMemberCard'
import type { TeamRole } from '@/lib/team/roles'
import { useTeamMembers } from './useTeamMembers'

type FilterTab = 'all' | TeamRole

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owner', label: 'Owner' },
  { id: 'manager', label: 'Manager' },
  { id: 'agent', label: 'Agent' },
  { id: 'driver', label: 'Driver' },
]

export default function TeamPage() {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showInvite, setShowInvite] = useState(false)
  const {
    members,
    stats,
    currentUserRole,
    organizationName,
    viewerCanManageTeam,
    loading,
    error,
    refresh,
    inviteMember,
    updateMemberRole,
    removeMember,
    resendInvite,
  } = useTeamMembers()

  const filteredMembers = useMemo(
    () => (filter === 'all' ? members : members.filter((member) => member.role === filter)),
    [filter, members]
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <GlassCard className="p-8 text-center text-slate-600 dark:text-slate-300">
          Loading team workspace…
        </GlassCard>
      </div>
    )
  }

  return (
    <>
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
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Team Workspace</h1>
              <GlassBadge variant="info">{organizationName}</GlassBadge>
            </div>
            <p className="text-sm text-slate-600 dark:text-white/60">
              Manage operators, drivers, and invite-only access from real workspace membership data.
            </p>
          </div>

          {viewerCanManageTeam ? (
            <GlassButton onClick={() => setShowInvite(true)} className="rounded-2xl">
              <Plus className="w-4 h-4" />
              Invite Member
            </GlassButton>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="flex items-center gap-4 border-slate-200/60 dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalMembers}</p>
              <p className="text-sm text-slate-600 dark:text-white/60">Total members</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4 border-slate-200/60 dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.activeMembers}</p>
              <p className="text-sm text-slate-600 dark:text-white/60">Active members</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4 border-slate-200/60 dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.tripsThisMonth}</p>
              <p className="text-sm text-slate-600 dark:text-white/60">Trips this month</p>
            </div>
          </GlassCard>
        </div>

        {error ? (
          <GlassCard className="space-y-4 border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Could not load team data</h2>
              <p className="text-sm text-slate-700 dark:text-white/70">{error}</p>
            </div>
            <GlassButton variant="secondary" onClick={refresh}>
              Retry
            </GlassButton>
          </GlassCard>
        ) : null}

        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.id
            const count =
              tab.id === 'all'
                ? members.length
                : members.filter((member) => member.role === tab.id).length

            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white/70 text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-white/5 dark:text-white/70 dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-black/15 text-white' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white/60'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {filteredMembers.length === 0 ? (
          <GlassCard className="space-y-4 border-dashed border-slate-300 dark:border-white/10 text-center">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No team members in this view</h2>
              <p className="text-sm text-slate-600 dark:text-white/60">
                Switch filters or invite a new teammate to get this workspace staffed.
              </p>
            </div>
            {viewerCanManageTeam ? (
              <div className="flex justify-center">
                <GlassButton onClick={() => setShowInvite(true)}>
                  <Plus className="w-4 h-4" />
                  Invite your first member
                </GlassButton>
              </div>
            ) : null}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredMembers.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                currentUserRole={currentUserRole}
                index={index}
                onRoleChange={updateMemberRole}
                onRemove={(memberId) => removeMember(memberId, member.name)}
                onResendInvite={(memberId) => resendInvite(memberId, member.name)}
              />
            ))}
          </div>
        )}
      </div>

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={async (payload) => {
          await inviteMember(payload)
          setShowInvite(false)
        }}
      />
    </>
  )
}
