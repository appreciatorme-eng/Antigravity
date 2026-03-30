import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocialStudioClient } from "./_components/SocialStudioClient";

export default async function SocialStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch profile + organization in a single query using a join
  const { data: profileWithOrg } = await supabase
    .from('profiles')
    .select('phone, organization_id, organizations(name, logo_url, primary_color, subscription_tier)')
    .eq('id', user.id)
    .single();

  const org = profileWithOrg?.organizations as {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    subscription_tier: string | null;
  } | null;

  const orgData = {
    name: org?.name ?? "Travel Agency",
    logo_url: org?.logo_url ?? null,
    primary_color: org?.primary_color ?? null,
    phone: profileWithOrg?.phone ?? null,
    subscription_tier: org?.subscription_tier ?? null,
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 py-8">
      <SocialStudioClient initialOrgData={orgData} />
    </div>
  );
}
