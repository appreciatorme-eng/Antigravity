import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { TeamRole } from "@/lib/team/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

type AdminClient = ReturnType<typeof createAdminClient>;

type TeamProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "email"
  | "phone"
  | "avatar_url"
  | "role"
  | "organization_id"
  | "created_at"
  | "updated_at"
>;

type TeamOrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "name" | "owner_id"
>;

type TeamContext = {
  admin: AdminClient;
  user: User;
  actorProfile: TeamProfileRow;
  organization: TeamOrganizationRow;
  actorRole: TeamRole;
};

type ResolveTeamContextResult =
  | { context: TeamContext; response?: never }
  | { context?: never; response: Response };

export type TeamMemberStatus = "active" | "pending" | "suspended";

export type TeamMemberPayload = {
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
};

export function mapProfileRoleToTeamRole(
  profileRole: string | null,
  memberId: string,
  ownerId: string | null
): TeamRole {
  if (ownerId && memberId === ownerId) {
    return "owner";
  }

  if (profileRole === "admin") {
    return "manager";
  }

  if (profileRole === "driver") {
    return "driver";
  }

  return "agent";
}

export function mapTeamRoleToProfileRole(role: TeamRole): string {
  switch (role) {
    case "manager":
      return "admin";
    case "driver":
      return "driver";
    case "owner":
      return "admin";
    case "agent":
    default:
      return "agent";
  }
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "Never";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Unknown";

  const diffMs = Date.now() - timestamp;
  if (diffMs <= 0) return "Just now";

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

function toIsoDate(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

async function loadAuthUsersByEmail(
  admin: AdminClient,
  emails: string[]
): Promise<Map<string, User>> {
  const wantedEmails = new Set(
    emails.map((email) => email.trim().toLowerCase()).filter(Boolean)
  );
  const usersByEmail = new Map<string, User>();

  if (wantedEmails.size === 0) return usersByEmail;

  const perPage = 500;
  for (let page = 1; page <= 6; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const users = data.users ?? [];
    for (const user of users) {
      const email = user.email?.trim().toLowerCase();
      if (!email || !wantedEmails.has(email)) continue;
      usersByEmail.set(email, user);
    }

    if (users.length < perPage || usersByEmail.size >= wantedEmails.size) {
      break;
    }
  }

  return usersByEmail;
}

function deriveMemberStatus(authUser: User | undefined): TeamMemberStatus {
  if (!authUser) return "pending";
  if (authUser.banned_until) return "suspended";
  if (authUser.last_sign_in_at || authUser.email_confirmed_at) return "active";
  return "pending";
}

function deriveLastActive(status: TeamMemberStatus, authUser: User | undefined, profile: TeamProfileRow): string {
  if (status === "pending") {
    return "Invite sent";
  }

  return formatRelativeTime(authUser?.last_sign_in_at ?? profile.updated_at ?? profile.created_at);
}

export async function resolveTeamContext(): Promise<ResolveTeamContextResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: Response.json({ data: null, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const admin = createAdminClient();

  const { data: actorProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role, organization_id, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logError("[settings/team] failed to load actor profile", profileError);
    return {
      response: Response.json(
        { data: null, error: "Failed to load team context" },
        { status: 500 }
      ),
    };
  }

  if (!actorProfile?.organization_id) {
    return {
      response: Response.json({ data: null, error: "Organization not found" }, { status: 404 }),
    };
  }

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id, name, owner_id")
    .eq("id", actorProfile.organization_id)
    .maybeSingle();

  if (organizationError) {
    logError("[settings/team] failed to load organization", organizationError);
    return {
      response: Response.json(
        { data: null, error: "Failed to load organization" },
        { status: 500 }
      ),
    };
  }

  if (!organization) {
    return {
      response: Response.json({ data: null, error: "Organization not found" }, { status: 404 }),
    };
  }

  return {
    context: {
      admin,
      user,
      actorProfile,
      organization,
      actorRole: mapProfileRoleToTeamRole(actorProfile.role, actorProfile.id, organization.owner_id),
    },
  };
}

export function requireTeamManager(context: TeamContext): Response | null {
  if (context.actorRole === "owner" || context.actorRole === "manager") {
    return null;
  }

  return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
}

export async function loadTeamMembers(context: TeamContext): Promise<{
  members: TeamMemberPayload[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    tripsThisMonth: number;
  };
}> {
  const { admin, organization } = context;
  const { data: members, error: membersError } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role, organization_id, created_at, updated_at")
    .eq("organization_id", organization.id)
    .neq("role", "client")
    .order("created_at", { ascending: true });

  if (membersError) {
    throw membersError;
  }

  const teamMembers = (members ?? []) as TeamProfileRow[];
  const memberIds = teamMembers.map((member) => member.id);
  const emails = teamMembers.map((member) => member.email ?? "");

  const [authUsersByEmail, itineraryResult, tripResult] = await Promise.all([
    loadAuthUsersByEmail(admin, emails),
    memberIds.length > 0
      ? admin.from("itineraries").select("user_id").in("user_id", memberIds)
      : Promise.resolve({ data: [], error: null }),
    admin
      .from("trips")
      .select("driver_id, created_at")
      .eq("organization_id", organization.id),
  ]);

  if (itineraryResult.error) {
    throw itineraryResult.error;
  }

  if (tripResult.error) {
    throw tripResult.error;
  }

  const itinerariesByUser = new Map<string, number>();
  for (const itinerary of itineraryResult.data ?? []) {
    if (!itinerary.user_id) continue;
    itinerariesByUser.set(
      itinerary.user_id,
      (itinerariesByUser.get(itinerary.user_id) ?? 0) + 1
    );
  }

  const driverTripsByUser = new Map<string, number>();
  let tripsThisMonth = 0;
  const currentMonthStart = new Date();
  currentMonthStart.setUTCDate(1);
  currentMonthStart.setUTCHours(0, 0, 0, 0);

  for (const trip of tripResult.data ?? []) {
    if (trip.driver_id) {
      driverTripsByUser.set(
        trip.driver_id,
        (driverTripsByUser.get(trip.driver_id) ?? 0) + 1
      );
    }

    if (trip.created_at && new Date(trip.created_at) >= currentMonthStart) {
      tripsThisMonth += 1;
    }
  }

  const payload = teamMembers.map((member) => {
    const authUser = member.email
      ? authUsersByEmail.get(member.email.trim().toLowerCase())
      : undefined;
    const role = mapProfileRoleToTeamRole(member.role, member.id, organization.owner_id);
    const status = deriveMemberStatus(authUser);
    const name = member.full_name?.trim() || member.email?.split("@")[0] || "Team member";

    return {
      id: member.id,
      name,
      email: member.email?.trim() || "No email on file",
      role,
      phone: member.phone?.trim() || "",
      avatar: member.avatar_url,
      status,
      joinedAt: toIsoDate(member.created_at),
      lastActive: deriveLastActive(status, authUser, member),
      tripsManaged:
        role === "driver"
          ? driverTripsByUser.get(member.id) ?? 0
          : itinerariesByUser.get(member.id) ?? 0,
    } satisfies TeamMemberPayload;
  });

  const activeMembers = payload.filter((member) => member.status === "active").length;
  const pendingMembers = payload.filter((member) => member.status === "pending").length;

  return {
    members: payload,
    stats: {
      totalMembers: payload.length,
      activeMembers,
      pendingMembers,
      tripsThisMonth,
    },
  };
}
