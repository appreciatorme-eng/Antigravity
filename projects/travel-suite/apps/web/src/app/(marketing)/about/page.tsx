import type { Metadata } from 'next';
import AboutPageContent from './_components/AboutPageContent';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about TripBuilt — the team building the future of Indian travel agency management software. Our mission, story, and values.',
  openGraph: {
    title: 'About TripBuilt',
    description: 'Meet the team behind TripBuilt, the all-in-one OS for modern Indian tour operators.',
    images: [{ url: '/api/og?title=About+Us&subtitle=The+team+behind+TripBuilt', width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}
