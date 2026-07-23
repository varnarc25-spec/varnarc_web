'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function ConstructionFormShell({
  title,
  message,
  children,
}: {
  title: string;
  message: string | null;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
      {message ? <p className="mt-3 text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}

function FormActions({
  loading,
  disabled,
  onSave,
  label = 'Create',
  loadingLabel = 'Saving…',
}: {
  loading: boolean;
  disabled: boolean;
  onSave: () => void;
  label?: string;
  loadingLabel?: string;
}) {
  return (
    <div className="mt-3">
      <Button type="button" disabled={loading || disabled} onClick={onSave}>
        {loading ? loadingLabel : label}
      </Button>
    </div>
  );
}

export function ConstructionPublishButton({
  entity,
  id,
  status,
}: {
  entity: 'materials' | 'brands' | 'cost-templates';
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'PUBLISHED') return null;

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/construction/${entity}/${id}/publish`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Publish failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void publish()}>
      {loading ? 'Publishing…' : 'Publish'}
    </Button>
  );
}

export function ConstructionBrandForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          website: website || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setWebsite('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New brand" message={message}>
      <div className="grid gap-3 md:grid-cols-3">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionBrandEditForm({
  id,
  initial,
}: {
  id: string;
  initial: { name: string; slug: string; website?: string | null; description?: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [website, setWebsite] = useState(initial.website ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/construction/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          website: website || undefined,
          description: description || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="Edit brand" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-24 py-2 md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} label="Save changes" loadingLabel="Saving…" />
    </ConstructionFormShell>
  );
}

export function ConstructionMaterialForm({
  categories,
  brands,
}: {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [brandId, setBrandId] = useState(brands[0]?.id ?? '');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('bag');
  const [approximatePrice, setApproximatePrice] = useState('');
  const [description, setDescription] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sponsored, setSponsored] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          name,
          slug: slugify(name),
          unit,
          approximatePrice: approximatePrice ? Number(approximatePrice) : undefined,
          description: description || undefined,
          affiliateUrl: affiliateUrl || undefined,
          featured,
          sponsored,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setApproximatePrice('');
      setDescription('');
      setAffiliateUrl('');
      setFeatured(false);
      setSponsored(false);
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New material" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className={inputClass} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">No brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Unit (bag, sqft, kg…)" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <input className={inputClass} placeholder="Approx. price (₹)" value={approximatePrice} onChange={(e) => setApproximatePrice(e.target.value)} />
        <input className={inputClass} placeholder="Affiliate URL" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} />
          Sponsored
        </label>
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2 lg:col-span-3`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionMaterialEditForm({
  id,
  categories,
  brands,
  initial,
}: {
  id: string;
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  initial: {
    categoryId?: string | null;
    brandId?: string | null;
    name: string;
    unit?: string | null;
    approximatePrice?: number | string | null;
    description?: string | null;
    affiliateUrl?: string | null;
    specifications?: string | null;
    featured?: boolean;
    sponsored?: boolean;
  };
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? '');
  const [brandId, setBrandId] = useState(initial.brandId ?? '');
  const [name, setName] = useState(initial.name);
  const [unit, setUnit] = useState(initial.unit ?? 'bag');
  const [approximatePrice, setApproximatePrice] = useState(
    initial.approximatePrice != null ? String(initial.approximatePrice) : '',
  );
  const [description, setDescription] = useState(initial.description ?? '');
  const [specifications, setSpecifications] = useState(initial.specifications ?? '');
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? '');
  const [featured, setFeatured] = useState(Boolean(initial.featured));
  const [sponsored, setSponsored] = useState(Boolean(initial.sponsored));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/construction/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          name,
          unit,
          approximatePrice: approximatePrice ? Number(approximatePrice) : undefined,
          description: description || undefined,
          specifications: specifications || undefined,
          affiliateUrl: affiliateUrl || undefined,
          featured,
          sponsored,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="Edit material" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className={inputClass} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">No brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <input className={inputClass} placeholder="Approx. price (₹)" value={approximatePrice} onChange={(e) => setApproximatePrice(e.target.value)} />
        <input className={inputClass} placeholder="Affiliate URL" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} />
          Sponsored
        </label>
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2 lg:col-span-3`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2 lg:col-span-3`}
          placeholder="Specifications"
          value={specifications}
          onChange={(e) => setSpecifications(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} label="Save changes" loadingLabel="Saving…" />
    </ConstructionFormShell>
  );
}

export function ConstructionCostTemplateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('house');
  const [formulaReference, setFormulaReference] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/cost-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          category,
          formulaReference: formulaReference || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setFormulaReference('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New cost template" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input
          className={`${inputClass} md:col-span-2 lg:col-span-3`}
          placeholder="Formula reference"
          value={formulaReference}
          onChange={(e) => setFormulaReference(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionFaqForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category: category || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setQuestion('');
      setAnswer('');
      setCategory('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New FAQ" message={message}>
      <div className="grid gap-3">
        <input className={inputClass} placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <textarea className={`${inputClass} min-h-24 py-2`} placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <input className={inputClass} placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!question || !answer} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionGuideForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          summary: summary || undefined,
          category: category || undefined,
          content: content || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setSlug('');
      setSummary('');
      setCategory('');
      setContent('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New guide" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <textarea className={`${inputClass} min-h-20 py-2 md:col-span-2`} placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <textarea className={`${inputClass} min-h-32 py-2 md:col-span-2`} placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!title} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionDuplicateButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function duplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/construction/materials/${id}/duplicate`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Duplicate failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Duplicate failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void duplicate()}>
      {loading ? 'Duplicating…' : 'Duplicate'}
    </Button>
  );
}

export function ConstructionComparisonForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ids, setIds] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'materials',
          title,
          ids: ids.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setIds('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New comparison" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Material IDs (comma-separated)"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!title || !ids} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/construction/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          description: description || undefined,
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setDescription('');
      setSortOrder('0');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New category" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Sort order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2 lg:col-span-3`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionChecklistForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('Planning');
  const [itemsText, setItemsText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const items = itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((label) => ({ label, phase: projectType }));
      const res = await fetch('/api/admin/construction/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          description: description || undefined,
          projectType: projectType || undefined,
          items,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setSlug('');
      setDescription('');
      setItemsText('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConstructionFormShell title="New checklist" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Phase / project type" value={projectType} onChange={(e) => setProjectType(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-28 py-2 md:col-span-2`}
          placeholder="Checklist items (one per line)"
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!title || !itemsText.trim()} onSave={() => void save()} />
    </ConstructionFormShell>
  );
}

export function ConstructionVersionHistory({
  entity,
  entityId,
}: {
  entity: string;
  entityId: string;
}) {
  const [rows, setRows] = useState<Array<{ id: string; action: string; createdAt: string; user?: { email?: string | null } | null }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/construction/history/${entity}/${entityId}`);
        const json = (await res.json()) as {
          data?: Array<{ id: string; action: string; createdAt: string; user?: { email?: string | null } | null }>;
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(json.error?.message || 'Failed to load history');
        setRows(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      }
    })();
  }, [entity, entityId]);

  return (
    <div className="mt-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="mb-2 text-sm font-semibold">Version history</h3>
      {error ? <p className="text-sm text-[var(--varnarc-subtle)]">{error}</p> : null}
      {!error && !rows.length ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">No audited changes yet.</p>
      ) : null}
      {rows.length ? (
        <ul className="space-y-1 text-sm text-[var(--varnarc-subtle)]">
          {rows.map((row) => (
            <li key={row.id}>
              {row.action} · {new Date(row.createdAt).toLocaleString()}
              {row.user?.email ? ` · ${row.user.email}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
