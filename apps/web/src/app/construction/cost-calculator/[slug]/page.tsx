import { parseConstructionCostCalculatorSlug } from '@varnarc/validation';
import { buildConstructionPageMetadata } from '@/lib/construction/seo';
import {
  ConstructionCostCalculatorScreen,
  flattenCostCalculatorParams,
} from '../cost-calculator-screen';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = flattenCostCalculatorParams(await searchParams);
  const fromSlug = parseConstructionCostCalculatorSlug(slug);
  return buildConstructionPageMetadata('cost-calculator', {
    searchParams: { ...query, ...fromSlug },
  });
}

export default async function ConstructionCostCalculatorSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = flattenCostCalculatorParams(await searchParams);
  const fromSlug = parseConstructionCostCalculatorSlug(slug);
  return <ConstructionCostCalculatorScreen flat={{ ...query, ...fromSlug }} />;
}
