/**
 * Pure Schema.org JSON-LD builders (no React / network).
 *
 * Rules of thumb:
 * - Emit only nodes that reflect visible page content.
 * - AggregateRating requires a real reviewCount (≥ 1).
 * - Prefer WebApplication for browser calculators over SoftwareApplication.
 */

export type JsonLdObject = Record<string, unknown>;

export type JsonLdBreadcrumbItem = { name: string; url: string };

export type JsonLdFaqItem = { question: string; answer: string };

export type JsonLdListItem = { name: string; url?: string; position: number };

export type JsonLdHowToStep = { name: string; text: string; position?: number };

export type JsonLdAggregateRatingInput = {
  ratingValue: number;
  /** Required — never emit AggregateRating without a real review count. */
  reviewCount: number;
};

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

/** Absolute URL helper for builders that receive a site origin + path. */
export function jsonLdAbsoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const base = siteUrl.replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

/** Keep FAQs that have non-empty question + answer (visible content gate). */
export function filterVisibleFaqs(faqs: JsonLdFaqItem[]): JsonLdFaqItem[] {
  return faqs.filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0);
}

/**
 * AggregateRating only when reviewCount is a positive integer.
 * Returns undefined when data is incomplete — callers must not invent reviews.
 */
export function buildAggregateRatingJsonLd(
  input: JsonLdAggregateRatingInput | null | undefined,
): JsonLdObject | undefined {
  if (!input) return undefined;
  if (!Number.isFinite(input.ratingValue)) return undefined;
  if (!Number.isInteger(input.reviewCount) || input.reviewCount < 1) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: input.ratingValue,
    reviewCount: input.reviewCount,
  };
}

export function breadcrumbJsonLd(items: JsonLdBreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webPageJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  /** Absolute URL of the parent WebSite (e.g. site homepage). */
  isPartOfUrl?: string | null;
  dateModified?: string | null;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    isPartOf: input.isPartOfUrl
      ? { '@type': 'WebSite', '@id': input.isPartOfUrl, url: input.isPartOfUrl }
      : undefined,
    dateModified: input.dateModified ?? undefined,
  });
}

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  image?: string | null;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description ?? undefined,
    mainEntityOfPage: input.url,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    image: input.image ?? undefined,
    author: input.authorName
      ? { '@type': 'Person', name: input.authorName }
      : { '@type': 'Organization', name: 'Varnarc' },
    publisher: {
      '@type': 'Organization',
      name: 'Varnarc',
      url: 'https://varnarc.com',
    },
  });
}

export function reviewJsonLd(input: {
  title: string;
  url: string;
  score?: number | null;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: input.title,
    url: input.url,
    reviewRating:
      input.score != null
        ? {
            '@type': 'Rating',
            ratingValue: input.score,
            bestRating: 5,
          }
        : undefined,
    author: {
      '@type': 'Organization',
      name: 'Varnarc',
    },
  });
}

export function itemListJsonLd(input: {
  name: string;
  url: string;
  items: JsonLdListItem[];
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    url: input.url,
    itemListElement: input.items.map((item) =>
      stripUndefined({
        '@type': 'ListItem',
        position: item.position,
        name: item.name,
        url: item.url,
      }),
    ),
  };
}

export function faqJsonLd(faqs: JsonLdFaqItem[]): JsonLdObject {
  const visible = filterVisibleFaqs(faqs);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visible.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function howToJsonLd(input: {
  name: string;
  description?: string | null;
  steps: JsonLdHowToStep[];
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description ?? undefined,
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: step.position ?? index + 1,
      name: step.name,
      text: step.text,
    })),
  });
}

export function localBusinessJsonLd(input: {
  name: string;
  description?: string | null;
  url?: string | null;
  phone?: string | null;
  email?: string | null;
  image?: string | null;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string | null;
    addressCountry: string;
    postalCode?: string | null;
  };
  geo?: { latitude: number; longitude: number };
  aggregateRating?: JsonLdAggregateRatingInput;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url ?? undefined,
    telephone: input.phone ?? undefined,
    email: input.email ?? undefined,
    image: input.image ?? undefined,
    address: input.address
      ? {
          '@type': 'PostalAddress',
          ...input.address,
        }
      : undefined,
    geo: input.geo
      ? {
          '@type': 'GeoCoordinates',
          latitude: input.geo.latitude,
          longitude: input.geo.longitude,
        }
      : undefined,
    aggregateRating: buildAggregateRatingJsonLd(input.aggregateRating),
  });
}

