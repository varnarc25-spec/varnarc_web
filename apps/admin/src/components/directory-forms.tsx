'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function DirectoryListingCreateForm({ categoryIds = [] }: { categoryIds?: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/directory/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          status: 'PENDING',
          categoryIds,
          locations: city ? [{ address1: city, city, country }] : [],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Create failed');
      setName('');
      setSlug('');
      setCity('');
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
      <input className={inputClass} placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
      <input className={inputClass} placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={loading || !name}>
          {loading ? 'Creating…' : 'Create listing'}
        </Button>
      </div>
    </form>
  );
}

type ListingEditData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contactPerson?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  pricing?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  locations?: Array<{ address1: string; city: string; state?: string | null; country: string }>;
  services?: Array<{ name: string }>;
  products?: Array<{ name: string; price?: string | null }>;
  hours?: Array<{ day: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>;
  media?: Array<{ url?: string | null; kind: string; caption?: string | null }>;
  faqs?: Array<{ question: string; answer: string }> | null;
};

export function DirectoryListingEditForm({ listing }: { listing: ListingEditData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(listing.name);
  const [slug, setSlug] = useState(listing.slug);
  const [description, setDescription] = useState(listing.description ?? '');
  const [website, setWebsite] = useState(listing.website ?? '');
  const [email, setEmail] = useState(listing.email ?? '');
  const [phone, setPhone] = useState(listing.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(listing.whatsapp ?? '');
  const [contactPerson, setContactPerson] = useState(listing.contactPerson ?? '');
  const [logoUrl, setLogoUrl] = useState(listing.logoUrl ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(listing.coverImageUrl ?? '');
  const [pricing, setPricing] = useState(listing.pricing ?? '');
  const [seoTitle, setSeoTitle] = useState(listing.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(listing.seoDescription ?? '');
  const [city, setCity] = useState(listing.locations?.[0]?.city ?? '');
  const [country, setCountry] = useState(listing.locations?.[0]?.country ?? 'India');
  const [servicesText, setServicesText] = useState((listing.services ?? []).map((s) => s.name).join('\n'));
  const [productsText, setProductsText] = useState(
    (listing.products ?? []).map((p) => (p.price ? `${p.name}|${p.price}` : p.name)).join('\n'),
  );
  const [mediaUrls, setMediaUrls] = useState((listing.media ?? []).map((m) => m.url ?? '').filter(Boolean).join('\n'));
  const [faqsText, setFaqsText] = useState(
    (listing.faqs ?? []).map((f) => `${f.question}|${f.answer}`).join('\n'),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const services = servicesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
      const products = productsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, price] = line.split('|');
          return { name: name!.trim(), price: price?.trim() || null };
        });
      const media = mediaUrls
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((url, idx) => ({ url, kind: 'gallery', sortOrder: idx }));
      const faqs = faqsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
          const [question, answer] = line.split('|');
          return { question: question!.trim(), answer: (answer ?? '').trim() };
        })
        .filter((f) => f.question && f.answer);

      const res = await fetch(`/api/admin/directory/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          website: website || null,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          contactPerson: contactPerson || null,
          logoUrl: logoUrl || null,
          coverImageUrl: coverImageUrl || null,
          pricing: pricing || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          faqs: faqs.length ? faqs : null,
          locations: city ? [{ address1: city, city, country }] : [],
          services,
          products,
          media,
          hours: listing.hours ?? [],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Update failed');
      router.push('/directory/listings');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <input className={inputClass} placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <input className={inputClass} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inputClass} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={inputClass} placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <input className={inputClass} placeholder="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className={inputClass} placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <input className={inputClass} placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        <input className={inputClass} placeholder="Cover image URL" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
        <input className={inputClass} placeholder="Pricing" value={pricing} onChange={(e) => setPricing(e.target.value)} />
        <input className={inputClass} placeholder="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </div>
      <textarea
        className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <textarea
        className="min-h-20 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="SEO description"
        value={seoDescription}
        onChange={(e) => setSeoDescription(e.target.value)}
      />
      <textarea
        className="min-h-20 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Services (one per line)"
        value={servicesText}
        onChange={(e) => setServicesText(e.target.value)}
      />
      <textarea
        className="min-h-20 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Products (name|price per line)"
        value={productsText}
        onChange={(e) => setProductsText(e.target.value)}
      />
      <textarea
        className="min-h-20 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Gallery URLs (one per line)"
        value={mediaUrls}
        onChange={(e) => setMediaUrls(e.target.value)}
      />
      <textarea
        className="min-h-20 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="FAQs (question|answer per line)"
        value={faqsText}
        onChange={(e) => setFaqsText(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save listing'}
      </Button>
    </form>
  );
}

export function DirectoryActionButton({
  id,
  action,
  label,
}: {
  id: string;
  action: 'publish' | 'verify' | 'feature' | 'sponsor';
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/directory/listings/${id}/${action}`, { method: 'POST' });
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

export function DirectoryCategoryCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/directory/categories', {
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
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4">
      <input className={inputClass} placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <Button type="submit" disabled={loading || !name}>
        {loading ? 'Creating…' : 'Add category'}
      </Button>
    </form>
  );
}

export function LeadStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onChange(next: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/directory/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Update failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      className={inputClass}
      value={status}
      disabled={loading}
      onChange={(e) => void onChange(e.target.value)}
    >
      {['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'].map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
