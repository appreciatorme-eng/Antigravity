'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, UserCheck, TrendingUp, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { TeamRole } from '@/lib/team/roles'
import TeamMemberCard, { TeamMember } from '@/components/settings/TeamMemberCard'
import InviteModal from '@/components/settings/InviteModal'

const MOCK_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Rajesh Sharma',
    email: 'rajesh@tourfirm.in',
    role: 'owner' as TeamRole,
    phone: '+91 98765 43210',
    avatar: null,
    status: 'active',
    joinedAt: '2024-01-15',
    lastActive: '2 minutes ago',
    tripsManaged: 47,
  },
  {
    id: '2',
    name: 'Priya Nair',
    email: 'priya@tourfirm.in',
    role: 'manager' as TeamRole,
    phone: '+91 87654 32109',
    avatar: null,
    status: 'active',
    joinedAt: '2024-03-20',
    lastActive: '1 hour ago',
    tripsManaged: 31,
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit@tourfirm.in',
    role: 'agent' as TeamRole,
    phone: '+91 76543 21098',
    avatar: null,
    status: 'active',
    joinedAt: '2024-06-10',
    lastActive: '3 hours ago',
    tripsManaged: 18,
  },
  {
    id: '4',
    name: 'Suresh Driver',
    email: 'suresh@tourfirm.in',
    role: 'driver' as TeamRole,
    phone: '+91 65432 10987',
    avatar: null,
    status: 'active',
    joinedAt: '2024-08-05',
    lastActive: 'Yesterday',
    tripsManaged: 92,
  },
  {
    id: '5',
    name: 'Meena Singh',
    email: 'meena@tourfirm.in',
    role: 'agent' as TeamRole,
    phone: '+91 54321 09876',
    avatar: null,
    status: 'pending',
    joinedAt: '2026-02-25',
    lastActive: 'Invited',
    tripsManaged: 0,
  },
]

type FilterTab = 'all' | TeamRole

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owner', label: 'Owner' },
  { id: 'manager', label: 'Manager' },
  { id: 'agent', label: 'Agent' },
  { id: 'driver', label: 'Driver' },
]

const CURRENT_USER_ROLE: TeamRole = 'owner'

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showInvite, setShowInvite] = useState(false)

  const filtered =
    filter === 'all' ? team : team.filter((m) => m.role === filter)

  const activeCount = team.filter((m) => m.status === 'active').length
  const tripsThisMonth = 23

  const handleRoleChange = (memberId: string, newRole: TeamRole) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    )
  }

  const handleRemove = (memberId: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleInvite = (email: string, role: TeamRole, name: string) => {
    const newMember: TeamMember = {
      id: String(Date.now()),
      name,
      email,
      role,
      phone: '',
      avatar: null,
      status: 'pending',
      joinedAt: new Date().toISOString().slice(0, 10),
      lastActive: 'Invited',
      tripsManaged: 0,
    }
    setTeam((prev) => [...prev, newMember])
  }

  return (
    <>
      <div className="min-h-screen bg-[#0a1628] p-6 text-white">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Back link */}
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Settings
          </Link>

          {/* Page header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">Team Members</h1>
              <span className="bg-white/10 text-white/70 text-sm font-semibold px-3 py-1 rounded-full">
                {team.length}
              </span>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 bg-[#00d084] hover:bg-[#00b873] text-black font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Users,
                label: 'Total Members',
                value: team.length,
                color: 'text-blue-400',
                bg: 'bg-blue-400/10',
              },
              {
                icon: UserCheck,
                label: 'Active Now',
                value: activeCount,
                color: 'text-[#00d084]',
                bg: 'bg-[#00d084]/10',
              },
              {
                icon: TrendingUp,
                label: 'Trips This Month',
                value: tripsThisMonth,
                color: 'text-purple-400',
                bg: 'bg-purple-400/10',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/50 text-sm">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => {
              const isActive = filter === tab.id
              const count =
                tab.id === 'all'
                  ? team.length
                  : team.filter((m) => m.role === tab.id).length
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#00d084] text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Member grid */}
          {filtered.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40">
              No members in this role.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((member, i) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  currentUserRole={CURRENT_USER_ROLE}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={handleInvite}
      />
    </>
  )
}
