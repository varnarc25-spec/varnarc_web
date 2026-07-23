import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceBankEditForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type BankDetail = {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  description?: string | null;
  status: string;
};

export default async function FinanceBankEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<BankDetail>(`/finance/banks/${id}`);
  const bank = result.data;

  return (
    <div>
      <PageHeader
        title="Edit bank"
        description={bank?.name ?? 'Bank details'}
        actions={
          <Link href="/finance/banks" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to banks
          </Link>
        }
      />

      {result.error || !bank ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load bank</CardTitle>
            <CardDescription>{result.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Badge className="mb-4">{bank.status}</Badge>
          <FinanceBankEditForm
            id={bank.id}
            initial={{
              name: bank.name,
              slug: bank.slug,
              website: bank.website,
              description: bank.description,
            }}
          />
        </>
      )}
    </div>
  );
}
