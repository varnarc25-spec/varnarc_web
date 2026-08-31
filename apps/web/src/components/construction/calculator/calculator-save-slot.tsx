'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  clearPendingConstructionSave,
  flushPendingConstructionSave,
  loginUrlForSave,
  readPendingConstructionSave,
  stashPendingConstructionSave,
  useConstructionSavePayload,
  type ConstructionSavePayload,
} from '@/lib/construction/save-calculation/store';
import { cn, cx } from '@/components/construction/styles';

/**
 * Universal Save Calculation control.
 * Mounted from CalculatorShell — calculators publish payloads via setConstructionSavePayload.
 */
export function CalculatorSaveSlot() {
  const payload = useConstructionSavePayload();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setName(payload?.name ?? '');
    setStatus(null);
  }, [payload]);

  useEffect(() => {
    let cancelled = false;
    // Allow calculator clients to restore form state from pending first.
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!readPendingConstructionSave()) return;
        const result = await flushPendingConstructionSave();
        if (cancelled) return;
        if (result.ok) {
          setStatus('Saved after sign-in. View in Saved calculations.');
        } else if (result.error && result.error !== 'nothing_pending') {
          setStatus(result.error);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!payload) return null;

  async function onSave() {
    if (!payload) return;
    setLoading(true);
    setStatus(null);
    const body: ConstructionSavePayload = {
      ...payload,
      name: name.trim() || payload.name || null,
      sourcePath:
        payload.sourcePath ?? (typeof window !== 'undefined' ? window.location.pathname : null),
    };
    try {
      const res = await fetch('/api/construction/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        stashPendingConstructionSave(body);
        const returnTo =
          body.sourcePath ||
          (typeof window !== 'undefined' ? window.location.pathname : '/construction');
        window.location.href = loginUrlForSave(returnTo);
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? 'Save failed');
      }
      clearPendingConstructionSave();
      setStatus('Saved. Open Saved calculations to rename, duplicate or recalculate.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn(cx.card, 'space-y-3 border-[#0b1f3a]/15 p-4 sm:p-5 print:hidden')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Save calculation</h3>
          <p className="mt-1 text-xs text-slate-500">
            Stores calculator type, inputs, result, assumptions and methodology version. Sign in
            required — your current inputs are preserved through login.
          </p>
        </div>
        <Link
          href="/construction/saved-calculations"
          className="text-xs font-semibold text-[#f97316]"
        >
          Saved list →
        </Link>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className={cx.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this save"
          aria-label="Save name"
        />
        <button
          type="button"
          className={cx.primaryBtn}
          disabled={loading}
          onClick={() => void onSave()}
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
      {status ? <p className="text-xs text-slate-600">{status}</p> : null}
    </div>
  );
}
