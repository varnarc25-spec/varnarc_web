import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceFaqForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
};

export default async function FinanceFaqsAdminPage() {
  const result = await apiServerFetch<FaqRow[]>('/finance/admin/faqs?limit=100');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Finance FAQs"
        description="Manage frequently asked questions for the public finance section."
        actions={<Badge>{rows.length} entries</Badge>}
      />

      <FinanceFaqForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load FAQs</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              {row.category ? (
                <div className="text-xs font-medium uppercase text-[var(--varnarc-subtle)]">{row.category}</div>
              ) : null}
              <div className="font-medium">{row.question}</div>
              <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{row.answer}</p>
            </div>
          ))}
          {!rows.length ? (
            <p className="py-8 text-center text-[var(--varnarc-subtle)]">No FAQs yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
