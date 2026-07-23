type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
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

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  datePublished?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description ?? undefined,
    mainEntityOfPage: input.url,
    datePublished: input.datePublished ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Varnarc',
    },
  };
}

export function reviewJsonLd(input: {
  title: string;
  url: string;
  score?: number | null;
}) {
  return {
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
  };
}

export function itemListJsonLd(input: {
  name: string;
  url: string;
  items: Array<{ name: string; url?: string; position: number }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    url: input.url,
    itemListElement: input.items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
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
  aggregateRating?: { ratingValue: number; reviewCount: number };
}) {
  return {
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
    aggregateRating: input.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: input.aggregateRating.ratingValue,
          reviewCount: input.aggregateRating.reviewCount,
        }
      : undefined,
  };
}

export function organizationJsonLd(input: {
  name: string;
  description?: string | null;
  url?: string | null;
  logo?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    description: input.description ?? undefined,
    url: input.url ?? undefined,
    logo: input.logo ?? undefined,
  };
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
  aggregateRating?: { ratingValue: number; reviewCount: number };
}) {
  return {
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
    aggregateRating: input.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: input.aggregateRating.ratingValue,
          reviewCount: input.aggregateRating.reviewCount,
        }
      : undefined,
  };
}

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
  aggregateRating?: { ratingValue: number; reviewCount: number };
}) {
  return {
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
    aggregateRating: input.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: input.aggregateRating.ratingValue,
          reviewCount: input.aggregateRating.reviewCount,
        }
      : undefined,
  };
}
