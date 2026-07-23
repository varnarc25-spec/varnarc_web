'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

export function AiToolsSearchForm({
  initialSearch = '',
  initialCategory = '',
  initialPricingModel = '',
  initialFreePlan = false,
  initialApiAvailable = false,
  initialSort = '',
  action = '/ai-tools/search',
}: {
  initialSearch?: string;
  initialCategory?: string;
  initialPricingModel?: string;
  initialFreePlan?: boolean;
  initialApiAvailable?: boolean;
  initialSort?: string;
  action?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [pricingModel, setPricingModel] = useState(initialPricingModel);
  const [freePlan, setFreePlan] = useState(initialFreePlan);
  const [apiAvailable, setApiAvailable] = useState(initialApiAvailable);
  const [sort, setSort] = useState(initialSort);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category) params.set('category', category);
    if (pricingModel) params.set('pricingModel', pricingModel);
    if (freePlan) params.set('freePlan', 'true');
    if (apiAvailable) params.set('apiAvailable', 'true');
    if (sort) params.set('sort', sort);
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }

  return (
    <form onSubmit={onSubmit} className="mb-8 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Search AI tools"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Category slug"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <select
          className={inputClass}
          value={pricingModel}
          onChange={(e) => setPricingModel(e.target.value)}
        >
          <option value="">Any pricing</option>
          <option value="FREE">Free</option>
          <option value="FREEMIUM">Freemium</option>
          <option value="SUBSCRIPTION">Subscription</option>
          <option value="PAY_AS_YOU_GO">Pay as you go</option>
          <option value="ENTERPRISE">Enterprise</option>
          <option value="LIFETIME">Lifetime</option>
        </select>
        <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Recent</option>
          <option value="popular">Most popular</option>
          <option value="name">Name A–Z</option>
          <option value="bookmarked">Most bookmarked</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={freePlan} onChange={(e) => setFreePlan(e.target.checked)} />
          Free plan
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={apiAvailable}
            onChange={(e) => setApiAvailable(e.target.checked)}
          />
          API available
        </label>
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}
