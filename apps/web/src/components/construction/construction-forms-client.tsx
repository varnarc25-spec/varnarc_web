'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { getApiBaseUrl } from '@/services/api-client';
import type { ConstructionEstimateResult } from '@/services/construction';

const inputClass =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-[#0b1f3a]';

type EstimateMode = 'quick' | 'detailed';

type RoomDraft = {
  id: string;
  name: string;
  lengthFt: string;
  widthFt: string;
  quality: 'basic' | 'standard' | 'premium';
};

type LineItemDraft = {
  id: string;
  name: string;
  quantity: string;
  unitCost: string;
};

let roomSeq = 0;
function newRoom(): RoomDraft {
  roomSeq += 1;
  return {
    id: `room-${roomSeq}`,
    name: 'Living room',
    lengthFt: '14',
    widthFt: '12',
    quality: 'standard',
  };
}

let lineItemSeq = 0;
function newLineItem(): LineItemDraft {
  lineItemSeq += 1;
  return { id: `item-${lineItemSeq}`, name: 'Kitchen cabinets', quantity: '1', unitCost: '85000' };
}

export function ConstructionEstimateForm({
  templates,
  isAuthenticated = false,
}: {
  templates: Array<{ slug: string; name: string }>;
  isAuthenticated?: boolean;
}) {
  const [mode, setMode] = useState<EstimateMode>('quick');
  const [templateSlug, setTemplateSlug] = useState(templates[0]?.slug ?? '');
  const [areaSqft, setAreaSqft] = useState('');
  const [region, setRegion] = useState('');
  const [quality, setQuality] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [rooms, setRooms] = useState<RoomDraft[]>([newRoom()]);
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [result, setResult] = useState<ConstructionEstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('My construction project');

  function buildPayload() {
    const base = {
      templateSlug: templateSlug || undefined,
      region: region || undefined,
      quality,
    };
    if (mode === 'detailed') {
      const roomPayload = rooms
        .map((room) => {
          const lengthFt = Number(room.lengthFt);
          const widthFt = Number(room.widthFt);
          if (!room.name.trim() || !lengthFt || !widthFt) return null;
          return {
            name: room.name.trim(),
            lengthFt,
            widthFt,
            quality: room.quality,
          };
        })
        .filter(Boolean);
      const lineItemPayload = lineItems
        .map((item) => {
          const quantity = Number(item.quantity);
          const unitCost = Number(item.unitCost);
          if (!item.name.trim() || !quantity || unitCost < 0) return null;
          return { name: item.name.trim(), quantity, unitCost };
        })
        .filter(Boolean);
      return {
        ...base,
        rooms: roomPayload,
        lineItems: lineItemPayload.length ? lineItemPayload : undefined,
      };
    }
    return { ...base, areaSqft: Number(areaSqft) };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveMessage(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/construction/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const json = (await res.json()) as { data?: ConstructionEstimateResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Estimate failed');
      setResult(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed');
    } finally {
      setLoading(false);
    }
  }

  async function saveAsProject() {
    if (!result) return;
    setSaveLoading(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/construction/estimate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'My construction project',
          ...buildPayload(),
        }),
      });
      const json = (await res.json()) as { data?: { id?: string }; error?: { message?: string } };
      if (res.status === 401) {
        setSaveMessage('login');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setSaveMessage(json.data?.id ? 'saved' : 'saved');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === 'quick' ? 'primary' : 'secondary'}
          onClick={() => setMode('quick')}
        >
          Quick estimate
        </Button>
        <Button
          type="button"
          variant={mode === 'detailed' ? 'primary' : 'secondary'}
          onClick={() => setMode('detailed')}
        >
          Room-by-room
        </Button>
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        {templates.length ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Project template</label>
            <select className={inputClass} value={templateSlug} onChange={(e) => setTemplateSlug(e.target.value)}>
              {templates.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {mode === 'quick' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Built-up area (sq ft)</label>
            <input
              className={inputClass}
              type="number"
              value={areaSqft}
              onChange={(e) => setAreaSqft(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Rooms</h3>
              <Button type="button" variant="secondary" onClick={() => setRooms((r) => [...r, newRoom()])}>
                Add room
              </Button>
            </div>
            {rooms.map((room, index) => (
              <div key={room.id} className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-2">
                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block text-slate-600">Room name</span>
                  <input
                    className={inputClass}
                    value={room.name}
                    onChange={(e) =>
                      setRooms((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                      )
                    }
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Length (ft)</span>
                  <input
                    className={inputClass}
                    type="number"
                    value={room.lengthFt}
                    onChange={(e) =>
                      setRooms((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, lengthFt: e.target.value } : r)),
                      )
                    }
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Width (ft)</span>
                  <input
                    className={inputClass}
                    type="number"
                    value={room.widthFt}
                    onChange={(e) =>
                      setRooms((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, widthFt: e.target.value } : r)),
                      )
                    }
                    required
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block text-slate-600">Finish quality</span>
                  <select
                    className={inputClass}
                    value={room.quality}
                    onChange={(e) =>
                      setRooms((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, quality: e.target.value as RoomDraft['quality'] } : r,
                        ),
                      )
                    }
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
                {rooms.length > 1 ? (
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setRooms((rows) => rows.filter((_, i) => i !== index))}
                    >
                      Remove room
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Custom line items (optional)</h3>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setLineItems((items) => [...items, newLineItem()])}
                >
                  Add line item
                </Button>
              </div>
              {lineItems.length === 0 ? (
                <p className="text-sm text-slate-500">Add fixtures, fittings, or specialty materials not covered by room area.</p>
              ) : null}
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-3">
                  <label className="text-sm md:col-span-3">
                    <span className="mb-1 block text-slate-600">Item</span>
                    <input
                      className={inputClass}
                      value={item.name}
                      onChange={(e) =>
                        setLineItems((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                        )
                      }
                      required
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600">Quantity</span>
                    <input
                      className={inputClass}
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        setLineItems((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, quantity: e.target.value } : r)),
                        )
                      }
                      required
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-600">Unit cost (₹)</span>
                    <input
                      className={inputClass}
                      type="number"
                      value={item.unitCost}
                      onChange={(e) =>
                        setLineItems((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, unitCost: e.target.value } : r)),
                        )
                      }
                      required
                    />
                  </label>
                  <div className="md:col-span-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setLineItems((rows) => rows.filter((_, i) => i !== index))}
                    >
                      Remove item
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Region (optional)</label>
            <input
              className={inputClass}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>
          {mode === 'quick' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quality tier</label>
              <select
                className={inputClass}
                value={quality}
                onChange={(e) => setQuality(e.target.value as 'basic' | 'standard' | 'premium')}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          ) : null}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Estimating…' : 'Get estimate'}
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {result.totalCost != null ? (
            <p className="text-2xl font-extrabold text-[#0b1f3a]">₹{result.totalCost}</p>
          ) : null}
          <p className="mt-1 font-medium text-slate-700">Estimated project cost</p>
          {result.areaSqft ? (
            <p className="mt-1 text-slate-500">Total area: {result.areaSqft} sq ft</p>
          ) : null}
          <div className="mt-4 space-y-2">
            {result.materialCost != null ? <Row label="Materials" value={`₹${result.materialCost}`} /> : null}
            {result.laborCost != null ? <Row label="Labor" value={`₹${result.laborCost}`} /> : null}
            {result.equipmentCost != null ? <Row label="Equipment" value={`₹${result.equipmentCost}`} /> : null}
            {result.contingency != null ? <Row label="Contingency" value={`₹${result.contingency}`} /> : null}
          </div>
          {result.breakdown?.length ? (
            <ul className="mt-4 space-y-1 border-t border-slate-200 pt-3">
              {result.breakdown.map((item) => (
                <li key={item.label} className="flex justify-between text-slate-600">
                  <span>{item.label}</span>
                  <span>₹{item.amount}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 border-t border-slate-200 pt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Project name</label>
            <input
              className={inputClass}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My construction project"
            />
            {isAuthenticated ? (
              <Button
                type="button"
                className="mt-3"
                disabled={saveLoading}
                onClick={() => void saveAsProject()}
              >
                {saveLoading ? 'Saving…' : 'Save as project'}
              </Button>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button type="button" disabled={saveLoading} onClick={() => void saveAsProject()}>
                  {saveLoading ? 'Saving…' : 'Save as project'}
                </Button>
                <Link
                  href={`/auth/login?returnTo=${encodeURIComponent('/construction/estimate')}`}
                  className="text-sm font-medium text-[#f97316] hover:underline"
                >
                  Log in to save
                </Link>
              </div>
            )}
            {saveMessage === 'login' ? (
              <p className="mt-2 text-sm text-amber-800">
                <Link
                  href={`/auth/login?returnTo=${encodeURIComponent('/construction/estimate')}`}
                  className="font-medium underline"
                >
                  Sign in
                </Link>{' '}
                to save this estimate as a project.
              </p>
            ) : null}
            {saveMessage === 'saved' ? (
              <p className="mt-2 text-sm text-emerald-700">
                Project saved.{' '}
                <Link href="/construction/projects" className="font-medium underline">
                  View my projects
                </Link>
              </p>
            ) : null}
            {saveMessage && saveMessage !== 'login' && saveMessage !== 'saved' ? (
              <p className="mt-2 text-sm text-red-600">{saveMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
