import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConcreteCalculatorClient } from '@/components/construction/concrete-calculator/concrete-calculator-client';
import { CONCRETE_CALC_FAQS } from '@/components/construction/concrete-calculator/content';
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
  return buildConstructionPageMetadata('concrete-calculator', { searchParams: params });
}

export default async function ConcreteCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('concrete-calculator', flat);
  const initial = {
    shape: flat.shape,
    length: flat.length,
    width: flat.width,
    height: flat.height,
    wastage: flat.wastage ?? flat.wastagePercent,
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Concrete calculator', path: '/construction/concrete-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Concrete Calculator',
          description:
            'Calculate wet and order concrete volume for slabs, footings, columns and walls with optional mix materials and cost. Indicative only.',
          path: '/construction/concrete-calculator',
        }}
        faqs={CONCRETE_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ConcreteCalculatorClient initialParams={initial} initialShareInputs={shareInputs} />
    </>
  );
}
