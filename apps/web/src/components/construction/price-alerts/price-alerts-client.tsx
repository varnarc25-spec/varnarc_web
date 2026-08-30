'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PRICE_ALERT_CONDITIONS, PRICE_ALERT_QUALIFICATION } from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

type AlertRow = {
  id: string;
  name: string | null;
  condition: string;
  conditionLabel: string;
  targetPrice: number | null;
  thresholdPercent: number | null;
  baselinePrice: number | null;
  currency: string;
  status: string;
  cooldownHours: number;
  lastTriggeredAt: string | null;
  material: { id: string; name: string; slug: string; unit: string; hubKey: string | null } | null;
  location: { id: string; name: string; slug: string; type: string } | null;
};

type TriggerRow = {
  id: string;
  alertId: string;
  observedPrice: number;
  changePercent: number | null;
  direction: string;
  suppressed: boolean;
  suppressReason: string | null;
  triggeredAt: string;
  alert?: {
    id: string;
    name: string | null;
    material?: { name: string } | null;
    location?: { name: string } | null;
  } | null;
};

type Meta = {
  conditions: typeof PRICE_ALERT_CONDITIONS;
  maxPerUser: number;
  defaultCooldownHours: number;
  qualification: string;
  cities: Array<{ slug: string; name: string; id: string | null }>;
  materials?: MaterialOpt[];
};

type MaterialOpt = { id: string; name: string; slug: string; unit: string };

type Tab = 'active' | 'paused' | 'history' | 'create';

function unwrap<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as { data?: T; error?: { message?: string } };
  if ('data' in o) return (o.data ?? null) as T | null;
  return json as T;
}

