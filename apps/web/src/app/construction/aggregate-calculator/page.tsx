import { ConstructionSeo } from '@/components/construction/construction-seo';
import { AggregateCalculatorClient } from '@/components/construction/aggregate-calculator/aggregate-calculator-client';
import { AGGREGATE_CALC_FAQS } from '@/components/construction/aggregate-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('aggregate-calculator', { searchParams: params });
}

export default async function AggregateCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Aggregate calculator', path: '/construction/aggregate-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Aggregate Calculator',
          description:
            'Calculate aggregate for concrete, fill and area × depth with editable density, wastage and cost. Indicative only.',
          path: '/construction/aggregate-calculator',
        }}
        faqs={AGGREGATE_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <AggregateCalculatorClient />
    </>
  );
}
