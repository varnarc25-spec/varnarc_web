import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { DocumentVaultClient } from '@/components/construction/document-vault/document-vault-client';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('document-vault', { searchParams: params });
}

export default async function DocumentVaultPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Document vault', path: '/construction/document-vault' },
        ])}
      />
      <Suspense
        fallback={
          <div className="site-container py-10 text-sm text-slate-500">Loading document vault…</div>
        }
      >
        <DocumentVaultClient />
      </Suspense>
    </>
  );
}
