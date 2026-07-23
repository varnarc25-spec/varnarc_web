'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';
import { MediaPicker } from '@/components/media-picker';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function AutomobileFormShell({
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

export function AutomobilePublishButton({
  entity,
  id,
  status,
}: {
  entity: 'manufacturers' | 'vehicles';
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'PUBLISHED') return null;

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/automobile/${entity}/${id}/publish`, { method: 'POST' });
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

export function AutomobileDuplicateButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function duplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/automobile/vehicles/${id}/duplicate`, { method: 'POST' });
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

type GalleryItem = { mediaId?: string | null; imageUrl?: string | null; previewUrl?: string | null };

function AutomobileGalleryEditor({
  items,
  onChange,
}: {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  return (
    <div className="md:col-span-2 lg:col-span-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">Gallery (Media Library)</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <div key={`${item.mediaId ?? item.imageUrl ?? index}`} className="relative rounded border p-2">
            {item.previewUrl || item.imageUrl ? (
              <img src={item.previewUrl || item.imageUrl || ''} alt="" className="h-16 w-16 rounded object-cover" />
            ) : null}
            <button
              type="button"
              className="mt-1 block text-xs text-red-600"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <MediaPicker
        value={null}
        onChange={(mediaId, previewUrl) => {
          if (!mediaId) return;
          onChange([...items, { mediaId, imageUrl: previewUrl ?? null, previewUrl: previewUrl ?? null }]);
        }}
      />
    </div>
  );
}

export function AutomobileVehicleReviewLinker({
  vehicleId,
  initialReviewIds,
}: {
  vehicleId: string;
  initialReviewIds: string[];
}) {
  const router = useRouter();
  const [options, setOptions] = useState<Array<{ id: string; title: string; slug: string; product?: { name?: string | null } }>>([]);
  const [selected, setSelected] = useState<string[]>(initialReviewIds);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/automobile/review-options');
      const json = (await res.json()) as { data?: typeof options };
      if (Array.isArray(json.data)) setOptions(json.data);
    })();
  }, []);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/automobile/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds: selected }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Review links saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AutomobileFormShell title="Linked reviews" message={message}>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-[var(--varnarc-border)] p-3">
        {options.map((review) => (
          <label key={review.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(review.id)}
              onChange={(e) => {
                setSelected((prev) =>
                  e.target.checked ? [...prev, review.id] : prev.filter((id) => id !== review.id),
                );
              }}
            />
            <span>
              {review.title}
              {review.product?.name ? (
                <span className="ml-1 text-xs text-[var(--varnarc-subtle)]">({review.product.name})</span>
              ) : null}
            </span>
          </label>
        ))}
        {!options.length ? <p className="text-sm text-[var(--varnarc-subtle)]">No published reviews found.</p> : null}
      </div>
      <FormActions loading={loading} disabled={false} onSave={() => void save()} label="Save review links" loadingLabel="Saving…" />
    </AutomobileFormShell>
  );
}

export function AutomobileManufacturerForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          country: country || undefined,
          website: website || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setSlug('');
      setCountry('');
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
    <AutomobileFormShell title="New manufacturer" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} />
    </AutomobileFormShell>
  );
}

