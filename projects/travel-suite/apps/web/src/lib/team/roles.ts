export type TeamRole = 'owner' | 'manager' | 'agent' | 'driver'

export interface RoleDefinition {
  id: TeamRole
  label: string
  description: string
  color: string
  bgColor: string
  permissions: Permission[]
}

export type Permission =
  | 'view_all_trips'
  | 'edit_all_trips'
  | 'view_assigned_trips'
  | 'edit_assigned_trips'
  | 'view_clients'
  | 'edit_clients'
  | 'view_revenue'
  | 'manage_billing'
  | 'send_whatsapp'
  | 'view_proposals'
  | 'edit_proposals'
  | 'manage_team'
  | 'view_reports'
  | 'manage_drivers'
  | 'driver_daily_view'

const ALL_PERMISSIONS: Permission[] = [
  'view_all_trips',
  'edit_all_trips',
  'view_assigned_trips',
  'edit_assigned_trips',
  'view_clients',
  'edit_clients',
  'view_revenue',
  'manage_billing',
  'send_whatsapp',
  'view_proposals',
  'edit_proposals',
  'manage_team',
  'view_reports',
  'manage_drivers',
  'driver_daily_view',
]

const MANAGER_PERMISSIONS: Permission[] = [
  'view_all_trips',
  'edit_all_trips',
  'view_assigned_trips',
  'edit_assigned_trips',
  'view_clients',
  'edit_clients',
  'view_revenue',
  'send_whatsapp',
  'view_proposals',
  'edit_proposals',
  'view_reports',
  'manage_drivers',
]

export const ROLES: Record<TeamRole, RoleDefinition> = {
  owner: {
    id: 'owner',
    label: 'Owner',
    description: 'Full access to everything',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    permissions: ALL_PERMISSIONS,
  },
  manager: {
    id: 'manager',
    label: 'Manager',
    description: 'Manages trips, clients and team (no billing)',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    permissions: MANAGER_PERMISSIONS,
  },
  agent: {
    id: 'agent',
    label: 'Sales Agent',
    description: 'Creates quotes and manages assigned clients',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    permissions: [
      'view_assigned_trips',
      'edit_assigned_trips',
      'view_clients',
      'edit_clients',
      'send_whatsapp',
      'view_proposals',
      'edit_proposals',
    ],
  },
  driver: {
    id: 'driver',
    label: 'Driver',
    description: 'Sees only their assigned trips for the day',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    permissions: ['driver_daily_view', 'view_assigned_trips'],
  },
}

export function hasPermission(role: TeamRole, permission: Permission): boolean {
  return ROLES[role].permissions.includes(permission)
}

export function getRoleLabel(role: TeamRole): string {
  return ROLES[role].label
}

/**
 * owner can manage all roles.
 * manager can manage agent and driver only.
 * agent and driver cannot manage anyone.
 */
export function canManageRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
  if (actorRole === 'owner') return true
  if (actorRole === 'manager') return targetRole === 'agent' || targetRole === 'driver'
  return false
}
