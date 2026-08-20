'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import {
  builderCompareHref,
  type BuilderCategory,
  type CompareCategoryKey,
} from '@/lib/compare-hub';

const selectClass =
  'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30';

export function CompareBuilder({ catalogs }: { catalogs: BuilderCategory[] }) {
  const router = useRouter();
  const [categoryKey, setCategoryKey] = useState<CompareCategoryKey>(catalogs[0]?.key ?? 'cars');
  const catalog = catalogs.find((item) => item.key === categoryKey) ?? catalogs[0];
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  const selectedA = catalog?.options.find((item) => item.id === optionA);
  const optionsB = useMemo(() => {
    if (!catalog) return [];
    return catalog.options.filter((item) => {
      if (item.id === optionA) return false;
      if (selectedA) return item.group === selectedA.group;
      return true;
    });
  }, [catalog, optionA, selectedA]);

  const canCompare = Boolean(catalog && optionA && optionB && optionA !== optionB && selectedA);

  function onCategoryChange(next: CompareCategoryKey) {
    setCategoryKey(next);
    setOptionA('');
    setOptionB('');
  }

  function onOptionAChange(next: string) {
    setOptionA(next);
    setOptionB('');
  }

  function submit() {
    if (!catalog || !canCompare || !selectedA) return;
    router.push(builderCompareHref(catalog.key, optionA, optionB, selectedA.group));
  }

  if (!catalogs.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Start a comparison</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose a category and select two comparable options to view side by side.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto_minmax(0,1.1fr)_auto] lg:items-end">
        <div>
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

        <p className="hidden text-center text-sm font-extrabold text-slate-400 lg:block lg:pb-3">
          VS
        </p>

        <div>
          <label htmlFor="compare-option-b" className="text-sm font-semibold text-slate-800">
            Option B
          </label>
          <select
            id="compare-option-b"
            className={selectClass}
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
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

        <button
          type="button"
          onClick={submit}
          disabled={!canCompare}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Compare now <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <p className="mt-3 text-[13px] text-slate-500">{catalog?.hint}</p>
    </section>
  );
}
