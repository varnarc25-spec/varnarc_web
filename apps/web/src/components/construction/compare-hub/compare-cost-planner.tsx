'use client';

import { useMemo, useState } from 'react';
import { calculatePairCost, type CompareCostModel } from '@/lib/construction/compare-hub/catalog';
import { cn, cx } from '@/components/construction/styles';

function money(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function CompareCostPlanner({
  leftName,
  rightName,
  model,
}: {
  leftName: string;
  rightName: string;
  model: CompareCostModel;
}) {
  const [quantity, setQuantity] = useState(String(model.defaultQuantity));
  const [leftRate, setLeftRate] = useState(String(model.left.defaultRateInr));
  const [rightRate, setRightRate] = useState(String(model.right.defaultRateInr));

  const result = useMemo(() => {
    return calculatePairCost({
      quantity: Number(quantity),
      leftRate: Number(leftRate),
      rightRate: Number(rightRate),
      leftUnitsPerQuantity: model.left.unitsPerQuantity,
      rightUnitsPerQuantity: model.right.unitsPerQuantity,
    });
  }, [quantity, leftRate, rightRate, model.left.unitsPerQuantity, model.right.unitsPerQuantity]);

  return (
    <div className={cn(cx.card, 'space-y-4 p-4 sm:p-5')}>
      <div>
        <h3 className="text-base font-bold text-[#0b1f3a]">Project cost planner</h3>
        <p className="mt-1 text-sm text-slate-600">
          Scale indicative unit rates by your area or quantity. This is not a quote — edit rates to
          match local dealer prices.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className={cx.label}>{model.quantityLabel}</span>
          <input
            className={cx.input}
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className={cx.label}>{model.left.rateLabel}</span>
          <input
            className={cx.input}
            type="number"
            min={0}
            step="any"
            value={leftRate}
            onChange={(e) => setLeftRate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className={cx.label}>{model.right.rateLabel}</span>
          <input
            className={cx.input}
            type="number"
            min={0}
            step="any"
            value={rightRate}
            onChange={(e) => setRightRate(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{leftName}</p>
          <p className="mt-1 text-sm text-slate-600">
            ≈ {result.leftUnits.toLocaleString('en-IN')} {model.left.unitNoun}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0b1f3a]">
            {money(result.leftTotal)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {rightName}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            ≈ {result.rightUnits.toLocaleString('en-IN')} {model.right.unitNoun}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0b1f3a]">
            {money(result.rightTotal)}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-700">
        {result.cheaper === 'tie' ? (
          <>At these rates, material totals are effectively similar.</>
        ) : (
          <>
            At these rates,{' '}
            <span className="font-semibold text-[#0b1f3a]">
              {result.cheaper === 'left' ? leftName : rightName}
            </span>{' '}
            unit purchase totals less by {money(Math.abs(result.delta))}. Labour, adhesive/mortar,
            plaster and wastage can reverse that — treat this as one line in a fuller BOQ.
          </>
        )}
      </p>
      <p className="text-xs text-slate-500">{model.notes}</p>
    </div>
  );
}