export function organizationJsonLd(input: {
  name: string;
  description?: string | null;
  url?: string | null;
  logo?: string | null;
  sameAs?: string[];
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url ?? undefined,
    logo: input.logo ?? undefined,
    sameAs: input.sameAs?.length ? input.sameAs : undefined,
  });
}

export function websiteJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  searchUrlTemplate?: string;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    ...(input.searchUrlTemplate
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: input.searchUrlTemplate,
            },
            'query-input': 'required name=search_term_string',
          },
        }
      : {}),
  });
}

export function softwareApplicationJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  applicationCategory?: string | null;
  operatingSystem?: string | null;
  image?: string | null;
  offers?: {
    price?: string | number | null;
    priceCurrency?: string;
    description?: string | null;
  };
  aggregateRating?: JsonLdAggregateRatingInput;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    applicationCategory: input.applicationCategory ?? 'BusinessApplication',
    operatingSystem: input.operatingSystem ?? undefined,
    image: input.image ?? undefined,
    offers: input.offers
      ? {
          '@type': 'Offer',
          price: input.offers.price ?? 0,
          priceCurrency: input.offers.priceCurrency ?? 'USD',
          description: input.offers.description ?? undefined,
        }
      : undefined,
    aggregateRating: buildAggregateRatingJsonLd(input.aggregateRating),
  });
}

/** Browser-based tools/calculators — prefer over SoftwareApplication when no installable app exists. */
export function webApplicationJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  applicationCategory?: string | null;
  operatingSystem?: string | null;
  image?: string | null;
  browserRequirements?: string | null;
  offers?: {
    price?: string | number | null;
    priceCurrency?: string;
    description?: string | null;
  };
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    applicationCategory: input.applicationCategory ?? 'BusinessApplication',
    operatingSystem: input.operatingSystem ?? 'Any',
    browserRequirements: input.browserRequirements ?? 'Requires JavaScript',
    image: input.image ?? undefined,
    offers: input.offers
      ? {
          '@type': 'Offer',
          price: input.offers.price ?? 0,
          priceCurrency: input.offers.priceCurrency ?? 'INR',
          description: input.offers.description ?? undefined,
        }
      : undefined,
  });
}

/**
 * Product schema — use only for genuine product offer pages with buyable inventory.
 * Do not use for educational construction material / cement / steel discussion pages.
 */
export function productJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
  brand?: string | null;
  offers?: {
    price?: string | number | null;
    priceCurrency?: string;
    url?: string | null;
  };
  aggregateRating?: JsonLdAggregateRatingInput;
}): JsonLdObject {
  return stripUndefined({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    image: input.image ?? undefined,
    brand: input.brand
      ? {
          '@type': 'Brand',
          name: input.brand,
        }
      : undefined,
    offers: input.offers
      ? {
          '@type': 'Offer',
          price: input.offers.price ?? 0,
          priceCurrency: input.offers.priceCurrency ?? 'USD',
          url: input.offers.url ?? input.url,
          availability: 'https://schema.org/InStock',
        }
      : undefined,
    aggregateRating: buildAggregateRatingJsonLd(input.aggregateRating),
  });
}

/** Ensure a node (or graph) is JSON-serializable and has a schema.org @type. */
export function assertValidJsonLdNode(
  node: unknown,
  label = 'JSON-LD',
): asserts node is JsonLdObject {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    throw new Error(`${label}: expected a plain object`);
  }
  const obj = node as JsonLdObject;
  if (typeof obj['@type'] !== 'string' || !obj['@type']) {
    throw new Error(`${label}: missing @type`);
  }
  try {
    JSON.stringify(node);
  } catch {
    throw new Error(`${label}: not JSON-serializable`);
  }
}

export function assertValidJsonLdGraph(
  graph: unknown[],
  label = 'JSON-LD graph',
): asserts graph is JsonLdObject[] {
  if (!Array.isArray(graph)) throw new Error(`${label}: expected an array`);
  graph.forEach((node, i) => assertValidJsonLdNode(node, `${label}[${i}]`));
}

/** Collect @type values from a graph (supports string or string[]). */
export function jsonLdGraphTypes(graph: JsonLdObject[]): string[] {
  const types: string[] = [];
  for (const node of graph) {
    const t = node['@type'];
    if (typeof t === 'string') types.push(t);
    else if (Array.isArray(t)) {
      for (const x of t) if (typeof x === 'string') types.push(x);
    }
  }
  return types;
}