function money(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function PriceAlertsClient() {
  const [tab, setTab] = useState<Tab>('active');
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<AlertRow[]>([]);
  const [paused, setPaused] = useState<AlertRow[]>([]);
  const [history, setHistory] = useState<TriggerRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [materials, setMaterials] = useState<MaterialOpt[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [materialId, setMaterialId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [condition, setCondition] = useState<string>('BELOW');
  const [targetPrice, setTargetPrice] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState('');
  const [name, setName] = useState('');

  const conditionMeta = useMemo(
    () => PRICE_ALERT_CONDITIONS.find((c) => c.key === condition),
    [condition],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, histRes, metaRes] = await Promise.all([
        fetch('/api/construction/price-alerts', { cache: 'no-store' }),
        fetch('/api/construction/price-alerts/history', { cache: 'no-store' }),
        fetch('/api/construction/price-alerts/meta', { cache: 'no-store' }),
      ]);

      if (listRes.status === 401 || histRes.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }
      setAuthRequired(false);

      const listJson = await listRes.json();
      const histJson = await histRes.json();
      const metaJson = await metaRes.json();

      if (!listRes.ok) {
        setError(listJson?.error?.message ?? 'Failed to load alerts');
      } else {
        const data = unwrap<{ active: AlertRow[]; paused: AlertRow[] }>(listJson);
        setActive(data?.active ?? []);
        setPaused(data?.paused ?? []);
      }

      if (histRes.ok) {
        const data = unwrap<{ items: TriggerRow[] }>(histJson);
        setHistory(data?.items ?? []);
      }

      if (metaRes.ok) {
        const m = unwrap<Meta>(metaJson);
        setMeta(m);
        setMaterials(m?.materials ?? []);
      }
    } catch {
      setError('Failed to load price alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusyId('create');
    try {
      const body: Record<string, unknown> = {
        materialId,
        locationId,
        direction: condition,
        name: name || null,
        currency: 'INR',
      };
      if (conditionMeta?.unit === 'percent') {
        body.thresholdPercent = Number(thresholdPercent);
      } else {
        body.targetPrice = Number(targetPrice);
      }
      const res = await fetch('/api/construction/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? 'Could not create alert');
        return;
      }
      setName('');
      setTargetPrice('');
      setThresholdPercent('');
      setTab('active');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function act(id: string, action: 'pause' | 'resume' | 'delete') {
    setBusyId(id);
    setError(null);
    try {
      const res =
        action === 'delete'
          ? await fetch(`/api/construction/price-alerts/${id}`, { method: 'DELETE' })
          : await fetch(`/api/construction/price-alerts/${id}/${action}`, {
              method: 'POST',
            });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? 'Action failed');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (authRequired) {
    return (
      <div className={cn(cx.card, 'p-6')}>
        <h2 className="text-lg font-bold text-[#0b1f3a]">Sign in to manage price alerts</h2>
        <p className="mt-2 text-sm text-slate-600">
          Material price alerts require an authenticated Varnarc account. Notifications are
          delivered through your existing in-app notification inbox.
        </p>
        <Link href="/api/auth/login" className={cn(cx.primaryBtn, 'mt-4 inline-flex')}>
          Sign in
        </Link>
      </div>
    );
  }

  const list = tab === 'paused' ? paused : active;

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        {meta?.qualification ?? PRICE_ALERT_QUALIFICATION}
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['active', `Active (${active.length})`],
            ['paused', `Paused (${paused.length})`],
            ['history', 'Trigger history'],
            ['create', 'Create alert'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold',
              tab === key ? 'bg-[#0b1f3a] text-white' : 'bg-white ring-1 ring-slate-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {tab === 'create' ? (
        <form onSubmit={createAlert} className={cn(cx.card, 'grid gap-4 p-5 sm:grid-cols-2')}>
          <label className="text-sm sm:col-span-2">
            <span className={cx.label}>Name (optional)</span>
            <input
              className={cx.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cement Hyderabad floor"
            />
          </label>
          <label className="text-sm">
            <span className={cx.label}>Material</span>
            <select
              className={cx.input}
              required
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
            >
              <option value="">Select material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className={cx.label}>Location</span>
            <select
              className={cx.input}
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Select city</option>
              {(meta?.cities ?? [])
                .filter((c) => c.id)
                .map((c) => (
                  <option key={c.id!} value={c.id!}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className={cx.label}>Condition</span>
            <select
              className={cx.input}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {PRICE_ALERT_CONDITIONS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">{conditionMeta?.description}</span>
          </label>
          {conditionMeta?.unit === 'percent' ? (
            <label className="text-sm">
              <span className={cx.label}>Percent (X%)</span>
              <input
                className={cx.input}
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                required
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(e.target.value)}
              />
            </label>
          ) : (
            <label className="text-sm">
              <span className={cx.label}>Price (₹)</span>
              <input
                className={cx.input}
                type="number"
                min={1}
                step={1}
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </label>
          )}
          <div className="flex items-end sm:col-span-2">
            <button type="submit" disabled={busyId === 'create'} className={cx.primaryBtn}>
              {busyId === 'create' ? 'Saving…' : 'Save alert'}
            </button>
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Limit {meta?.maxPerUser ?? 25} alerts. Cooldown defaults to{' '}
            {meta?.defaultCooldownHours ?? 24}h to prevent duplicate notifications. Only fresh
            LIVE/VERIFIED observations can trigger alerts.
          </p>
        </form>
      ) : null}

      {(tab === 'active' || tab === 'paused') && !loading ? (
        <ul className="space-y-3">
          {!list.length ? (
            <li className={cn(cx.card, 'p-5 text-sm text-slate-600')}>
              No {tab} alerts yet.{' '}
              <button type="button" className={cx.link} onClick={() => setTab('create')}>
                Create one
              </button>
            </li>
          ) : (
            list.map((a) => (
              <li key={a.id} className={cn(cx.card, 'p-4')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#0b1f3a]">
                      {a.name || a.material?.name || 'Alert'}
                      {a.location ? (
                        <span className="font-normal text-slate-500"> · {a.location.name}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {a.conditionLabel}
                      {a.targetPrice != null ? ` · ${money(a.targetPrice)}` : null}
                      {a.thresholdPercent != null ? ` · ${a.thresholdPercent}%` : null}
                      {a.baselinePrice != null ? ` · baseline ${money(a.baselinePrice)}` : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Cooldown {a.cooldownHours}h
                      {a.lastTriggeredAt
                        ? ` · last triggered ${new Date(a.lastTriggeredAt).toLocaleString('en-IN')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tab === 'active' ? (
                      <button
                        type="button"
                        className={cx.secondaryBtn}
                        disabled={busyId === a.id}
                        onClick={() => void act(a.id, 'pause')}
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={cx.secondaryBtn}
                        disabled={busyId === a.id}
                        onClick={() => void act(a.id, 'resume')}
                      >
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      className={cx.secondaryBtn}
                      disabled={busyId === a.id}
                      onClick={() => void act(a.id, 'delete')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === 'history' && !loading ? (
        <ul className="space-y-2">
          {!history.length ? (
            <li className={cn(cx.card, 'p-5 text-sm text-slate-600')}>No trigger history yet.</li>
          ) : (
            history.map((h) => (
              <li
                key={h.id}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200"
              >
                <span className="font-semibold text-[#0b1f3a]">
                  {h.alert?.material?.name ?? 'Material'}
                  {h.alert?.location ? ` · ${h.alert.location.name}` : ''}
                </span>
                {' · '}
                {money(h.observedPrice)}
                {h.changePercent != null ? ` · ${h.changePercent}%` : ''}
                {' · '}
                {new Date(h.triggeredAt).toLocaleString('en-IN')}
                {h.suppressed ? (
                  <span className="ml-2 text-amber-800">
                    (suppressed{h.suppressReason ? `: ${h.suppressReason}` : ''})
                  </span>
                ) : (
                  <span className="ml-2 text-emerald-700">(notified)</span>
                )}
              </li>
            ))
          )}
        </ul>
      ) : null}

      <p className="text-sm text-slate-600">
        <Link href="/notifications" className="font-semibold text-[#f97316]">
          Notification inbox
        </Link>
        {' · '}
        <Link href="/construction/prices" className="font-semibold text-[#f97316]">
          Prices hub
        </Link>
        {' · '}
        <Link href="/construction/fair-price-checker" className="font-semibold text-[#f97316]">
          Fair Price Checker
        </Link>
      </p>
    </div>
  );
}
