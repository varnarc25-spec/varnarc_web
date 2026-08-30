'use client';

import { useEffect, useState } from 'react';
import { buildConstructionShareUrl, constructionToolLabel } from '@varnarc/validation';
import { useConstructionSavePayload } from '@/lib/construction/save-calculation/store';
import { trackCalculationShared } from '@/lib/construction/analytics';
import { cn, cx } from '@/components/construction/styles';

/**
 * Native share / copy-link for public calculation state (`?s=`).
 * Encodes allowlisted inputs only — never project IDs or identity.
 */
export function CalculatorShareSlot() {
  const payload = useConstructionSavePayload();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(null);
  }, [payload?.calculatorSlug, payload?.normalizedInputs, payload?.inputs]);

  if (!payload?.calculatorSlug) return null;

  async function onShare() {
    if (!payload) return;
    setBusy(true);
    setStatus(null);
    try {
      const inputs = payload.normalizedInputs ?? payload.inputs;
      const path =
        payload.sourcePath || (typeof window !== 'undefined' ? window.location.pathname : '');
      const built = buildConstructionShareUrl({
        pathname: path,
        calculatorSlug: payload.calculatorSlug,
        inputs,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      });
      if (!built.ok) {
        setStatus(built.error);
        return;
      }

      // Keep the address bar in sync with the shareable public state (no private IDs).
      if (typeof window !== 'undefined') {
        const next = `${window.location.pathname}?s=${built.encoded}`;
        window.history.replaceState({}, '', next);
      }

      const title = constructionToolLabel(payload.calculatorSlug);
      const text = `Varnarc ${title} — shared calculation`;

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, text, url: built.url });
          trackCalculationShared({
            calculator_type: payload.calculatorSlug,
            logged_in: false,
          });
          setStatus('Shared.');
          return;
        } catch (err) {
          // User cancel — fall through to clipboard
          if (err instanceof DOMException && err.name === 'AbortError') {
            setStatus(null);
            return;
          }
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(built.url);
        trackCalculationShared({
          calculator_type: payload.calculatorSlug,
          logged_in: false,
        });
        setStatus('Link copied. Anyone with the link can reproduce this calculation.');
        return;
      }

      setStatus(built.url);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Share failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(cx.card, 'space-y-2 p-4 sm:p-5 print:hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#0b1f3a]">Share calculation</h3>
          <p className="mt-1 text-xs text-slate-500">
            Copies a public link with safe inputs only — no account or project data.
          </p>
        </div>
        <button
          type="button"
          className={cx.secondaryBtn}
          disabled={busy}
          onClick={() => void onShare()}
        >
          {busy ? 'Preparing…' : 'Copy link / Share'}
        </button>
      </div>
      {status ? <p className="text-xs text-slate-600 break-all">{status}</p> : null}
    </div>
  );
}
