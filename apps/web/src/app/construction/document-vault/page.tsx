import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { DocumentVaultClient } from '@/components/construction/document-vault/document-vault-client';
import { DOCUMENT_VAULT_FAQS } from '@/components/construction/document-vault/content';
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
        webApplication={{
          name: 'Varnarc Construction Project Document Vault',
          description:
            'Private project documents with secure authorization, file validation and authenticated view/download. Not exposed via public URLs.',
          path: '/construction/document-vault',
        }}
        faqs={DOCUMENT_VAULT_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
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
