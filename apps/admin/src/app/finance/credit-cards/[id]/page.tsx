import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCreditCardEditForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type CardDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  annualFee?: number | string | null;
  affiliateUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  bankId?: string;
  bank?: { id: string; name: string } | null;
};

type BankRow = { id: string; name: string };

export default async function FinanceCreditCardEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cardResult, banksResult] = await Promise.all([
    apiServerFetch<CardDetail>(`/finance/credit-cards/${id}`),
    apiServerFetch<BankRow[]>('/finance/admin/banks?limit=100'),
  ]);
  const card = cardResult.data;
  const banks = Array.isArray(banksResult.data) ? banksResult.data : [];

  return (
    <div>
      <PageHeader
        title="Edit credit card"
        description={card?.name ?? 'Credit card product'}
        actions={
          <Link
            href="/finance/credit-cards"
            className="text-sm text-[var(--varnarc-brand)] hover:underline"
          >
            ← Back to credit cards
          </Link>
        }
      />

      {cardResult.error || !card ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load credit card</CardTitle>
            <CardDescription>{cardResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <Badge>{card.status}</Badge>
            <FinancePublishButton entity="credit-cards" id={card.id} status={card.status} />
          </div>
          {banks.length ? (
            <FinanceCreditCardEditForm
              id={card.id}
              banks={banks}
              initial={{
                bankId: card.bankId ?? card.bank?.id ?? banks[0]?.id ?? '',
                name: card.name,
                slug: card.slug,
                annualFee: card.annualFee,
                affiliateUrl: card.affiliateUrl,
                seoTitle: card.seoTitle,
                seoDescription: card.seoDescription,
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
