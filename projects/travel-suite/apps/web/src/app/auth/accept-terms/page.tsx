import type { Metadata } from "next";
import AcceptTermsContent from "./_components/AcceptTermsContent";

export const metadata: Metadata = {
    title: "Accept Terms — TripBuilt",
    description: "Please accept our Terms of Service and Privacy Policy to continue.",
    robots: { index: false, follow: false },
};

export default function AcceptTermsPage() {
    return <AcceptTermsContent />;
}
