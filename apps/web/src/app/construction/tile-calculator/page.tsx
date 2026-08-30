import { ConstructionSeo } from '@/components/construction/construction-seo';
import { TileCalculatorClient } from '@/components/construction/tile-calculator/tile-calculator-client';
import { TILE_CALC_FAQS } from '@/components/construction/tile-calculator/content';
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
  return buildConstructionPageMetadata('tile-calculator', { searchParams: params });
}

export default async function TileCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('tile-calculator', flat);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Tile calculator', path: '/construction/tile-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Tile Calculator',
          description:
            'Calculate floor and wall tiles with optional grout, wastage, boxes, cost, visual grid and reverse coverage. Indicative only.',
          path: '/construction/tile-calculator',
        }}
        faqs={TILE_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <TileCalculatorClient initialShareInputs={shareInputs} />
    </>
  );
}
