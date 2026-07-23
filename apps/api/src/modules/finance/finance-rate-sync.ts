import type { FinanceRateFeed, PrismaClient } from '@varnarc/database';

export type RemoteRateRow = {
  productType?: string;
  rate: number;
  bankSlug?: string;
  loanSlug?: string;
  effectiveFrom?: string;
  minTenure?: number;
  maxTenure?: number;
};

export function parseRemoteRates(body: unknown): RemoteRateRow[] {
  const rows = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { rates?: unknown }).rates)
      ? (body as { rates: unknown[] }).rates
      : [];

  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => ({
      productType: typeof row.productType === 'string' ? row.productType : undefined,
      rate: Number(row.rate),
      bankSlug: typeof row.bankSlug === 'string' ? row.bankSlug : undefined,
      loanSlug: typeof row.loanSlug === 'string' ? row.loanSlug : undefined,
      effectiveFrom: typeof row.effectiveFrom === 'string' ? row.effectiveFrom : undefined,
      minTenure: row.minTenure != null ? Number(row.minTenure) : undefined,
      maxTenure: row.maxTenure != null ? Number(row.maxTenure) : undefined,
    }))
    .filter((row) => Number.isFinite(row.rate) && row.rate > 0);
}

export async function fetchRemoteRates(feed: FinanceRateFeed): Promise<RemoteRateRow[]> {
  if (!feed.endpointUrl) return [];

  const config = (feed.config ?? {}) as Record<string, unknown>;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (typeof config.apiKey === 'string' && config.apiKey.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }

  const res = await fetch(feed.endpointUrl, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Feed HTTP ${res.status}`);
  }

  const body = (await res.json()) as unknown;
  const rows = parseRemoteRates(body);
  if (!rows.length) {
    throw new Error('Feed returned no valid rate rows');
  }
  return rows;
}

export async function ingestRemoteRate(
  db: PrismaClient,
  feed: FinanceRateFeed,
  row: RemoteRateRow,
  actorId: string,
) {
  let bankId: string | null = null;
  let loanId: string | null = null;

  if (row.bankSlug) {
    const bank = await db.bank.findFirst({
      where: { slug: row.bankSlug, deletedAt: null },
      select: { id: true },
    });
    bankId = bank?.id ?? null;
  }

  if (row.loanSlug && bankId) {
    const loan = await db.loan.findFirst({
      where: { bankId, slug: row.loanSlug, deletedAt: null },
      select: { id: true },
    });
    loanId = loan?.id ?? null;
  }

  const productType = row.productType || feed.productType || feed.provider;
  const effectiveFrom = row.effectiveFrom ? new Date(row.effectiveFrom) : new Date();

  await db.interestRate.updateMany({
    where: {
      deletedAt: null,
      effectiveTo: null,
      productType,
      ...(bankId ? { bankId } : {}),
      ...(loanId ? { loanId } : {}),
    },
    data: { effectiveTo: effectiveFrom },
  });

  await db.interestRate.create({
    data: {
      productType,
      rate: row.rate,
      bankId,
      loanId,
      minTenure: row.minTenure ?? null,
      maxTenure: row.maxTenure ?? null,
      source: `feed:${feed.provider}`,
      effectiveFrom,
      createdBy: actorId,
      updatedBy: actorId,
    },
  });

  if (loanId) {
    await db.loan.update({
      where: { id: loanId },
      data: { interestRate: row.rate, updatedBy: actorId },
    });
  }
}
