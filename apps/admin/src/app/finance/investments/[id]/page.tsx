import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceInvestmentEditForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type InvestmentDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  providerName: string;
  expectedReturn?: number | string | null;
  riskLevel?: string | null;
  affiliateUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export default async function FinanceInvestmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<InvestmentDetail>(`/finance/investments/${id}`);
  const investment = result.data;

  return (
    <div>
      <PageHeader
        title="Edit investment product"
        description={investment?.name ?? 'Investment product'}
        actions={
          <Link
            href="/finance/investments"
            className="text-sm text-[var(--varnarc-brand)] hover:underline"
          >
            ← Back to investments
          </Link>
        }
      />

      {result.error || !investment ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load investment product</CardTitle>
            <CardDescription>{result.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <Badge>{investment.status}</Badge>
            <FinancePublishButton
              entity="investments"
              id={investment.id}
              status={investment.status}
            />
          </div>
          <FinanceInvestmentEditForm
            id={investment.id}
            initial={{
              providerName: investment.providerName,
              name: investment.name,
              slug: investment.slug,
              expectedReturn: investment.expectedReturn,
              riskLevel: investment.riskLevel,
              affiliateUrl: investment.affiliateUrl,
              seoTitle: investment.seoTitle,
              seoDescription: investment.seoDescription,
            }}
          />
        </>
      )}
    </div>
  );
}
