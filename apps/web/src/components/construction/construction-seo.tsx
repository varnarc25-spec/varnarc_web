import { JsonLd } from '@/components/seo/json-ld';
import {
  buildConstructionJsonLdGraph,
  formatConstructionLastUpdated,
  type ConstructionCrumbInput,
} from '@/lib/construction/seo';

type ConstructionSeoProps = {
  breadcrumbs?: ConstructionCrumbInput[];
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
  howTo?: {
    name: string;
    description?: string | null;
    steps: Array<{ name: string; text: string }>;
  };
  /** When set, renders a visible “Last updated” line (also used for OG modifiedTime via metadata). */
  lastUpdated?: Date | string | null;
  lastUpdatedLabel?: string;
  className?: string;
};

/**
 * Renders Construction JSON-LD (+ optional last-updated stamp).
 * Pair with `buildConstructionMetadata` / `buildConstructionPageMetadata` in page `generateMetadata`.
 *
 * Does not emit Product / Review / AggregateRating — educational construction content only.
 */
export function ConstructionSeo({
  breadcrumbs,
  webPage,
  article,
  faqs,
  itemList,
  webApplication,
  howTo,
  lastUpdated,
  lastUpdatedLabel = 'Last updated',
  className,
}: ConstructionSeoProps) {
  const graph = buildConstructionJsonLdGraph({
    breadcrumbs,
    webPage,
    article,
    faqs,
    itemList,
    webApplication,
    howTo,
  });
  const stamped = formatConstructionLastUpdated(lastUpdated);

  return (
    <>
      {graph.length > 0 ? <JsonLd data={graph} /> : null}
      {stamped ? (
        <p
          className={className ?? 'text-xs text-slate-500'}
          data-construction-last-updated={stamped}
        >
          {lastUpdatedLabel}: {stamped}
        </p>
      ) : null}
    </>
  );
}
