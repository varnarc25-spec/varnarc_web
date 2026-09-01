/**
 * Automobile-specific JSON-LD graph assembly.
 *
 * Product is allowed for vehicle detail pages with a real price Offer.
 * AggregateRating only when reviewCount ≥ 1 (never fabricate ratings).
 */

import {
  articleJsonLd,
  assertValidJsonLdGraph,
  breadcrumbJsonLd,
  faqJsonLd,
  filterVisibleFaqs,
  itemListJsonLd,
  jsonLdAbsoluteUrl,
  jsonLdGraphTypes,
  organizationJsonLd,
  productJsonLd,
  webApplicationJsonLd,
  webPageJsonLd,
  type JsonLdFaqItem,
  type JsonLdObject,
} from '../seo-json-ld';

export type AutomobileJsonLdCrumb = { name: string; path: string };

export type BuildAutomobileJsonLdGraphInput = {
  siteUrl: string;
  breadcrumbs?: AutomobileJsonLdCrumb[];
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
  faqs?: JsonLdFaqItem[];
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
  /** Vehicle product pages — include Offer only when a real price exists. */
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
  /** Manufacturer / brand organization pages. */
  organization?: {
    name: string;
    description?: string | null;
    path: string;
    url?: string | null;
    logo?: string | null;
  };
};

const MIN_FAQ_FOR_FAQPAGE = 2;

export function buildAutomobileJsonLdGraph(input: BuildAutomobileJsonLdGraphInput): JsonLdObject[] {
  const abs = (path: string) => jsonLdAbsoluteUrl(input.siteUrl, path);
  const siteHome = abs('/');
  const graph: JsonLdObject[] = [];

  if (input.breadcrumbs?.length) {
    graph.push(
      breadcrumbJsonLd(
        input.breadcrumbs.map((c) => ({
          name: c.name,
          url: abs(c.path),
        })),
      ),
    );
  }

  if (input.webPage) {
    graph.push(
      webPageJsonLd({
        name: input.webPage.name,
        description: input.webPage.description,
        url: abs(input.webPage.path),
        isPartOfUrl: siteHome,
        dateModified: input.webPage.dateModified,
      }),
    );
  }

  if (input.article) {
    graph.push(
      articleJsonLd({
        title: input.article.title,
        description: input.article.description,
        url: abs(input.article.path),
        datePublished: input.article.datePublished,
        dateModified: input.article.dateModified ?? input.article.datePublished,
        image: input.article.image,
      }),
    );
  }

  const faqs = filterVisibleFaqs(input.faqs ?? []);
  if (faqs.length >= MIN_FAQ_FOR_FAQPAGE) {
    graph.push(faqJsonLd(faqs));
  }

  if (input.itemList && input.itemList.items.length > 0) {
    graph.push(
      itemListJsonLd({
        name: input.itemList.name,
        url: abs(input.itemList.path),
        items: input.itemList.items.map((item, i) => ({
          name: item.name,
          url: item.path ? abs(item.path) : undefined,
          position: i + 1,
        })),
      }),
    );
  }

  if (input.webApplication) {
    graph.push(
      webApplicationJsonLd({
        name: input.webApplication.name,
        description: input.webApplication.description,
        url: abs(input.webApplication.path),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Any',
        image: input.webApplication.image,
        offers: {
          price: 0,
          priceCurrency: 'INR',
          description: 'Free web calculator — indicative estimates only',
        },
      }),
    );
  }

  if (input.product) {
    const price =
      input.product.price != null && input.product.price !== ''
        ? Number(input.product.price)
        : null;
    const hasPrice = price != null && Number.isFinite(price) && price > 0;
    const rating = input.product.aggregateRating;
    const hasRating =
      rating != null &&
      Number.isFinite(rating.ratingValue) &&
      Number.isFinite(rating.reviewCount) &&
      rating.reviewCount >= 1;

    graph.push(
      productJsonLd({
        name: input.product.name,
        description: input.product.description,
        url: abs(input.product.path),
        image: input.product.image,
        brand: input.product.brand,
        offers: hasPrice
          ? {
              price,
              priceCurrency: input.product.priceCurrency ?? 'INR',
              url: abs(input.product.path),
            }
          : undefined,
        aggregateRating: hasRating
          ? {
              ratingValue: rating!.ratingValue,
              reviewCount: rating!.reviewCount,
            }
          : undefined,
      }),
    );
  }

  if (input.organization) {
    graph.push(
      organizationJsonLd({
        name: input.organization.name,
        description: input.organization.description,
        url: input.organization.url
          ? input.organization.url.startsWith('http')
            ? input.organization.url
            : abs(input.organization.url)
          : abs(input.organization.path),
        logo: input.organization.logo ?? undefined,
      }),
    );
  }

  assertValidJsonLdGraph(graph, 'automobile JSON-LD');
  return graph;
}

export function automobileJsonLdGraphTypes(graph: JsonLdObject[]): string[] {
  return jsonLdGraphTypes(graph);
}
