import { redirect } from "next/navigation";

/**
 * /trips/new — redirects to /trips?create=true which opens the CreateTripModal.
 *
 * Without this dedicated route, the [id] dynamic segment captures "new" as a
 * trip ID, causing a 400 error when the API tries to fetch trip details for
 * an ID of "new". Because Next.js gives static segments priority over dynamic
 * ones, this file intercepts the request before [id]/page.tsx can handle it.
 */
export default function TripsNewPage() {
  redirect("/trips?create=true");
}
