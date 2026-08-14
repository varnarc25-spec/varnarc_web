import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceFaqForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category?: string | { name?: string | null; slug?: string | null } | null;
  entityType?: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

export default async function FinanceFaqsAdminPage() {
  const [faqResult, categoriesResult] = await Promise.all([
    apiServerFetch<FaqRow[]>('/finance/admin/faqs?limit=100'),
    apiServerFetch<CategoryRow[]>('/finance/categories'),
  ]);
  const rows = Array.isArray(faqResult.data) ? faqResult.data : [];
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];

  return (
    <div>
      <PageHeader
        title="Finance FAQs"
        description="Manage frequently asked questions for the public finance section."
        actions={<Badge>{rows.length} entries</Badge>}
      />

      <FinanceFaqForm categories={categories} />

      {faqResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load FAQs</CardTitle>
            <CardDescription>{faqResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const categoryLabel =
              typeof row.category === 'string'
                ? row.category
                : row.category?.name || row.category?.slug || row.entityType || null;
            return (
              <div
                key={row.id}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                {categoryLabel ? (
                  <div className="text-xs font-medium uppercase text-[var(--varnarc-subtle)]">
                    {categoryLabel}
                  </div>
                ) : null}
                <div className="font-medium">{row.question}</div>
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{row.answer}</p>
              </div>
            );
          })}
          {!rows.length ? (
            <p className="py-8 text-center text-[var(--varnarc-subtle)]">No FAQs yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
