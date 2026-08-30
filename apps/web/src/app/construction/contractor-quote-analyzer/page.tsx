import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ContractorQuoteAnalyzerClient } from '@/components/construction/contractor-quote-analyzer/contractor-quote-analyzer-client';
import { QUOTE_ANALYZER_FAQS } from '@/components/construction/contractor-quote-analyzer/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('contractor-quote-analyzer', {
    searchParams: params,
  });
}

export default async function ContractorQuoteAnalyzerPage({ searchParams }: Props) {
  const params = await searchParams;
  const projectId = firstParam(params.projectId);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          {
            name: 'Contractor Quote Analyzer',
            path: '/construction/contractor-quote-analyzer',
          },
        ])}
        webApplication={{
          name: 'Varnarc Contractor Quote Analyzer',
          description:
            'Compare up to 3 contractor quotes by category. Manual or CSV entry. Flags missing items explicitly. Never labels contractors good or bad.',
          path: '/construction/contractor-quote-analyzer',
        }}
        faqs={QUOTE_ANALYZER_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ContractorQuoteAnalyzerClient initialProjectId={projectId} />
    </>
  );
}
