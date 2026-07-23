'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@varnarc/ui';
import { formatPricingModel, type AiToolDetail } from './types';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const COMPARE_ROWS: Array<{ key: string; label: string; value: (t: AiToolDetail) => string }> = [
  { key: 'pricing', label: 'Pricing model', value: (t) => formatPricingModel(t.pricingModel) || '—' },
  { key: 'monthly', label: 'Monthly price', value: (t) => t.monthlyPrice || '—' },
  { key: 'annual', label: 'Annual price', value: (t) => t.annualPrice || '—' },
  { key: 'freePlan', label: 'Free plan', value: (t) => (t.freePlan ? 'Yes' : 'No') },
  { key: 'freeTrial', label: 'Free trial', value: (t) => (t.freeTrial ? 'Yes' : 'No') },
  { key: 'api', label: 'API available', value: (t) => (t.apiAvailable ? 'Yes' : 'No') },
  {
    key: 'category',
    label: 'Category',
    value: (t) => t.category?.name || '—',
  },
  {
    key: 'features',
    label: 'Features',
    value: (t) => (t.features?.length ? t.features.map((f) => f.name).join(', ') : '—'),
  },
  {
    key: 'integrations',
    label: 'Integrations',
    value: (t) => (t.integrations?.length ? t.integrations.map((i) => i.name).join(', ') : '—'),
  },
];

export function AiCompareWidget({
  initialSlugs = [],
  initialTools,
}: {
  initialSlugs?: string[];
  initialTools?: AiToolDetail[];
}) {
  const [slugA, setSlugA] = useState(initialSlugs[0] ?? '');
  const [slugB, setSlugB] = useState(initialSlugs[1] ?? '');
  const [slugC, setSlugC] = useState(initialSlugs[2] ?? '');
  const [tools, setTools] = useState<AiToolDetail[]>(initialTools ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareHref = useMemo(() => {
    const slugs = [slugA, slugB, slugC].map((s) => s.trim()).filter(Boolean);
    if (slugs.length < 2) return null;
    return `/ai-tools/compare?slugs=${encodeURIComponent(slugs.join(','))}`;
  }, [slugA, slugB, slugC]);

  async function runCompare(e: React.FormEvent) {
    e.preventDefault();
    const slugs = [slugA, slugB, slugC].map((s) => s.trim()).filter(Boolean);
    if (slugs.length < 2) {
      setError('Enter at least two tool slugs.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/ai-tools/compare?slugs=${encodeURIComponent(slugs.join(','))}`);
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { tools?: AiToolDetail[] };
        error?: { message?: string };
      };
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || 'Compare failed');
      }
      setTools(json.data?.tools ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={runCompare} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className={inputClass}
            placeholder="Tool slug A (e.g. chatgpt)"
            value={slugA}
            onChange={(e) => setSlugA(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Tool slug B (e.g. claude)"
            value={slugB}
            onChange={(e) => setSlugB(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Optional third slug"
            value={slugC}
            onChange={(e) => setSlugC(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Comparing…' : 'Compare'}
          </Button>
          {compareHref ? (
            <Link href={compareHref} className="text-sm text-[var(--varnarc-brand)] hover:underline">
              Open compare page
            </Link>
          ) : null}
          {slugA.trim() && slugB.trim() ? (
            <Link
              href={`/ai-tools/compare/${slugA.trim()}-vs-${slugB.trim()}`}
              className="text-sm text-[var(--varnarc-brand)] hover:underline"
            >
              SEO pair URL
            </Link>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {tools.length >= 2 ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--varnarc-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Attribute</th>
                {tools.map((t) => (
                  <th key={t.id} className="px-3 py-2 font-medium">
                    <Link href={`/ai-tools/${t.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                      {t.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-[var(--varnarc-border)]">
                  <td className="px-3 py-2 font-medium text-[var(--varnarc-subtle)]">{row.label}</td>
                  {tools.map((t) => (
                    <td key={`${t.id}-${row.key}`} className="px-3 py-2 align-top">
                      {row.value(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
