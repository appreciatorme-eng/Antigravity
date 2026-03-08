import type { TeamRole } from "@/lib/team/roles";

export type TeamMemberStatus = "active" | "pending" | "suspended";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  phone: string;
  avatar: string | null;
  status: TeamMemberStatus;
  joinedAt: string;
  lastActive: string;
  tripsManaged: number;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  tripsThisMonth: number;
}

export interface InviteTeamMemberInput {
  email: string;
  name: string;
  phone?: string;
  role: Exclude<TeamRole, "owner">;
}
