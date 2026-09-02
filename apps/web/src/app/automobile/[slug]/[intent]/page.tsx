import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAutomobileDiscoveryByPath } from '@varnarc/validation';
import { AutomobileDiscoveryLanding } from '@/components/automobile/discovery-landing';
import { discoveryFilterToQuery } from '@/components/automobile/discovery-landing';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';
import { fetchAutomobileModels } from '@/services/automobile';

type Props = {
  params: Promise<{ slug: string; intent: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 60;

export function generateStaticParams() {
  return [
    { slug: 'suv', intent: 'under-15-lakh' },
    { slug: 'automatic-cars', intent: 'under-10-lakh' },
    { slug: 'cng-cars', intent: 'under-10-lakh' },
    { slug: 'electric-cars', intent: 'under-15-lakh' },
    { slug: 'electric-cars', intent: 'under-20-lakh' },
    { slug: '7-seater-cars', intent: 'under-20-lakh' },
  ];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug, intent } = await params;
  const sp = await searchParams;
  const path = `/automobile/${slug}/${intent}`;
  const landing = getAutomobileDiscoveryByPath(path);
  if (!landing) return { robots: { index: false, follow: false } };
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

export default async function AutomobileComboPage({ params, searchParams }: Props) {
  const { slug, intent } = await params;
  const sp = await searchParams;
  const path = `/automobile/${slug}/${intent}`;
  if (!getAutomobileDiscoveryByPath(path)) notFound();
  const page = Number(typeof sp.page === 'string' ? sp.page : 1) || 1;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;
  return <AutomobileDiscoveryLanding path={path} page={page} sort={sort} />;
}
