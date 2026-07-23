import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AutomobileFaqForm } from '@/components/automobile-forms';
import { apiServerFetch } from '@/lib/api';

type FaqRow = {
  id: string;
  question: string;
  answer: string;
};

export default async function AutomobileFaqsAdminPage() {
  const result = await apiServerFetch<FaqRow[]>('/automobile/admin/faqs');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Automobile FAQs"
        description="Manage frequently asked questions for the public automobile section."
        actions={<Badge>{rows.length} entries</Badge>}
      />

      <AutomobileFaqForm />

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
