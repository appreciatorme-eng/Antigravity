import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import { ReputationDashboard } from "./_components/ReputationDashboard";

async function getOrganizationName(userId: string): Promise<string> {
  const fallback = "My Agency";

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) return fallback;

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    return org?.name ?? fallback;
  } catch (error) {
    logError("Failed to load organization name for reputation page", error);
    return fallback;
  }
}

export default async function ReputationPage() {
  const supabase = await createClient();

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    logError("Failed to get user for reputation page", error);
  }

  if (!user) redirect("/auth");

  const orgName = await getOrganizationName(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <ReputationDashboard organizationName={orgName} />
    </div>
  );
}
