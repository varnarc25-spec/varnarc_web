import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceInsuranceEditForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type InsuranceDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  providerName: string;
  premium?: number | string | null;
  affiliateUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export default async function FinanceInsuranceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<InsuranceDetail>(`/finance/insurance/${id}`);
  const insurance = result.data;

  return (
    <div>
      <PageHeader
        title="Edit insurance product"
        description={insurance?.name ?? 'Insurance product'}
        actions={
          <Link
            href="/finance/insurance"
            className="text-sm text-[var(--varnarc-brand)] hover:underline"
          >
            ← Back to insurance
          </Link>
        }
      />

      {result.error || !insurance ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load insurance product</CardTitle>
            <CardDescription>{result.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <Badge>{insurance.status}</Badge>
            <FinancePublishButton entity="insurance" id={insurance.id} status={insurance.status} />
          </div>
          <FinanceInsuranceEditForm
            id={insurance.id}
            initial={{
              providerName: insurance.providerName,
              name: insurance.name,
              slug: insurance.slug,
              premium: insurance.premium,
              affiliateUrl: insurance.affiliateUrl,
              seoTitle: insurance.seoTitle,
              seoDescription: insurance.seoDescription,
            }}
          />
        </>
      )}
    </div>
  );
}
