import { PageHeader } from '@varnarc/ui';
import { FinancePageSeoEditor } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type FinancePageRow = {
  pageKey: string;
  entityId: string;
  path: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  heroImageUrl?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  educationModules?: Record<
    string,
    { title?: string; summary?: string; guideHref?: string | null }
  > | null;
};

export default async function FinanceSeoAdminPage() {
  const hub = await apiServerFetch<FinancePageRow>('/finance/admin/pages/hub');
  const pages =
    await apiServerFetch<Array<{ pageKey: string; label: string; path: string }>>(
      '/finance/admin/pages',
    );
  const pageList = Array.isArray(pages.data) ? pages.data : [];

  const pageDetails = await Promise.all(
    pageList.map(async (row) => {
      const result = await apiServerFetch<FinancePageRow>(`/finance/admin/pages/${row.pageKey}`);
      return result.data;
    }),
  );

  const rows = pageDetails.filter((row): row is FinancePageRow => row != null);

  return (
    <div>
      <PageHeader
        title="Finance page SEO"
        description="Edit meta titles, descriptions, H1 headings, intro text, and hero images for finance hub and listing pages."
      />

      {hub.error ? <p className="text-sm text-red-600">{hub.error}</p> : null}

      {rows.map((row) => (
        <FinancePageSeoEditor key={row.pageKey} pageKey={row.pageKey} initial={row} />
      ))}
    </div>
  );
}
