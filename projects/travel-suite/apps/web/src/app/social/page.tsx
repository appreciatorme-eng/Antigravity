import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocialStudioClient } from "./_components/SocialStudioClient";

export default async function SocialStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch the organization details to seed the templates
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, phone')
    .eq('id', user.id)
    .single();

  let orgData: {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    phone: string | null;
    subscription_tier: string | null;
  } = {
    name: "Travel Agency",
    logo_url: null,
    primary_color: null,
    phone: profile?.phone || null,
    subscription_tier: null,
  };

  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, primary_color, subscription_tier')
      .eq('id', profile.organization_id)
      .single();

    if (org) {
      orgData = {
        name: org.name,
        logo_url: org.logo_url,
        primary_color: org.primary_color || null,
        phone: profile?.phone || null,
        subscription_tier: org.subscription_tier || null,
      };
    }
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 py-8">
      <SocialStudioClient initialOrgData={orgData} />
    </div>
  );
}
