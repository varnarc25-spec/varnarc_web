import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CalculatorEditor } from '@/components/calculator-editor';

type Category = { id: string; name: string; slug: string };

type CalculatorDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId?: string | null;
  formula?: string | null;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  resultTemplate?: unknown;
  settings?: unknown;
  fields?: Array<{
    key: string;
    label: string;
    fieldType: string;
    defaultValue?: string | null;
    sortOrder: number;
    required: boolean;
  }>;
};

export default async function EditCalculatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [calc, cats, versions] = await Promise.all([
    apiServerFetch<CalculatorDetail>(`/calculators/${id}`),
    apiServerFetch<Category[]>('/calculators/categories'),
    apiServerFetch<Array<{ id: string; version: number; createdAt: string; formula?: string | null }>>(
      `/calculators/${id}/versions`,
    ),
  ]);

  if (calc.error || !calc.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calculator not found</CardTitle>
          <CardDescription>{calc.error || 'Unable to load.'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title={calc.data.name}
        description={`Status: ${calc.data.status || 'DRAFT'}`}
        actions={
          <Link href="/calculators" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back
          </Link>
        }
      />
      <CalculatorEditor
        initial={calc.data}
        categories={Array.isArray(cats.data) ? cats.data : []}
        versions={Array.isArray(versions.data) ? versions.data : []}
      />
    </div>
  );
}
