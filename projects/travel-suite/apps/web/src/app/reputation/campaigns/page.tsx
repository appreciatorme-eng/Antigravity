import { redirect } from "next/navigation";

export default function ReputationCampaignsPage() {
  redirect("/reputation?tab=campaigns");
}
