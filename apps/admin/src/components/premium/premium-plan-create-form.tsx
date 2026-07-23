'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[var(--varnarc-brand)] focus:outline-none';

export function PremiumPlanCreateForm() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('');
  const [priceYearly, setPriceYearly] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/premium/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          priceMonthly: priceMonthly ? Number(priceMonthly) : null,
          priceYearly: priceYearly ? Number(priceYearly) : null,
          isActive: true,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Failed to create plan');
        return;
      }
      setSlug('');
      setName('');
      setPriceMonthly('');
      setPriceYearly('');
      router.refresh();
    } catch {
      setError('Failed to create plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold text-slate-800">Create plan</h2>
      <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={inputClass} placeholder="Monthly price (INR)" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} />
      <input className={inputClass} placeholder="Yearly price (INR)" value={priceYearly} onChange={(e) => setPriceYearly(e.target.value)} />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-[var(--varnarc-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Create plan'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
