import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceGlossaryForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type GlossaryRow = {
  id: string;
  term: string;
  definition: string;
  slug?: string | null;
};

export default async function FinanceGlossaryAdminPage() {
  const result = await apiServerFetch<GlossaryRow[]>('/finance/admin/glossary?limit=200');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Finance glossary"
        description="Terms and definitions for the public finance glossary."
        actions={<Badge>{rows.length} terms</Badge>}
      />

      <FinanceGlossaryForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load glossary</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Definition</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.term}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">{row.definition}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No glossary terms yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
