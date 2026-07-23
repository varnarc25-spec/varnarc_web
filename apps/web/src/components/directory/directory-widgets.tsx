'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

export function DirectorySearchForm({
  initialSearch = '',
  initialCity = '',
  initialCategory = '',
  initialVerified = false,
  initialFeatured = false,
  initialSponsored = false,
  initialOpenNow = false,
  initialTopRated = false,
  initialSort = '',
  action = '/directory/search',
}: {
  initialSearch?: string;
  initialCity?: string;
  initialCategory?: string;
  initialVerified?: boolean;
  initialFeatured?: boolean;
  initialSponsored?: boolean;
  initialOpenNow?: boolean;
  initialTopRated?: boolean;
  initialSort?: string;
  action?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [verified, setVerified] = useState(initialVerified);
  const [featured, setFeatured] = useState(initialFeatured);
  const [sponsored, setSponsored] = useState(initialSponsored);
  const [openNow, setOpenNow] = useState(initialOpenNow);
  const [topRated, setTopRated] = useState(initialTopRated);
  const [sort, setSort] = useState(initialSort);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (city) params.set('city', city);
    if (category) params.set('category', category);
    if (verified) params.set('verified', 'true');
    if (featured) params.set('featured', 'true');
    if (sponsored) params.set('sponsored', 'true');
    if (openNow) params.set('openNow', 'true');
    if (topRated) params.set('topRated', 'true');
    if (sort) params.set('sort', sort);
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }

  return (
    <form onSubmit={onSubmit} className="mb-8 space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <input
          className={inputClass}
          placeholder="Search businesses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input className={inputClass} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Category slug"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Recent</option>
          <option value="rating">Top rated</option>
          <option value="reviews">Most reviewed</option>
          <option value="popular">Most viewed</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          Verified
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} />
          Sponsored
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
          Open now
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={topRated} onChange={(e) => setTopRated(e.target.checked)} />
          Top rated
        </label>
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}

export function ListingLeadForm({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [leadType, setLeadType] = useState('contact');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/directory/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          name,
          email: email || null,
          phone: phone || null,
          message: message || null,
          leadType,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(json.error?.message || 'Failed to send inquiry');
      }
      setDone(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4 text-sm">
        Thanks — your inquiry was sent.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
    >
      <h3 className="font-semibold">Contact this business</h3>
      <select className={inputClass} value={leadType} onChange={(e) => setLeadType(e.target.value)}>
        <option value="contact">General inquiry</option>
        <option value="quote">Quote request</option>
        <option value="appointment">Appointment request</option>
      </select>
      <input className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={inputClass} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={inputClass} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <textarea
        className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" disabled={loading || !name}>
        {loading ? 'Sending…' : 'Send inquiry'}
      </Button>
    </form>
  );
}
