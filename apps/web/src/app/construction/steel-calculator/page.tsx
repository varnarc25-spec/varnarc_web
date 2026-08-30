import { ConstructionSeo } from '@/components/construction/construction-seo';
import { SteelCalculatorClient } from '@/components/construction/steel-calculator/steel-calculator-client';
import { STEEL_CALC_FAQS } from '@/components/construction/steel-calculator/content';
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
  return buildConstructionPageMetadata('steel-calculator', { searchParams: params });
}

export default async function SteelCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('steel-calculator', flat);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Steel calculator', path: '/construction/steel-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Steel Weight Calculator',
          description:
            'Calculate TMT rebar weight with w = d²/162 for multiple diameters. kg, tonnes and optional cost. Indicative only.',
          path: '/construction/steel-calculator',
        }}
        faqs={STEEL_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <SteelCalculatorClient initialShareInputs={shareInputs} />
    </>
  );
}
