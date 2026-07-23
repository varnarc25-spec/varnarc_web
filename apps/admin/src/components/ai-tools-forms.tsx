'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

const textareaClass =
  'min-h-20 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm';

const PRICING_MODELS = [
  'FREE',
  'FREEMIUM',
  'SUBSCRIPTION',
  'PAY_AS_YOU_GO',
  'ENTERPRISE',
  'LIFETIME',
] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function linesToNamed(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, idx) => ({ name, sortOrder: idx }));
}

function linesToScreenshots(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url, idx) => ({ url, sortOrder: idx }));
}

function linesToFaqs(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, answer] = line.split('|');
      return { question: question!.trim(), answer: (answer ?? '').trim() };
    })
    .filter((f) => f.question && f.answer);
}

export function AiToolCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [pricingModel, setPricingModel] = useState<string>('FREEMIUM');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-tools/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          pricingModel,
          status: 'DRAFT',
          features: [],
          integrations: [],
          screenshots: [],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Create failed');
      setName('');
      setSlug('');
      setPricingModel('FREEMIUM');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        className={inputClass}
        placeholder="Tool name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <select
        className={inputClass}
        value={pricingModel}
        onChange={(e) => setPricingModel(e.target.value)}
      >
        {PRICING_MODELS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <div className="flex items-center">
        <Button type="submit" disabled={loading || !name}>
          {loading ? 'Creating…' : 'Create tool'}
        </Button>
      </div>
    </form>
  );
}

type AiToolEditData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  pricingModel?: string | null;
  pricingDetails?: string | null;
  monthlyPrice?: string | null;
  annualPrice?: string | null;
  website?: string | null;
  documentation?: string | null;
  affiliateUrl?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  freePlan?: boolean;
  freeTrial?: boolean;
  apiAvailable?: boolean;
  categoryId?: string | null;
  companyId?: string | null;
  features?: Array<{ name: string }>;
  integrations?: Array<{ name: string }>;
  screenshots?: Array<{ url?: string | null }>;
  faqs?: Array<{ question: string; answer: string }> | null;
};

