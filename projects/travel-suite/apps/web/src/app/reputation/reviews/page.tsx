import { redirect } from "next/navigation";

export default function ReputationReviewsPage() {
  redirect("/reputation?tab=reviews");
}
