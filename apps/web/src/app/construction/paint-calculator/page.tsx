import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PaintCalculatorClient } from '@/components/construction/paint-calculator/paint-calculator-client';
import { PAINT_CALC_FAQS } from '@/components/construction/paint-calculator/content';
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
  return buildConstructionPageMetadata('paint-calculator', { searchParams: params });
}

export default async function PaintCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('paint-calculator', flat);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Paint calculator', path: '/construction/paint-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Paint Calculator',
          description:
            'Calculate paint litres for rooms or whole house with doors, windows, coats, overridable coverage, primer, putty and tin sizes. Reverse mode for area from litres. Indicative only.',
          path: '/construction/paint-calculator',
        }}
        faqs={PAINT_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <PaintCalculatorClient initialShareInputs={shareInputs} />
    </>
  );
}
