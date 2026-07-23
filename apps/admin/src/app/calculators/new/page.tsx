import Link from 'next/link';
import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CalculatorEditor } from '@/components/calculator-editor';

type Category = { id: string; name: string; slug: string };

export default async function NewCalculatorPage() {
  const cats = await apiServerFetch<Category[]>('/calculators/categories');
  const categories = Array.isArray(cats.data) ? cats.data : [];

  return (
    <div>
      <PageHeader
        title="New calculator"
        description="Define fields, formula outputs, and SEO metadata."
        actions={
          <Link href="/calculators" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back
          </Link>
        }
      />
      <CalculatorEditor categories={categories} />
    </div>
  );
}
