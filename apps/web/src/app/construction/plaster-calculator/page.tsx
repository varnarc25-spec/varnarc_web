import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PlasterCalculatorClient } from '@/components/construction/plaster-calculator/plaster-calculator-client';
import { PLASTER_CALC_FAQS } from '@/components/construction/plaster-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('plaster-calculator', { searchParams: params });
}

export default async function PlasterCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Plaster calculator', path: '/construction/plaster-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Plaster Calculator',
          description:
            'Calculate plaster mortar for walls and ceilings: wet/dry volume, cement bags, sand and cost. Editable thickness and mix. Indicative only.',
          path: '/construction/plaster-calculator',
        }}
        faqs={PLASTER_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <PlasterCalculatorClient />
    </>
  );
}
