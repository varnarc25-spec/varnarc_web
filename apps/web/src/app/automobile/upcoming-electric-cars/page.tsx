import type { Metadata } from 'next';
import { AutomobileDiscoveryLanding } from '@/components/automobile/discovery-landing';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  return buildAutomobileMetadata({
    title: 'Upcoming Electric Cars in India | Varnarc',
    description:
      'Electric models with a future year or EXPECTED/RUMOURED status. Rumours are labelled, never confirmed.',
    path: '/automobile/upcoming-electric-cars',
  });
}

export default async function UpcomingEvPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(typeof sp.page === 'string' ? sp.page : 1) || 1;
  return (
    <AutomobileDiscoveryLanding
      path="/automobile/upcoming-electric-cars"
      page={page}
      crumbsLabel="Upcoming EVs"
      h1Override="Upcoming electric cars"
      descriptionOverride="Electric catalogue rows with a future model year or expected/rumoured launch status."
      query={{ fuelType: 'Electric', launchMode: 'upcoming', sort: 'newest' }}
    />
  );
}
