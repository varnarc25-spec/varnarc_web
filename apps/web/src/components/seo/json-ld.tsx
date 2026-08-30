type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  itemListJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  productJsonLd,
  reviewJsonLd,
  softwareApplicationJsonLd,
  webApplicationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from '@/lib/seo-json-ld';
