import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAutomobileCategory,
  getAutomobileDiscoveryByPath,
  listAutomobileCategories,
} from '@varnarc/validation';
import { AutomobileDiscoveryLanding } from '@/components/automobile/discovery-landing';
import { discoveryFilterToQuery } from '@/components/automobile/discovery-landing';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';
import { fetchAutomobileModels } from '@/services/automobile';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 60;

export function generateStaticParams() {
  const fromCat = listAutomobileCategories().map((c) => ({ slug: c.slug }));
  const extra = [
    'muv',
    'automatic-cars',
    'cng-cars',
    'diesel-cars',
    'petrol-cars',
    'electric-cars',
    'hybrid-cars',
    '7-seater-cars',
    'best-mileage-cars',
    'safest-cars',
    'best-cars-for-families',
    'best-cars-for-city-driving',
    'best-cars-for-highway-driving',
    'best-cars-for-beginners',
    'best-cars-for-long-drives',
    'best-cars-for-bad-roads',
    'best-cars-for-large-families',
  ].map((slug) => ({ slug }));
  return [...fromCat, ...extra];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const path = `/automobile/${slug}`;
  const landing = getAutomobileDiscoveryByPath(path);
  const category = getAutomobileCategory(slug);
  if (!landing && !category) return { title: 'Automobile' };
  const models = landing
    ? await fetchAutomobileModels({ ...discoveryFilterToQuery(landing.filter), limit: 12 })
    : await fetchAutomobileModels({
        bodyType: category?.filter.bodyType,
        fuelType: category?.filter.fuelType,
        limit: 12,
      });
  return buildAutomobileMetadata({
    title: landing?.title ?? category?.title ?? 'Automobile',
    description: landing?.description ?? category?.description,
    path,
    searchParams: sp,
    forceNoIndex: (models.data?.total ?? 0) === 0,
  });
}

export default async function AutomobileCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const path = `/automobile/${slug}`;
  if (!getAutomobileDiscoveryByPath(path) && !getAutomobileCategory(slug)) notFound();
  const page = Number(typeof sp.page === 'string' ? sp.page : 1) || 1;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;
  return (
    <AutomobileDiscoveryLanding
      path={path}
      page={page}
      sort={sort}
      crumbsLabel={getAutomobileDiscoveryByPath(path)?.h1 ?? getAutomobileCategory(slug)?.name}
      query={
        getAutomobileDiscoveryByPath(path)
          ? undefined
          : {
              bodyType: getAutomobileCategory(slug)?.filter.bodyType,
              fuelType: getAutomobileCategory(slug)?.filter.fuelType,
            }
      }
    />
  );
}
