import { redirect } from "next/navigation";

export default function ReputationSettingsPage() {
  redirect("/reputation?tab=settings");
}
