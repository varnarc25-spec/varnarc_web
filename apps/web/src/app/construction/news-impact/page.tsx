import { ConstructionSeo } from '@/components/construction/construction-seo';
import { NewsImpactClient } from '@/components/construction/news-impact/news-impact-client';
import { NEWS_IMPACT_FAQS } from '@/components/construction/news-impact/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

export async function generateMetadata() {
  return buildConstructionPageMetadata('news-impact');
}

export default function NewsImpactPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'News impact', path: '/construction/news-impact' },
        ])}
        webApplication={{
          name: 'Varnarc Construction News Impact',
          description:
            'Separate reported construction news, scenario price assumptions, and arithmetic project impact. No guaranteed price moves.',
          path: '/construction/news-impact',
        }}
        faqs={NEWS_IMPACT_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <NewsImpactClient />
    </>
  );
}
