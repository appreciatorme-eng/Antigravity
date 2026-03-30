import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SolutionsContent } from './_components/SolutionsContent';

const VALID_TYPES = ['solo', 'agency', 'tmc'] as const;
type SolutionType = (typeof VALID_TYPES)[number];

const solutionsMeta: Record<SolutionType, { title: string; description: string }> = {
  solo: {
    title: 'For Solo Agents',
    description: 'Look like an agency of 50, work like a team of 1. Create breathtaking itineraries in minutes and close clients faster with TripBuilt.',
  },
  agency: {
    title: 'For Scaling Agencies',
    description: 'Systemize your agency and scale your revenue. Centralize bookings, control team permissions, and get real-time pipeline visibility.',
  },
  tmc: {
    title: 'For Corporate TMCs',
    description: 'Enterprise-grade tools for modern corporate travel. White-labeled booking portals, automated expense reporting, and multi-tier approval workflows.',
  },
};

export function generateStaticParams() {
  return VALID_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const meta = solutionsMeta[type as SolutionType];
  if (!meta) {
    return { title: 'Solution Not Found' };
  }

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | TripBuilt`,
      description: meta.description,
    },
  };
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!VALID_TYPES.includes(type as SolutionType)) {
    notFound();
  }

  return <SolutionsContent type={type} />;
}
