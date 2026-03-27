import { headers } from "next/headers";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getPortalPaymentData } from "@/lib/payments/portal-lookup";
import { PaymentCheckoutClient } from "./PaymentCheckoutClient";

async function getOriginFromHeaders() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "https";

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL || undefined;
  }

  return `${protocol}://${host}`;
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await getPortalPaymentData(token, await getOriginFromHeaders());

  if (!link) {
    notFound();
  }

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{
        background:
          "radial-gradient(circle at top, rgba(0,208,132,0.18), transparent 28%), linear-gradient(180deg, #08111f 0%, #0b1728 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- payment page needs Razorpay before hydration */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="beforeInteractive"
      />
      <PaymentCheckoutClient initialLink={link} />
    </main>
  );
}
