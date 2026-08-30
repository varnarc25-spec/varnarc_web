'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Calculator,
  ClipboardList,
  Home,
  Layers,
  PaintBucket,
  Scale,
  MapPin,
  Wrench,
  ArrowRight,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import {
  CONSTRUCTION_INTENT_NAVIGATOR,
  getConstructionIntent,
  isConstructionIntentKey,
  type ConstructionIntentKey,
} from '@/lib/construction/landing';
import { trackIntentCardClicked } from '@/lib/construction/analytics';

const INTENT_ICONS: Record<ConstructionIntentKey, LucideIcon> = {
  build_home: Home,
  renovate: Wrench,
  know_cost: Calculator,
  calculate_materials: PaintBucket,
  create_boq: ClipboardList,
  compare_materials: Scale,
  local_prices: MapPin,
  plan_timeline: Layers,
};

function writeIntentToUrl(pathname: string, intent: ConstructionIntentKey | null) {
  const current = new URLSearchParams(window.location.search);
  current.delete('intent');
  if (intent) current.set('intent', intent);
  const qs = current.toString();
  const next = qs ? `${pathname}?${qs}` : pathname;
  window.history.replaceState(window.history.state, '', next);
}

export function ConstructionIntentNavigator({
  initialIntent = null,
}: {
  initialIntent?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listId = useId();
  const panelId = useId();
  const intentFromUrl = searchParams?.get('intent');
  const resolvedInitial =
    (isConstructionIntentKey(intentFromUrl) && intentFromUrl) ||
    (isConstructionIntentKey(initialIntent) && initialIntent) ||
    null;

  const [selected, setSelected] = useState<ConstructionIntentKey | null>(resolvedInitial);
  const [focusIndex, setFocusIndex] = useState(() => {
    if (!resolvedInitial) return 0;
    const idx = CONSTRUCTION_INTENT_NAVIGATOR.findIndex((i) => i.key === resolvedInitial);
    return idx >= 0 ? idx : 0;
  });
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const active = useMemo(() => getConstructionIntent(selected), [selected]);

  const selectIntent = useCallback(
    (key: ConstructionIntentKey, opts?: { focusPanel?: boolean }) => {
      setSelected(key);
      writeIntentToUrl(pathname || '/construction', key);
      trackIntentCardClicked({
        intent_key: key,
        action: 'select',
        path: `/construction?intent=${key}`,
      });
      if (opts?.focusPanel) {
        requestAnimationFrame(() => {
          document.getElementById(panelId)?.focus();
        });
      }
    },
    [pathname, panelId],
  );

  const clearIntent = useCallback(() => {
    setSelected(null);
    writeIntentToUrl(pathname || '/construction', null);
  }, [pathname]);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const key = params.get('intent');
      if (isConstructionIntentKey(key)) {
        setSelected(key);
        const idx = CONSTRUCTION_INTENT_NAVIGATOR.findIndex((i) => i.key === key);
        if (idx >= 0) setFocusIndex(idx);
      } else {
        setSelected(null);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function onIntentKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = CONSTRUCTION_INTENT_NAVIGATOR.length;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (index + 1) % count;
      setFocusIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = (index - 1 + count) % count;
      setFocusIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setFocusIndex(0);
      optionRefs.current[0]?.focus();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setFocusIndex(count - 1);
      optionRefs.current[count - 1]?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const intent = CONSTRUCTION_INTENT_NAVIGATOR[index];
      if (intent) selectIntent(intent.key, { focusPanel: true });
      return;
    }
    if (event.key === 'Escape' && selected) {
      event.preventDefault();
      clearIntent();
    }
  }

  const activeDescendant = selected
    ? `${listId}-${selected}`
    : `${listId}-${CONSTRUCTION_INTENT_NAVIGATOR[focusIndex]?.key ?? 'build_home'}`;

  return (
    <ConstructionSection
      id="intent-navigator"
      title="What are you planning?"
      description="Choose an intent to see the most useful next steps — not a generic directory."
    >
      <div
        role="listbox"
        aria-label="Construction planning intents"
        aria-orientation="horizontal"
        aria-activedescendant={activeDescendant}
        className={cn(
          // Mobile: horizontal scroll strip
          'flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]',
          // Desktop: wrapping card grid
          'lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:pb-0',
        )}
      >
        {CONSTRUCTION_INTENT_NAVIGATOR.map((intent, index) => {
          const Icon = INTENT_ICONS[intent.key];
          const isSelected = selected === intent.key;
          return (
            <button
              key={intent.key}
              id={`${listId}-${intent.key}`}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              tabIndex={focusIndex === index ? 0 : -1}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={(e) => onIntentKeyDown(e, index)}
              onClick={() => selectIntent(intent.key, { focusPanel: true })}
              className={cn(
                cx.focus,
                // Mobile chip
                'shrink-0 rounded-full border px-4 py-2.5 text-left text-sm font-semibold transition',
                isSelected
                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                  : 'border-slate-200 bg-white text-[#0b1f3a] hover:border-[#f97316]',
                // Desktop card
                'lg:flex lg:h-full lg:shrink lg:flex-col lg:rounded-xl lg:p-4 lg:ring-1 lg:ring-slate-200/80',
                isSelected
                  ? 'lg:bg-white lg:text-[#0b1f3a] lg:ring-2 lg:ring-[#f97316] lg:ring-offset-2'
                  : 'lg:hover:ring-[#f97316]/45',
              )}
            >
              <span className="hidden lg:flex">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected ? 'bg-[#0b1f3a] text-white' : 'bg-[#e8eef5] text-[#f97316]',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </span>
              <span className="lg:mt-3 lg:block lg:text-sm lg:font-bold">
                <span className="lg:hidden">{intent.shortTitle}</span>
                <span className="hidden lg:inline">{intent.title}</span>
              </span>
              <span className="mt-1.5 hidden text-xs font-normal leading-relaxed text-slate-600 lg:block">
                {intent.description}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        tabIndex={-1}
        role="region"
        aria-live="polite"
        aria-label={
          active ? `Next steps for ${active.title}` : 'Select an intent to see next steps'
        }
        className={cn(
          'mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5',
          'outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2',
        )}
      >
        {active ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                  Next actions
                </p>
                <h3 className="mt-1 text-base font-extrabold text-[#0b1f3a]">{active.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{active.description}</p>
              </div>
              <button
                type="button"
                onClick={clearIntent}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    clearIntent();
                    optionRefs.current[focusIndex]?.focus();
                  }
                }}
                className={cn(cx.secondaryBtn, 'min-h-10 gap-1.5 px-3 text-xs')}
                aria-label="Clear intent selection"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Clear
              </button>
            </div>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {active.nextActions.map((action) => (
                <li key={action.key}>
                  <Link
                    href={action.href}
                    onClick={() => {
                      trackIntentCardClicked({
                        intent_key: active.key,
                        action: 'next_action',
                        next_action_key: action.key,
                        path: action.href,
                      });
                    }}
                    className={cn(
                      'group flex h-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3',
                      'transition hover:border-[#f97316]',
                      cx.focus,
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e8eef5] text-[#0b1f3a] transition group-hover:bg-[#0b1f3a] group-hover:text-white">
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#0b1f3a]">{action.label}</span>
                      {action.description ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                          {action.description}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Select what you are planning above. We will show the most relevant tools and next steps
            for that path.
          </p>
        )}
      </div>
    </ConstructionSection>
  );
}

/** Back-compat alias used by landing page imports */
export { ConstructionIntentNavigator as ConstructionIntentCards };
