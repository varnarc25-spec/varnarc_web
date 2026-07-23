import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCsvToolbar, FinanceListSearch } from '@/components/finance-admin-toolbar';
import { FinanceCreditCardForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type CardRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  annualFee?: number | string | null;
  bank?: { name: string } | null;
};

type BankRow = { id: string; name: string };

export default async function FinanceCreditCardsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const [cardsResult, banksResult] = await Promise.all([
    apiServerFetch<CardRow[]>(`/finance/admin/credit-cards?${qs.toString()}`),
    apiServerFetch<BankRow[]>('/finance/admin/banks?limit=100'),
  ]);
  const rows = Array.isArray(cardsResult.data) ? cardsResult.data : [];
  const banks = Array.isArray(banksResult.data) ? banksResult.data : [];

  return (
    <div>
      <PageHeader
        title="Credit cards"
        description="Manage credit card products."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <FinanceListSearch defaultValue={params.search} />
      <FinanceCsvToolbar entity="credit-cards" />

      {banks.length ? <FinanceCreditCardForm banks={banks} /> : (
        <Card className="mb-6">
          <CardHeader>
            <CardDescription>Create at least one bank before adding credit cards.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {cardsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load credit cards</CardTitle>
            <CardDescription>{cardsResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Bank</th>
                <th className="px-4 py-3 font-medium">Annual fee</th>
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
                  <td className="px-4 py-3">{row.annualFee != null ? row.annualFee : '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <FinancePublishButton entity="credit-cards" id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No credit cards yet.
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
