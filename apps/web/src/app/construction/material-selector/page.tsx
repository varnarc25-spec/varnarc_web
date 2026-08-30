import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { MaterialSelectorClient } from '@/components/construction/material-selector/material-selector-client';
import { MATERIAL_SELECTOR_FAQS } from '@/components/construction/material-selector/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('material-selector', { searchParams: params });
}

export default async function MaterialSelectorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Material selector', path: '/construction/material-selector' },
        ])}
        webApplication={{
          name: 'Varnarc Material Selector',
          description:
            'Educational material category guidance by construction task. Not professional engineering approval or brand recommendations.',
          path: '/construction/material-selector',
        }}
        faqs={MATERIAL_SELECTOR_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <Suspense
        fallback={
          <div className="site-container py-10 text-sm text-slate-500">
            Loading material selector…
          </div>
        }
      >
        <MaterialSelectorClient />
      </Suspense>
    </>
  );
}
