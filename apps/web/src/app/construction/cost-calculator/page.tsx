import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionCostCalculatorClient } from '@/components/construction/cost-calculator/cost-calculator-client';
import { COST_CALC_FAQS } from '@/components/construction/cost-calculator/content';
import { apiServerFetch } from '@/lib/api';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { resolveConstructionShareFromSearchParams } from '@varnarc/validation';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

function flattenParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = pick(v);
  }
  return out;
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('cost-calculator', { searchParams: params });
}

export default async function ConstructionCostCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenParams(params);
  const shareInputs = resolveConstructionShareFromSearchParams('cost-calculator', flat);
  const authProbe = await apiServerFetch<unknown>('/auth/me');
  const isAuthenticated = authProbe.status !== 401 && !authProbe.error;

  const initialParams: Record<string, string | undefined> = {
    location: flat.location ?? flat.region,
    region: flat.region,
    builtUpArea: flat.builtUpArea ?? flat.areaSqft ?? flat.area,
    areaSqft: flat.areaSqft,
    area: flat.area,
    areaUnit: flat.areaUnit,
    floors: flat.floors,
    quality: flat.quality,
    propertyType: flat.propertyType,
    contingencyPercent: flat.contingencyPercent ?? flat.contingency,
    contingency: flat.contingency,
    customRate: flat.customRate,
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost calculator', path: '/construction/cost-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Construction Cost Calculator',
          description:
            'Estimate house construction cost by location, area, floors and quality with transparent methodology. Indicative only — not a quote.',
          path: '/construction/cost-calculator',
        }}
        faqs={COST_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ConstructionCostCalculatorClient
        initialParams={initialParams}
        initialShareInputs={shareInputs}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
