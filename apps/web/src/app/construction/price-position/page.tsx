import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PricePositionClient } from '@/components/construction/price-position/price-position-client';
import { PRICE_POSITION_FAQS } from '@/components/construction/price-position/content';
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
  return buildConstructionPageMetadata('price-position', { searchParams: params });
}

export default async function PricePositionPage({ searchParams }: Props) {
  const params = await searchParams;
  const initial = {
    material: firstParam(params.material),
    location: firstParam(params.location) ?? firstParam(params.city),
    quantity: firstParam(params.quantity) ?? firstParam(params.qty),
    unit: firstParam(params.unit),
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Price position', path: '/construction/price-position' },
        ])}
        webApplication={{
          name: 'Varnarc Material Price Position',
          description:
            'See where a material’s current observed price sits vs recent history — range, percentile and trend. No buy advice or future price predictions.',
          path: '/construction/price-position',
        }}
        faqs={PRICE_POSITION_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <PricePositionClient initialParams={initial} />
    </>
  );
}
