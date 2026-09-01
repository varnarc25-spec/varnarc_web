import { JsonLd } from '@/components/seo/json-ld';
import {
  buildAutomobileJsonLdGraph,
  formatAutomobileLastUpdated,
  type AutomobileCrumbInput,
} from '@/lib/automobile/seo';

type AutomobileSeoProps = {
  breadcrumbs?: AutomobileCrumbInput[];
  webPage?: {
    name: string;
    description?: string | null;
    path: string;
    dateModified?: string | null;
  };
  article?: {
    title: string;
    description?: string | null;
    path: string;
    datePublished?: string | null;
    dateModified?: string | null;
    image?: string | null;
  };
  faqs?: Array<{ question: string; answer: string }>;
  itemList?: {
    name: string;
    path: string;
    items: Array<{ name: string; path?: string }>;
  };
  webApplication?: {
    name: string;
    description?: string | null;
    path: string;
    image?: string | null;
  };
  product?: {
    name: string;
    description?: string | null;
    path: string;
    image?: string | null;
    brand?: string | null;
    price?: string | number | null;
    priceCurrency?: string;
    aggregateRating?: { ratingValue: number; reviewCount: number } | null;
  };
  organization?: {
    name: string;
    description?: string | null;
    path: string;
    url?: string | null;
    logo?: string | null;
  };
  lastUpdated?: Date | string | null;
  lastUpdatedLabel?: string;
  className?: string;
};

/**
 * Renders Automobile JSON-LD (+ optional last-updated stamp).
 * Pair with `buildAutomobileMetadata` / `buildAutomobilePageMetadata` in page `generateMetadata`.
 *
 * Product + AggregateRating only when real price / reviewCount are provided.
 */
export function AutomobileSeo({
  breadcrumbs,
  webPage,
  article,
  faqs,
  itemList,
  webApplication,
  product,
  organization,
  lastUpdated,
  lastUpdatedLabel = 'Last updated',
  className,
}: AutomobileSeoProps) {
  const graph = buildAutomobileJsonLdGraph({
    breadcrumbs,
    webPage,
    article,
    faqs,
    itemList,
    webApplication,
    product,
    organization,
  });
  const stamped = formatAutomobileLastUpdated(lastUpdated);

  return (
    <>
      {graph.length > 0 ? <JsonLd data={graph} /> : null}
      {stamped ? (
        <p className={className ?? 'text-xs text-slate-500'} data-automobile-last-updated={stamped}>
          {lastUpdatedLabel}: {stamped}
        </p>
      ) : null}
    </>
  );
}
