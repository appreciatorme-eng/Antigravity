import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocialStudioClient } from "./_components/SocialStudioClient";

export default async function SocialStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
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
  } = {
    name: "Travel Agency",
    logo_url: null,
    primary_color: null,
    phone: profile?.phone || null
  };

  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, primary_color')
      .eq('id', profile.organization_id)
      .single();

    if (org) {
      orgData = {
        name: org.name,
        logo_url: org.logo_url,
        primary_color: org.primary_color || null,
        phone: profile?.phone || null
      };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SocialStudioClient initialOrgData={orgData} />
    </div>
  );
}