export function AiToolEditForm({
  tool,
  categories = [],
  companies = [],
}: {
  tool: AiToolEditData;
  categories?: Array<{ id: string; name: string }>;
  companies?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(tool.name);
  const [slug, setSlug] = useState(tool.slug);
  const [description, setDescription] = useState(tool.description ?? '');
  const [shortDescription, setShortDescription] = useState(tool.shortDescription ?? '');
  const [pricingModel, setPricingModel] = useState(tool.pricingModel ?? 'FREEMIUM');
  const [pricingDetails, setPricingDetails] = useState(tool.pricingDetails ?? '');
  const [monthlyPrice, setMonthlyPrice] = useState(tool.monthlyPrice ?? '');
  const [annualPrice, setAnnualPrice] = useState(tool.annualPrice ?? '');
  const [website, setWebsite] = useState(tool.website ?? '');
  const [documentation, setDocumentation] = useState(tool.documentation ?? '');
  const [affiliateUrl, setAffiliateUrl] = useState(tool.affiliateUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(tool.logoUrl ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(tool.coverImageUrl ?? '');
  const [seoTitle, setSeoTitle] = useState(tool.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(tool.seoDescription ?? '');
  const [categoryId, setCategoryId] = useState(tool.categoryId ?? '');
  const [companyId, setCompanyId] = useState(tool.companyId ?? '');
  const [freePlan, setFreePlan] = useState(!!tool.freePlan);
  const [freeTrial, setFreeTrial] = useState(!!tool.freeTrial);
  const [apiAvailable, setApiAvailable] = useState(!!tool.apiAvailable);
  const [featuresText, setFeaturesText] = useState((tool.features ?? []).map((f) => f.name).join('\n'));
  const [integrationsText, setIntegrationsText] = useState(
    (tool.integrations ?? []).map((i) => i.name).join('\n'),
  );
  const [screenshotsText, setScreenshotsText] = useState(
    (tool.screenshots ?? []).map((s) => s.url ?? '').filter(Boolean).join('\n'),
  );
  const [faqsText, setFaqsText] = useState(
    (tool.faqs ?? []).map((f) => `${f.question}|${f.answer}`).join('\n'),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const faqs = linesToFaqs(faqsText);
      const res = await fetch(`/api/admin/ai-tools/tools/${tool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          shortDescription: shortDescription || null,
          pricingModel,
          pricingDetails: pricingDetails || null,
          monthlyPrice: monthlyPrice || null,
          annualPrice: annualPrice || null,
          website: website || null,
          documentation: documentation || null,
          affiliateUrl: affiliateUrl || null,
          logoUrl: logoUrl || null,
          coverImageUrl: coverImageUrl || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          categoryId: categoryId || null,
          companyId: companyId || null,
          freePlan,
          freeTrial,
          apiAvailable,
          features: linesToNamed(featuresText),
          integrations: linesToNamed(integrationsText),
          screenshots: linesToScreenshots(screenshotsText),
          faqs: faqs.length ? faqs : null,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Update failed');
      router.push('/ai-tools/tools');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-6"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <select className={inputClass} value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
          {PRICING_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={inputClass} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">No company (Directory)</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Pricing details"
          value={pricingDetails}
          onChange={(e) => setPricingDetails(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Monthly price"
          value={monthlyPrice}
          onChange={(e) => setMonthlyPrice(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Annual price"
          value={annualPrice}
          onChange={(e) => setAnnualPrice(e.target.value)}
        />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Documentation URL"
          value={documentation}
          onChange={(e) => setDocumentation(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
        <input className={inputClass} placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Cover image URL"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />
        <input className={inputClass} placeholder="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={freePlan} onChange={(e) => setFreePlan(e.target.checked)} />
          Free plan
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={freeTrial} onChange={(e) => setFreeTrial(e.target.checked)} />
          Free trial
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={apiAvailable} onChange={(e) => setApiAvailable(e.target.checked)} />
          API available
        </label>
      </div>
      <textarea
        className="min-h-16 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Short description"
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
      />
      <textarea
        className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <textarea
        className={textareaClass}
        placeholder="SEO description"
        value={seoDescription}
        onChange={(e) => setSeoDescription(e.target.value)}
      />
      <textarea
        className={textareaClass}
        placeholder="Features (one per line)"
        value={featuresText}
        onChange={(e) => setFeaturesText(e.target.value)}
      />
      <textarea
        className={textareaClass}
        placeholder="Integrations (one per line)"
        value={integrationsText}
        onChange={(e) => setIntegrationsText(e.target.value)}
      />
      <textarea
        className={textareaClass}
        placeholder="Screenshot URLs (one per line)"
        value={screenshotsText}
        onChange={(e) => setScreenshotsText(e.target.value)}
      />
      <textarea
        className={textareaClass}
        placeholder="FAQs (question|answer per line)"
        value={faqsText}
        onChange={(e) => setFaqsText(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save tool'}
      </Button>
    </form>
  );
}

export function AiToolActionButton({
  id,
  action,
  label,
}: {
  id: string;
  action: 'publish' | 'unpublish' | 'feature' | 'sponsor';
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-tools/tools/${id}/${action}`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Action failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void run()}>
      {loading ? '…' : label}
    </Button>
  );
}

export function AiToolsBulkActions({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: 'publish' | 'delete') {
    if (!ids.length) return;
    if (action === 'delete' && !confirm(`Delete ${ids.length} tools?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-tools/tools/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Bulk action failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  }

  if (!ids.length) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void run('publish')}>
        Publish selected ({ids.length})
      </Button>
      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void run('delete')}>
        Delete selected
      </Button>
    </div>
  );
}

export function AiCategoryCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-tools/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slug || slugify(name) }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Create failed');
      setName('');
      setSlug('');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 flex flex-wrap gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4"
    >
      <input
        className={inputClass}
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <Button type="submit" disabled={loading || !name}>
        {loading ? 'Creating…' : 'Add category'}
      </Button>
    </form>
  );
}
