import type { Metadata } from 'next';
import PricingPageContent from './_components/PricingPageContent';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for TripBuilt. Start free, upgrade as you grow. Plans for solo operators to large travel agencies.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing | TripBuilt',
    description: 'Transparent pricing for every stage of your travel business growth.',
    images: [{ url: '/api/og?title=Pricing&subtitle=Simple+transparent+pricing', width: 1200, height: 630 }],
  },
};

export default function PricingPage() {
  return <PricingPageContent />;
}
