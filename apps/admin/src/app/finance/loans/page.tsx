import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCsvToolbar, FinanceListSearch } from '@/components/finance-admin-toolbar';
import { FinanceLoanForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type LoanRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  loanType: string;
  interestRate?: number | string | null;
  bank?: { name: string } | null;
};

type BankRow = { id: string; name: string };

export default async function FinanceLoansAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const [loansResult, banksResult] = await Promise.all([
    apiServerFetch<LoanRow[]>(`/finance/admin/loans?${qs.toString()}`),
    apiServerFetch<BankRow[]>('/finance/admin/banks?limit=100'),
  ]);
  const rows = Array.isArray(loansResult.data) ? loansResult.data : [];
  const banks = Array.isArray(banksResult.data) ? banksResult.data : [];

  return (
    <div>
      <PageHeader
        title="Loans"
        description="Manage loan products by bank and type."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <FinanceListSearch defaultValue={params.search} />
      <FinanceCsvToolbar entity="loans" />

      {banks.length ? <FinanceLoanForm banks={banks} /> : (
        <Card className="mb-6">
          <CardHeader>
            <CardDescription>Create at least one bank before adding loans.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {loansResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load loans</CardTitle>
            <CardDescription>{loansResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Bank</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">{row.bank?.name || '—'}</td>
                  <td className="px-4 py-3">{row.loanType}</td>
                  <td className="px-4 py-3">{row.interestRate != null ? `${row.interestRate}%` : '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/finance/loans/${row.id}`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <FinancePublishButton entity="loans" id={row.id} status={row.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No loans yet.
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
