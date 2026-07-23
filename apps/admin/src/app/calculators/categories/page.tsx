import Link from 'next/link';
import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CalculatorCategoryForm } from '@/components/calculator-category-form';

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { calculators: number };
};

export default async function CalculatorCategoriesPage() {
  const result = await apiServerFetch<Category[]>('/calculators/categories');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Calculator categories"
        description="Finance, construction, automobile, and general groups."
        actions={
          <Link href="/calculators" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back
          </Link>
        }
      />
      <CalculatorCategoryForm />
      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Calculators</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                <td className="px-4 py-3">{row._count?.calculators ?? 0}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No categories yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
