import type { Metadata } from 'next';
import { AutomobileDiscoveryLanding } from '@/components/automobile/discovery-landing';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  return buildAutomobileMetadata({
    title: 'New Car Launches in India | Varnarc',
    description:
      'Recently launched cars by model year. Launch status is labelled when stored — rumours are not confirmed facts.',
    path: '/automobile/new-car-launches',
  });
}

export default async function NewCarLaunchesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(typeof sp.page === 'string' ? sp.page : 1) || 1;
  return (
    <AutomobileDiscoveryLanding
      path="/automobile/new-car-launches"
      page={page}
      crumbsLabel="New launches"
      h1Override="New car launches"
      descriptionOverride="Models from the current or previous year, plus CONFIRMED launch status when stored."
      query={{ launchMode: 'launches', sort: 'newest' }}
    />
  );
}
