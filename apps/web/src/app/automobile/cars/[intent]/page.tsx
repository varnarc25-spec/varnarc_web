import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAutomobileDiscoveryByPath } from '@varnarc/validation';
import { AutomobileDiscoveryLanding } from '@/components/automobile/discovery-landing';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';
import { fetchAutomobileModels } from '@/services/automobile';
import { discoveryFilterToQuery } from '@/components/automobile/discovery-landing';

type Props = {
  params: Promise<{ intent: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 60;

export function generateStaticParams() {
  return [
    'under-5-lakh',
    'under-10-lakh',
    'under-15-lakh',
    'under-20-lakh',
    'under-25-lakh',
    'under-30-lakh',
  ].map((intent) => ({ intent }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { intent } = await params;
  const sp = await searchParams;
  const path = `/automobile/cars/${intent}`;
  const landing = getAutomobileDiscoveryByPath(path);
  if (!landing) return { title: 'Cars' };
  const models = await fetchAutomobileModels({
    ...discoveryFilterToQuery(landing.filter),
    limit: 12,
  });
  return buildAutomobileMetadata({
    title: landing.title,
    description: landing.description,
    path,
    searchParams: sp,
    forceNoIndex: (models.data?.total ?? 0) === 0,
  });
}

export default async function AutomobileBudgetCarsPage({ params, searchParams }: Props) {
  const { intent } = await params;
  const sp = await searchParams;
  const path = `/automobile/cars/${intent}`;
  if (!getAutomobileDiscoveryByPath(path)) notFound();
  const page = Number(typeof sp.page === 'string' ? sp.page : 1) || 1;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;
  return <AutomobileDiscoveryLanding path={path} page={page} sort={sort} crumbsLabel="Cars" />;
}
