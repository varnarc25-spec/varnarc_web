import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { BoqGeneratorClient } from '@/components/construction/boq-generator/boq-generator-client';
import { BOQ_GEN_FAQS } from '@/components/construction/boq-generator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('boq-generator', { searchParams: params });
}

export default async function BoqGeneratorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'BOQ Generator', path: '/construction/boq-generator' },
        ])}
        webApplication={{
          name: 'Varnarc BOQ Generator',
          description:
            'Indicative planning bill of quantities with editable items, generation from project assumptions, contingency and optional tax. Not a professional tender BOQ.',
          path: '/construction/boq-generator',
        }}
        faqs={BOQ_GEN_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <Suspense
        fallback={
          <div className="site-container py-10 text-sm text-slate-500">Loading BOQ generator…</div>
        }
      >
        <BoqGeneratorClient />
      </Suspense>
    </>
  );
}
