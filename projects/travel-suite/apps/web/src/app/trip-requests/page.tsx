import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import { TripRequestsInbox } from "./trip-requests-inbox";

export default async function TripRequestsPage() {
  const supabase = await createClient();

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    logError("[trip-requests/page] failed to resolve user", error);
  }

  if (!user) {
    redirect("/auth");
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id || !["admin", "super_admin"].includes(profile.role ?? "")) {
      redirect("/dashboard");
    }
  } catch (error) {
    logError("[trip-requests/page] failed to resolve profile", error);
    redirect("/dashboard");
  }

  return <TripRequestsInbox />;
}
