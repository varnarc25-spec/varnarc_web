'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { calculateMaterialQuantities } from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';

export function ConstructionMaterialQuantityCompact() {
  const [area, setArea] = useState('1500');
  const [floors, setFloors] = useState('2');
  const [quality, setQuality] = useState<'basic' | 'standard' | 'premium'>('standard');

  const preview = useMemo(() => {
    try {
      const result = calculateMaterialQuantities({
        builtUpArea: Number(area),
        areaUnit: 'sqft',
        floors: Number(floors),
        quality,
        location: 'India',
        wastagePercent: 5,
      });
      return { lines: result.lines.slice(0, 6), error: null as string | null };
    } catch (err) {
      return {
        lines: null,
        error: err instanceof Error ? err.message : 'Enter a valid area.',
      };
    }
  }, [area, floors, quality]);

  return (
    <ConstructionSection
      id="material-quantities"
      title="Material quantities"
      description="Indicative cement, steel, sand and more from built-up area."
      action={{ href: '/construction/material-calculator', label: 'Full calculator →' }}
    >
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className={cx.label}>Built-up area (sq ft)</span>
            <input
              className={cx.input}
              inputMode="decimal"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className={cx.label}>Floors</span>
            <input
              className={cx.input}
              inputMode="numeric"
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className={cx.label}>Quality</span>
            <select
              className={cx.input}
              value={quality}
              onChange={(e) => setQuality(e.target.value as typeof quality)}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>
        {preview.error ? <p className={cn(cx.error, 'mt-2')}>{preview.error}</p> : null}
        {preview.lines ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {preview.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 text-sm last:border-b-0"
              >
                <span className="text-slate-600">{line.label}</span>
                <span className="font-semibold tabular-nums text-[#0b1f3a]">
                  {line.quantity.toLocaleString('en-IN', {
                    maximumFractionDigits: line.unit === 'tonnes' ? 1 : 0,
                  })}{' '}
                  {line.unit}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs text-slate-500">
          Indicative estimate. Verify quantities and local rates with your engineer, contractor or
          supplier.
        </p>
        <Link
          href="/construction/material-calculator"
          className={cn(cx.accentBtn, 'mt-4 w-full sm:w-auto')}
        >
          Open material calculator
        </Link>
      </div>
    </ConstructionSection>
  );
}
