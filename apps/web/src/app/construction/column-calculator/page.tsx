import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ColumnCalculatorClient } from '@/components/construction/column-calculator/column-calculator-client';
import { COLUMN_CALC_FAQS } from '@/components/construction/column-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('column-calculator', { searchParams: params });
}

export default async function ColumnCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Column calculator', path: '/construction/column-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Column Concrete Calculator',
          description:
            'Calculate RCC column concrete volume for rectangular and circular columns. Optional mix materials and cost. Does not provide structural design or load-capacity calculations.',
          path: '/construction/column-calculator',
        }}
        faqs={COLUMN_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ColumnCalculatorClient />
    </>
  );
}
