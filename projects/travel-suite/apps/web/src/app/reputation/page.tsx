import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReputationDashboard } from "./_components/ReputationDashboard";

export default async function ReputationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  let orgName = "My Agency";
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();
    if (org) orgName = org.name;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ReputationDashboard organizationName={orgName} />
    </div>
  );
}
