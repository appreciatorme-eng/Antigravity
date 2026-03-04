import { redirect } from "next/navigation";

export default function ReputationWidgetPage() {
  redirect("/reputation?tab=settings");
}
