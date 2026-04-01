"use client";

import { useEffect, useState } from "react";
import type { TeamRole } from "@/lib/team/roles";
import { useToast } from "@/components/ui/toast";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { InviteTeamMemberInput, TeamMember, TeamStats } from "./team.types";

type TeamResponse = {
  data: {
    members: TeamMember[];
    stats: TeamStats;
    currentUserRole: TeamRole;
    organizationName: string;
    viewerCanManageTeam: boolean;
  } | null;
  error: string | null;
};

const EMPTY_STATS: TeamStats = {
  totalMembers: 0,
  activeMembers: 0,
  pendingMembers: 0,
  tripsThisMonth: 0,
};

export function useTeamMembers() {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>(EMPTY_STATS);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole>("agent");
  const [organizationName, setOrganizationName] = useState("Workspace");
  const [viewerCanManageTeam, setViewerCanManageTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTeamMembers() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/settings/team", {
          cache: "no-store",
        });
        const payload = (await response.json()) as TeamResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Failed to load team members");
        }

        if (cancelled) return;

        setMembers(payload.data.members);
        setStats(payload.data.stats);
        setCurrentUserRole(payload.data.currentUserRole);
        setOrganizationName(payload.data.organizationName);
        setViewerCanManageTeam(payload.data.viewerCanManageTeam);
      } catch (loadError) {
        if (cancelled) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load team members";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeamMembers();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const refresh = () => setRefreshTick((current) => current + 1);

  async function mutate(
    request: () => Promise<Response>,
    successTitle: string,
    successDescription?: string
  ) {
    const response = await request();
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Request failed");
    }

    toast({
      title: successTitle,
      description: successDescription,
      variant: "success",
    });
    refresh();
  }

  return {
    members,
    stats,
    currentUserRole,
    organizationName,
    viewerCanManageTeam,
    loading,
    error,
    refresh,
    inviteMember: async (input: InviteTeamMemberInput) =>
      mutate(
        () =>
          authedFetch("/api/settings/team/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }),
        "Invite sent",
        `${input.email} will receive an invitation shortly.`
      ),
    updateMemberRole: async (memberId: string, role: Exclude<TeamRole, "owner">) =>
      mutate(
        () =>
          authedFetch(`/api/settings/team/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          }),
        "Role updated"
      ),
    removeMember: async (memberId: string, memberName: string) =>
      mutate(
        () =>
          authedFetch(`/api/settings/team/${memberId}`, {
            method: "DELETE",
          }),
        "Member removed",
        `${memberName} no longer has access to this workspace.`
      ),
    resendInvite: async (memberId: string, memberName: string) =>
      mutate(
        () =>
          authedFetch(`/api/settings/team/${memberId}/resend`, {
            method: "POST",
          }),
        "Invite resent",
        `A fresh invitation was sent to ${memberName}.`
      ),
  };
}
