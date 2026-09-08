import { ConstructionSeo } from '@/components/construction/construction-seo';
import { MaterialQuantityCalculatorClient } from '@/components/construction/material-quantity-calculator/material-quantity-calculator-client';
import { MATERIAL_QTY_FAQS } from '@/components/construction/material-quantity-calculator/content';
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
  return buildConstructionPageMetadata('material-calculator', { searchParams: params });
}

export default async function MaterialCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const initial: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    initial[key] = firstParam(value);
  }

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Material quantity calculator', path: '/construction/material-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Material Quantity Calculator',
          description:
            'Estimate indicative cement, steel, sand, aggregate, bricks, tiles, paint, electrical and plumbing quantities from built-up area and quality.',
          path: '/construction/material-calculator',
        }}
        faqs={MATERIAL_QTY_FAQS.map((f) => ({ question: f.question, answer: f.answer }))}
      />
      <MaterialQuantityCalculatorClient initialParams={initial} />
    </>
  );
}
