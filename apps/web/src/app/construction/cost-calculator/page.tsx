import { redirect } from 'next/navigation';
import { constructionCostCalculatorHref, parsePlannerHandoffQuery } from '@varnarc/validation';
import { buildConstructionPageMetadata } from '@/lib/construction/seo';
import {
  ConstructionCostCalculatorScreen,
  flattenCostCalculatorParams,
} from './cost-calculator-screen';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('cost-calculator', { searchParams: params });
}

export default async function ConstructionCostCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const flat = flattenCostCalculatorParams(params);
  const hasShareBlob = Boolean(flat.s);
  if (!hasShareBlob && (flat.builtUpArea || flat.area || flat.areaSqft || flat.budgetInr)) {
    redirect(constructionCostCalculatorHref(parsePlannerHandoffQuery(flat)));
  }
  return <ConstructionCostCalculatorScreen flat={flat} />;
}
