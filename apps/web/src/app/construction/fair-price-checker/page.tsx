import { ConstructionSeo } from '@/components/construction/construction-seo';
import { FairPriceCheckerClient } from '@/components/construction/fair-price-checker/fair-price-checker-client';
import { FAIR_PRICE_FAQS } from '@/components/construction/fair-price-checker/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('fair-price-checker', { searchParams: params });
}

export default async function FairPriceCheckerPage({ searchParams }: Props) {
  const params = await searchParams;
  const initial = {
    material: firstParam(params.material),
    location: firstParam(params.location) ?? firstParam(params.city),
    unit: firstParam(params.unit),
    price: firstParam(params.price) ?? firstParam(params.quotedPrice),
    quantity: firstParam(params.quantity) ?? firstParam(params.qty),
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Fair Price Checker', path: '/construction/fair-price-checker' },
        ])}
        webApplication={{
          name: 'Varnarc Fair Price Checker',
          description:
            'Compare a construction material quote with Varnarc’s recent observed range. Never labels quotes as unfair or fraudulent.',
          path: '/construction/fair-price-checker',
        }}
        faqs={FAIR_PRICE_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <FairPriceCheckerClient initialParams={initial} />
    </>
  );
}
