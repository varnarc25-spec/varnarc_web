import { ConstructionSeo } from '@/components/construction/construction-seo';
import { BrickCalculatorClient } from '@/components/construction/brick-calculator/brick-calculator-client';
import { BRICK_CALC_FAQS } from '@/components/construction/brick-calculator/content';
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
  return buildConstructionPageMetadata('brick-calculator', { searchParams: params });
}

export default async function BrickCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('brick-calculator', flat);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Brick calculator', path: '/construction/brick-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Brick Calculator',
          description:
            'Calculate bricks for masonry walls with openings, wastage, mortar estimate and reverse mode. Indicative only.',
          path: '/construction/brick-calculator',
        }}
        faqs={BRICK_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <BrickCalculatorClient initialShareInputs={shareInputs} />
    </>
  );
}
