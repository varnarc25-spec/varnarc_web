/**
 * Construction-specific JSON-LD graph assembly.
 *
 * Intentionally omits Product / Review / AggregateRating — construction pages
 * discuss materials and tools educationally; do not imply a buyable SKU or
 * fabricated ratings.
 */

import {
  articleJsonLd,
  assertValidJsonLdGraph,
  breadcrumbJsonLd,
  faqJsonLd,
  filterVisibleFaqs,
  howToJsonLd,
  itemListJsonLd,
  jsonLdAbsoluteUrl,
  jsonLdGraphTypes,
  softwareApplicationJsonLd,
  webApplicationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
  type JsonLdFaqItem,
  type JsonLdHowToStep,
  type JsonLdObject,
} from '../seo-json-ld';

export type ConstructionJsonLdCrumb = { name: string; path: string };

export type BuildConstructionJsonLdGraphInput = {
  /** Public site origin, e.g. https://varnarc.com */
  siteUrl: string;
  breadcrumbs?: ConstructionJsonLdCrumb[];
  /**
   * WebPage for hubs / non-article editorial pages (e.g. construction homepage).
   * Prefer over Article when the page is not a dated guide.
   */
  webPage?: {
    name: string;
    description?: string | null;
    path: string;
    dateModified?: string | null;
  };
  /**
   * Optional section WebSite (rare). Prefer site-wide WebSite in root layout;
   * use only when a distinct Construction WebSite entity is justified.
   */
  website?: {
    name: string;
    path: string;
    description?: string | null;
  };
  article?: {
    title: string;
    description?: string | null;
    path: string;
    datePublished?: string | null;
    dateModified?: string | null;
    image?: string | null;
  };
  /** FAQPage only when ≥ 2 visible Q&As matching on-page content. */
  faqs?: JsonLdFaqItem[];
  itemList?: {
    name: string;
    path: string;
    items: Array<{ name: string; path?: string }>;
  };
  /** Genuine interactive calculator / tool pages only (browser). */
  webApplication?: {
    name: string;
    description?: string | null;
    path: string;
    image?: string | null;
  };
  /**
   * Installable/native-style apps only. Do not combine with webApplication
   * on the same page — pick one accurate type.
   */
  softwareApplication?: {
    name: string;
    description?: string | null;
    path: string;
    image?: string | null;
  };
  /** Visible how-to steps only (e.g. catalog material with guide steps). */
  howTo?: {
    name: string;
    description?: string | null;
    steps: JsonLdHowToStep[];
  };
};

const MIN_FAQ_FOR_FAQPAGE = 2;

export function buildConstructionJsonLdGraph(
  input: BuildConstructionJsonLdGraphInput,
): JsonLdObject[] {
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

  if (input.website) {
    graph.push(
      websiteJsonLd({
        name: input.website.name,
        url: abs(input.website.path),
        description: input.website.description,
      }),
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

  if (input.howTo && input.howTo.steps.length > 0) {
    graph.push(
      howToJsonLd({
        name: input.howTo.name,
        description: input.howTo.description,
        steps: input.howTo.steps,
      }),
    );
  }

  // Prefer WebApplication for browser calculators; never emit both.
  if (input.webApplication && !input.softwareApplication) {
    graph.push(
      webApplicationJsonLd({
        name: input.webApplication.name,
        description: input.webApplication.description,
        url: abs(input.webApplication.path),
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        image: input.webApplication.image,
        offers: {
          price: 0,
          priceCurrency: 'INR',
          description: 'Free web calculator — indicative estimates only',
        },
      }),
    );
  } else if (input.softwareApplication) {
    graph.push(
      softwareApplicationJsonLd({
        name: input.softwareApplication.name,
        description: input.softwareApplication.description,
        url: abs(input.softwareApplication.path),
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        image: input.softwareApplication.image,
        offers: {
          price: 0,
          priceCurrency: 'INR',
          description: 'Free tool — indicative estimates only',
        },
      }),
    );
  }

  assertValidJsonLdGraph(graph, 'construction JSON-LD');

  // Safety: construction graph must never invent Product / Review markup.
  const types = jsonLdGraphTypes(graph);
  for (const forbidden of ['Product', 'Review', 'AggregateRating'] as const) {
    if (types.includes(forbidden)) {
      throw new Error(`construction JSON-LD must not include ${forbidden}`);
    }
  }

  return graph;
}

/** Minimum FAQ count required before FAQPage is emitted. */
export const CONSTRUCTION_JSON_LD_MIN_FAQS = MIN_FAQ_FOR_FAQPAGE;