export function AutomobileManufacturerEditForm({
  id,
  initial,
}: {
  id: string;
  initial: {
    name: string;
    slug: string;
    country?: string | null;
    website?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    logoMediaId?: string | null;
    featured?: boolean;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [country, setCountry] = useState(initial.country ?? '');
  const [website, setWebsite] = useState(initial.website ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [logoMediaId, setLogoMediaId] = useState<string | null>(initial.logoMediaId ?? null);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? '');
  const [featured, setFeatured] = useState(Boolean(initial.featured));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/automobile/manufacturers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          country: country || undefined,
          website: website || undefined,
          description: description || undefined,
          logoMediaId,
          logoUrl: logoUrl || undefined,
          featured,
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
    <AutomobileFormShell title="Edit manufacturer" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClass} placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <input className={inputClass} placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <div className="md:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">Logo</p>
          <MediaPicker
            value={logoMediaId}
            previewUrl={logoUrl}
            onChange={(mediaId, previewUrl) => {
              setLogoMediaId(mediaId);
              if (previewUrl) setLogoUrl(previewUrl);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <textarea
          className={`${inputClass} min-h-24 py-2 md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name} onSave={() => void save()} label="Save changes" loadingLabel="Saving…" />
    </AutomobileFormShell>
  );
}

export function AutomobileVehicleForm({
  manufacturers,
}: {
  manufacturers: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [manufacturerId, setManufacturerId] = useState(manufacturers[0]?.id ?? '');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [exShowroomPrice, setExShowroomPrice] = useState('');
  const [estimatedOnRoadPrice, setEstimatedOnRoadPrice] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sponsored, setSponsored] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturerId,
          name,
          slug: slugify(name),
          model,
          variant: variant || undefined,
          fuelType: fuelType || undefined,
          exShowroomPrice: exShowroomPrice ? Number(exShowroomPrice) : undefined,
          estimatedOnRoadPrice: estimatedOnRoadPrice ? Number(estimatedOnRoadPrice) : undefined,
          affiliateUrl: affiliateUrl || undefined,
          featured,
          sponsored,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setModel('');
      setVariant('');
      setExShowroomPrice('');
      setEstimatedOnRoadPrice('');
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
    <AutomobileFormShell title="New vehicle" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={manufacturerId} onChange={(e) => setManufacturerId(e.target.value)}>
          <option value="">Select manufacturer</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
        <input className={inputClass} placeholder="Variant" value={variant} onChange={(e) => setVariant(e.target.value)} />
        <input className={inputClass} placeholder="Fuel type" value={fuelType} onChange={(e) => setFuelType(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Ex-showroom price (₹)"
          value={exShowroomPrice}
          onChange={(e) => setExShowroomPrice(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="On-road price (₹)"
          value={estimatedOnRoadPrice}
          onChange={(e) => setEstimatedOnRoadPrice(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} />
          Sponsored
        </label>
      </div>
      <FormActions loading={loading} disabled={!name || !model || !manufacturerId} onSave={() => void save()} />
    </AutomobileFormShell>
  );
}

export function AutomobileVehicleEditForm({
  id,
  manufacturers,
  initial,
}: {
  id: string;
  manufacturers: Array<{ id: string; name: string }>;
  initial: {
    manufacturerId?: string | null;
    name: string;
    model: string;
    variant?: string | null;
    fuelType?: string | null;
    category?: string | null;
    imageUrl?: string | null;
    imageMediaId?: string | null;
    brochureMediaId?: string | null;
    galleryItems?: GalleryItem[];
    reviewIds?: string[];
    exShowroomPrice?: number | string | null;
    estimatedOnRoadPrice?: number | string | null;
    affiliateUrl?: string | null;
    description?: string | null;
    featured?: boolean;
    sponsored?: boolean;
  };
}) {
  const router = useRouter();
  const [manufacturerId, setManufacturerId] = useState(initial.manufacturerId ?? '');
  const [name, setName] = useState(initial.name);
  const [model, setModel] = useState(initial.model);
  const [variant, setVariant] = useState(initial.variant ?? '');
  const [fuelType, setFuelType] = useState(initial.fuelType ?? '');
  const [category, setCategory] = useState(initial.category ?? '');
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? '');
  const [imageMediaId, setImageMediaId] = useState<string | null>(initial.imageMediaId ?? null);
  const [brochureMediaId, setBrochureMediaId] = useState<string | null>(initial.brochureMediaId ?? null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(initial.galleryItems ?? []);
  const [exShowroomPrice, setExShowroomPrice] = useState(
    initial.exShowroomPrice != null ? String(initial.exShowroomPrice) : '',
  );
  const [estimatedOnRoadPrice, setEstimatedOnRoadPrice] = useState(
    initial.estimatedOnRoadPrice != null ? String(initial.estimatedOnRoadPrice) : '',
  );
  const [affiliateUrl, setAffiliateUrl] = useState(initial.affiliateUrl ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [featured, setFeatured] = useState(Boolean(initial.featured));
  const [sponsored, setSponsored] = useState(Boolean(initial.sponsored));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const galleryImages = galleryItems.map((item, index) => ({
        mediaId: item.mediaId,
        imageUrl: item.imageUrl,
        displayOrder: index,
      }));
      const res = await fetch(`/api/admin/automobile/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturerId: manufacturerId || undefined,
          name,
          model,
          variant: variant || '',
          fuelType: fuelType || undefined,
          category: category || undefined,
          imageUrl: imageUrl || undefined,
          brochureMediaId,
          galleryImages,
          exShowroomPrice: exShowroomPrice ? Number(exShowroomPrice) : undefined,
          estimatedOnRoadPrice: estimatedOnRoadPrice ? Number(estimatedOnRoadPrice) : undefined,
          affiliateUrl: affiliateUrl || undefined,
          description: description || undefined,
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
    <AutomobileFormShell title="Edit vehicle" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={manufacturerId} onChange={(e) => setManufacturerId(e.target.value)}>
          <option value="">Select manufacturer</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
        <input className={inputClass} placeholder="Variant" value={variant} onChange={(e) => setVariant(e.target.value)} />
        <input className={inputClass} placeholder="Fuel type" value={fuelType} onChange={(e) => setFuelType(e.target.value)} />
        <input className={inputClass} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Ex-showroom price (₹)"
          value={exShowroomPrice}
          onChange={(e) => setExShowroomPrice(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="On-road price (₹)"
          value={estimatedOnRoadPrice}
          onChange={(e) => setEstimatedOnRoadPrice(e.target.value)}
        />
        <div className="md:col-span-2 lg:col-span-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">Primary image</p>
          <MediaPicker
            value={imageMediaId}
            previewUrl={imageUrl}
            onChange={(mediaId, previewUrl) => {
              setImageMediaId(mediaId);
              if (previewUrl) setImageUrl(previewUrl);
            }}
          />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">Brochure PDF/image</p>
          <MediaPicker
            value={brochureMediaId}
            onChange={(mediaId) => setBrochureMediaId(mediaId)}
          />
        </div>
        <AutomobileGalleryEditor items={galleryItems} onChange={setGalleryItems} />
        <input
          className={inputClass}
          placeholder="Affiliate URL"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} />
          Sponsored
        </label>
        <textarea
          className={`${inputClass} min-h-24 py-2 md:col-span-2 lg:col-span-3`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!name || !model} onSave={() => void save()} label="Save changes" loadingLabel="Saving…" />
    </AutomobileFormShell>
  );
}

export function AutomobileMaintenanceForm({
  vehicles,
}: {
  vehicles: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [serviceInterval, setServiceInterval] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          title,
          serviceInterval,
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
          notes: notes || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setServiceInterval('');
      setEstimatedCost('');
      setNotes('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AutomobileFormShell title="New maintenance schedule" message={message}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Service interval (e.g. 10,000 km / 12 months)"
          value={serviceInterval}
          onChange={(e) => setServiceInterval(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Estimated cost (₹)"
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2`}
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <FormActions
        loading={loading}
        disabled={!vehicleId || !title || !serviceInterval}
        onSave={() => void save()}
      />
    </AutomobileFormShell>
  );
}

export function AutomobileFaqForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setQuestion('');
      setAnswer('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AutomobileFormShell title="New FAQ" message={message}>
      <div className="grid gap-3">
        <input className={inputClass} placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-24 py-2`}
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!question || !answer} onSave={() => void save()} />
    </AutomobileFormShell>
  );
}

export function AutomobileGuideForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          summary: summary || undefined,
          body: body || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setSlug('');
      setSummary('');
      setBody('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AutomobileFormShell title="New guide" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-20 py-2 md:col-span-2`}
          placeholder="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-32 py-2 md:col-span-2`}
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!title} onSave={() => void save()} />
    </AutomobileFormShell>
  );
}

export function AutomobileComparisonForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ids, setIds] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'vehicles',
          title,
          ids: ids
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
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
    <AutomobileFormShell title="New comparison" message={message}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className={inputClass}
          placeholder="Vehicle IDs (comma-separated)"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
      </div>
      <FormActions loading={loading} disabled={!title || !ids} onSave={() => void save()} />
    </AutomobileFormShell>
  );
}

export function AutomobileVersionHistory({
  entity,
  entityId,
}: {
  entity: string;
  entityId: string;
}) {
  const [rows, setRows] = useState<
    Array<{ id: string; action: string; createdAt: string; user?: { email?: string | null } | null }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/automobile/history/${entity}/${entityId}`);
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
