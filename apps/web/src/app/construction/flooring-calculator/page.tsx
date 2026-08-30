import { ConstructionSeo } from '@/components/construction/construction-seo';
import { FlooringCalculatorClient } from '@/components/construction/flooring-calculator/flooring-calculator-client';
import { FLOORING_CALC_FAQS } from '@/components/construction/flooring-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('flooring-calculator', { searchParams: params });
}

export default async function FlooringCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Flooring calculator', path: '/construction/flooring-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Flooring Calculator',
          description:
            'Estimate flooring purchase area and cost by type — multi-room, wastage and rates. No product endorsements. Indicative only.',
          path: '/construction/flooring-calculator',
        }}
        faqs={FLOORING_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <FlooringCalculatorClient />
    </>
  );
}
