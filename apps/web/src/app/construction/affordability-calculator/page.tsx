import { ConstructionSeo } from '@/components/construction/construction-seo';
import { AffordabilityCalculatorClient } from '@/components/construction/affordability-calculator/affordability-calculator-client';
import { AFFORD_CALC_FAQS } from '@/components/construction/affordability-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('affordability-calculator', { searchParams: params });
}

export default async function AffordabilityCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialParams: Record<string, string | undefined> = {
    projectCost:
      pick(params.projectCost) ??
      pick(params.estimatedCost) ??
      pick(params.cost) ??
      pick(params.amount),
    estimatedCost: pick(params.estimatedCost),
    cost: pick(params.cost),
    amount: pick(params.amount),
    savings: pick(params.savings),
    loan: pick(params.loan),
    income: pick(params.income),
    emi: pick(params.emi),
    duration: pick(params.duration) ?? pick(params.months),
    months: pick(params.months),
    contingency: pick(params.contingency) ?? pick(params.contingencyReservePercent),
    contingencyReservePercent: pick(params.contingencyReservePercent),
    source: pick(params.source),
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          {
            name: 'Affordability calculator',
            path: '/construction/affordability-calculator',
          },
        ])}
        webApplication={{
          name: 'Varnarc Construction Affordability Calculator',
          description:
            'Check whether your construction budget fits savings and expected loan, with contingency and cash-flow hints. Educational only — not financial advice.',
          path: '/construction/affordability-calculator',
        }}
        faqs={AFFORD_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <AffordabilityCalculatorClient initialParams={initialParams} />
    </>
  );
}
