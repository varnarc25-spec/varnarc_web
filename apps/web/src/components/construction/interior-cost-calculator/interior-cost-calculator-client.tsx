'use client';

import { useMemo, useState } from 'react';
import {
  INTERIOR_CALC_VERSION,
  DEFAULT_CONSTRUCTION_LOCATION_NAME,
  calculateInteriorCost,
  type InteriorCostResult,
  type InteriorQuality,
} from '@varnarc/validation';
import {
  CalculationBreakdown,
  CalculationResult,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRateAttribution } from '@/components/construction/rate-attribution';
import { cn, cx } from '@/components/construction/styles';
import { trackInteriorEstimateCompleted } from '@/lib/construction/analytics';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type FormState = {
  location: string;
  homeType: 'apartment' | 'independent_house' | 'villa' | 'duplex';
  builtUpArea: string;
  quality: InteriorQuality;
  rooms: string;
  kitchenRunningFt: string;
  wardrobeSqft: string;
  includeFalseCeiling: boolean;
  contingencyPercent: string;
};

const DEFAULT_FORM: FormState = {
  location: DEFAULT_CONSTRUCTION_LOCATION_NAME,
  homeType: 'apartment',
  builtUpArea: '1200',
  quality: 'standard',
  rooms: '3',
  kitchenRunningFt: '12',
  wardrobeSqft: '40',
  includeFalseCeiling: true,
  contingencyPercent: '10',
};

export function InteriorCostCalculatorClient({
  initialParams,
}: {
  initialParams?: Record<string, string | undefined>;
  isAuthenticated?: boolean;
}) {
  const [form, setForm] = useState<FormState>({
    ...DEFAULT_FORM,
    location: initialParams?.location ?? DEFAULT_FORM.location,
    builtUpArea: initialParams?.builtUpArea ?? DEFAULT_FORM.builtUpArea,
  });
  const [result, setResult] = useState<InteriorCostResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!result) return [];
    return result.lines.map((line) => ({
      id: line.id,
      label: line.label,
      value: `${formatInr(line.amount)} · ${line.publicLabel}`,
    }));
  }, [result]);

  return (
    <CalculatorShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Interior cost calculator' },
      ]}
      title="Interior design cost calculator"
      description="Kitchen, wardrobes, rooms, ceiling, lighting and painting using indicative planning rates — not live dealer prices."
      lastUpdated="Sep 2026"
      form={
        <CalculatorForm
          calculatorType="interior_cost"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              setError(null);
              setResult(
                calculateInteriorCost({
                  location: form.location,
                  homeType: form.homeType,
                  builtUpArea: Number(form.builtUpArea),
                  quality: form.quality,
                  rooms: Number(form.rooms),
                  kitchenRunningFt: Number(form.kitchenRunningFt),
                  wardrobeSqft: Number(form.wardrobeSqft),
                  includeFalseCeiling: form.includeFalseCeiling,
                  contingencyPercent: Number(form.contingencyPercent),
                }),
              );
              trackInteriorEstimateCompleted({ path: '/construction/interior-cost-calculator' });
            } catch (err) {
              setResult(null);
              setError(err instanceof Error ? err.message : 'Could not calculate.');
            }
          }}
          onReset={() => {
            setForm(DEFAULT_FORM);
            setResult(null);
            setError(null);
          }}
          submitLabel="Estimate interiors"
        >
          <CalculatorInput
            id="location"
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="sm:col-span-2"
          />
          <CalculatorSelect
            id="homeType"
            label="Home type"
            value={form.homeType}
            onChange={(e) =>
              setForm({ ...form, homeType: e.target.value as FormState['homeType'] })
            }
            options={[
              { value: 'apartment', label: 'Apartment' },
              { value: 'independent_house', label: 'Independent house' },
              { value: 'villa', label: 'Villa' },
              { value: 'duplex', label: 'Duplex' },
            ]}
          />
          <CalculatorSelect
            id="quality"
            label="Interior quality"
            value={form.quality}
            onChange={(e) => setForm({ ...form, quality: e.target.value as InteriorQuality })}
            options={[
              { value: 'economy', label: 'Economy' },
              { value: 'standard', label: 'Standard' },
              { value: 'premium', label: 'Premium' },
              { value: 'luxury', label: 'Luxury' },
            ]}
          />
          <CalculatorInput
            id="builtUpArea"
            label="Built-up area (sq ft)"
            type="number"
            value={form.builtUpArea}
            onChange={(e) => setForm({ ...form, builtUpArea: e.target.value })}
          />
          <CalculatorInput
            id="rooms"
            label="Rooms"
            type="number"
            value={form.rooms}
            onChange={(e) => setForm({ ...form, rooms: e.target.value })}
          />
          <CalculatorInput
            id="kitchenRunningFt"
            label="Kitchen running ft"
            type="number"
            value={form.kitchenRunningFt}
            onChange={(e) => setForm({ ...form, kitchenRunningFt: e.target.value })}
          />
          <CalculatorInput
            id="wardrobeSqft"
            label="Wardrobe sq ft"
            type="number"
            value={form.wardrobeSqft}
            onChange={(e) => setForm({ ...form, wardrobeSqft: e.target.value })}
          />
          <CalculatorInput
            id="contingencyPercent"
            label="Contingency %"
            type="number"
            value={form.contingencyPercent}
            onChange={(e) => setForm({ ...form, contingencyPercent: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.includeFalseCeiling}
              onChange={(e) => setForm({ ...form, includeFalseCeiling: e.target.checked })}
            />
            Include false ceiling
          </label>
        </CalculatorForm>
      }
      result={
        result ? (
          <div className="space-y-4">
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <ConstructionRateAttribution display={result.rateDisplay} />
            <CalculationResult
              label="Estimated interior cost"
              value={formatInr(result.total.expected)}
              hint={`Range ${formatInr(result.total.low)} – ${formatInr(result.total.high)}. ${result.qualification}`}
              metrics={[
                { id: 'sub', label: 'Subtotal', value: formatInr(result.subtotal) },
                { id: 'cont', label: 'Contingency', value: formatInr(result.contingency) },
                { id: 'lab', label: 'Installation labour', value: formatInr(result.labour) },
                { id: 'fee', label: 'Design fee', value: formatInr(result.designFee) },
              ]}
            />
            <CalculationBreakdown title="Component breakdown" rows={rows} />
            <p className={cn(cx.card, 'p-4 text-xs text-slate-600')}>
              Version {INTERIOR_CALC_VERSION}. Every line is an indicative planning rate
              (ESTIMATED_FALLBACK), not a live market or official SOR price.
            </p>
            <MethodologyPanel
              title="How this estimate is built"
              formula="Kitchen + wardrobes + rooms + ceiling + lighting + paint + furniture + labour + design + contingency"
              steps={result.assumptions}
            />
          </div>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : undefined
      }
    />
  );
}
