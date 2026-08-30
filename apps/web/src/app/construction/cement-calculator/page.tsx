import { ConstructionSeo } from '@/components/construction/construction-seo';
import { CementCalculatorClient } from '@/components/construction/cement-calculator/cement-calculator-client';
import { CEMENT_CALC_FAQS } from '@/components/construction/cement-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { resolveConstructionShareFromSearchParams } from '@varnarc/validation';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function flattenParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = firstParam(v);
  }
  return out;
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('cement-calculator', { searchParams: params });
}

export default async function CementCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('cement-calculator', flat);
  const initial = {
    area: flat.area,
    volume: flat.volume,
    useCase: flat.useCase ?? flat.mix,
    wastage: flat.wastage ?? flat.wastagePercent,
    areaUnit: flat.areaUnit ?? flat.unit,
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cement calculator', path: '/construction/cement-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Cement Calculator',
          description:
            'Calculate cement for concrete, masonry, plaster and screed with bags, wastage and optional cost. Indicative only.',
          path: '/construction/cement-calculator',
        }}
        faqs={CEMENT_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <CementCalculatorClient initialParams={initial} initialShareInputs={shareInputs} />
    </>
  );
}
