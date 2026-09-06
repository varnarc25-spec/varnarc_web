'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import {
  builderCompareHref,
  comparableOptions,
  comparisonPreview,
  type BuilderCategory,
  type CompareCategoryKey,
} from '@/lib/compare-hub';
import {
  addRecentComparison,
  parseRecentComparisons,
  RECENT_COMPARISONS_KEY,
} from '@/lib/recent-comparisons';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

const selectClass =
  'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30';

export function CompareBuilder({ catalogs }: { catalogs: BuilderCategory[] }) {
  const router = useRouter();
  const [categoryKey, setCategoryKey] = useState<CompareCategoryKey>(catalogs[0]?.key ?? 'cars');
  const catalog = catalogs.find((item) => item.key === categoryKey) ?? catalogs[0];
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  const selectedA = catalog?.options.find((item) => item.id === optionA);
  const selectedB = catalog?.options.find((item) => item.id === optionB);
  const optionsB = useMemo(
    () => (catalog ? comparableOptions(catalog.options, optionA) : []),
    [catalog, optionA],
  );
  const preview = useMemo(() => comparisonPreview(selectedA, selectedB), [selectedA, selectedB]);

  const canCompare = Boolean(catalog && optionA && optionB && optionA !== optionB && selectedA);

  function onCategoryChange(next: CompareCategoryKey) {
    setCategoryKey(next);
    setOptionA('');
    setOptionB('');
    track('compare_category_selected', next);
  }

  function onOptionAChange(next: string) {
    setOptionA(next);
    setOptionB('');
    if (next) track('compare_option_a_selected', catalog?.key);
  }

  function onOptionBChange(next: string) {
    setOptionB(next);
    if (next) {
      track('compare_option_b_selected', catalog?.key);
      track('compare_preview_shown', catalog?.key);
    }
  }

  function submit() {
    if (!catalog || !canCompare || !selectedA || !selectedB) return;
    const href = builderCompareHref(catalog.key, optionA, optionB, selectedA.group);
    try {
      const current = parseRecentComparisons(localStorage.getItem(RECENT_COMPARISONS_KEY));
      localStorage.setItem(
        RECENT_COMPARISONS_KEY,
        JSON.stringify(
          addRecentComparison(current, {
            href,
            optionA: selectedA.label,
            optionB: selectedB.label,
            category: catalog.key,
            viewedAt: new Date().toISOString(),
          }),
        ),
      );
    } catch {
      // Comparing remains available when storage is blocked.
    }
    track('comparison_started', catalog.key);
    router.push(href);
  }

  function track(eventName: string, category?: CompareCategoryKey) {
    trackAnalyticsEvent({
      eventType: 'custom',
      entityType: 'comparison',
      metadata: { eventName, category },
    });
  }

  if (!catalogs.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Start a comparison</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose a category and select two comparable options to view side by side.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto_minmax(0,1.1fr)] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Step 1</p>
          <label htmlFor="compare-category" className="text-sm font-semibold text-slate-800">
            Category
          </label>
          <select
            id="compare-category"
            className={selectClass}
            value={catalog?.key}
            onChange={(e) => onCategoryChange(e.target.value as CompareCategoryKey)}
          >
            {catalogs.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Step 2</p>
          <label htmlFor="compare-option-a" className="text-sm font-semibold text-slate-800">
            Option A
          </label>
          <select
            id="compare-option-a"
            className={selectClass}
            value={optionA}
            onChange={(e) => onOptionAChange(e.target.value)}
          >
            <option value="">Select an option</option>
            {catalog?.options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <p className="sr-only">versus</p>
        <p
          className="hidden text-center text-sm font-extrabold text-slate-400 lg:block lg:pb-3"
          aria-hidden
        >
          VS
        </p>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Step 3</p>
          <label htmlFor="compare-option-b" className="text-sm font-semibold text-slate-800">
            Option B
          </label>
          <select
            id="compare-option-b"
            className={selectClass}
            value={optionB}
            onChange={(e) => onOptionBChange(e.target.value)}
            disabled={!optionA}
          >
            <option value="">{optionA ? 'Select an option' : 'Choose option A first'}</option>
            {optionsB.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-slate-500">{catalog?.hint}</p>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Step 4</p>
        <button
          type="button"
          onClick={submit}
          disabled={!canCompare}
          className="mt-1.5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Compare <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {selectedA && selectedB ? (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Instant comparison preview
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-950">
            {selectedA.label} <span className="text-slate-400">vs</span> {selectedB.label}
          </h3>
          {preview.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">
                  Preview comparing {selectedA.label} and {selectedB.label}
                </caption>
                <thead>
                  <tr className="text-slate-600">
                    <th scope="col" className="py-2 pr-4">
                      Attribute
                    </th>
                    <th scope="col" className="px-4 py-2">
                      {selectedA.label}
                    </th>
                    <th scope="col" className="px-4 py-2">
                      {selectedB.label}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.label} className="border-t border-blue-100">
                      <th scope="row" className="py-2.5 pr-4 font-semibold text-slate-700">
                        {row.label}
                      </th>
                      <td className="px-4 py-2.5 text-slate-700">{row.optionA}</td>
                      <td className="px-4 py-2.5 text-slate-700">{row.optionB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Open the full comparison to review the available verified attributes.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
            >
              View full comparison <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionA('');
                setOptionB('');
              }}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
