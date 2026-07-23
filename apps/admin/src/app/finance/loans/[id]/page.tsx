import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceLoanEditForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type LoanDetail = {
  id: string;
  name: string;
  slug: string;
  loanType: string;
  interestRate?: number | string | null;
  affiliateUrl?: string | null;
  status: string;
  bank?: { id: string; name: string } | null;
  bankId?: string;
};

type BankRow = { id: string; name: string };

export default async function FinanceLoanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [loanResult, banksResult] = await Promise.all([
    apiServerFetch<LoanDetail>(`/finance/loans/${id}`),
    apiServerFetch<BankRow[]>('/finance/admin/banks?limit=100'),
  ]);
  const loan = loanResult.data;
  const banks = Array.isArray(banksResult.data) ? banksResult.data : [];

  return (
    <div>
      <PageHeader
        title="Edit loan"
        description={loan?.name ?? 'Loan product'}
        actions={
          <Link href="/finance/loans" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to loans
          </Link>
        }
      />

      {loanResult.error || !loan ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load loan</CardTitle>
            <CardDescription>{loanResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Badge className="mb-4">{loan.status}</Badge>
          {banks.length ? (
            <FinanceLoanEditForm
              id={loan.id}
              banks={banks}
              initial={{
                bankId: loan.bankId ?? loan.bank?.id ?? banks[0]?.id ?? '',
                name: loan.name,
                slug: loan.slug,
                loanType: loan.loanType,
                interestRate: loan.interestRate,
                affiliateUrl: loan.affiliateUrl,
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardDescription>Create at least one bank before editing loans.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
