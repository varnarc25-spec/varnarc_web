'use client';

import { useMemo, useState } from 'react';

export type FormulaField = {
  key: string;
  label: string;
  defaultValue: number;
};

export type FormulaToolConfig = {
  fields: FormulaField[];
  compute: (values: Record<string, number>) => Array<{ label: string; value: string }>;
};

function inr(n: number) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export const AUTOMOBILE_FORMULA_TOOLS: Record<string, FormulaToolConfig> = {
  tco: {
    fields: [
      { key: 'purchasePrice', label: 'Purchase price (₹)', defaultValue: 1200000 },
      { key: 'years', label: 'Ownership years', defaultValue: 5 },
      { key: 'emiAnnual', label: 'Annual EMI paid (₹)', defaultValue: 180000 },
      { key: 'fuelAnnual', label: 'Annual fuel / charging (₹)', defaultValue: 72000 },
      { key: 'insuranceAnnual', label: 'Annual insurance (₹)', defaultValue: 18000 },
      { key: 'serviceAnnual', label: 'Annual service (₹)', defaultValue: 12000 },
      { key: 'resale', label: 'Expected resale (₹)', defaultValue: 550000 },
    ],
    compute: (v) => {
      const years = Math.max(v.years, 0.1);
      const spent =
        v.purchasePrice +
        (v.emiAnnual + v.fuelAnnual + v.insuranceAnnual + v.serviceAnnual) * years;
      const tco = spent - v.resale;
      return [
        { label: 'Indicative TCO', value: inr(tco) },
        { label: 'Cost per year', value: inr(tco / years) },
      ];
    },
  },
  'road-tax': {
    fields: [
      { key: 'exShowroom', label: 'Ex-showroom (₹)', defaultValue: 1000000 },
      { key: 'rate', label: 'State tax rate (%)', defaultValue: 10 },
    ],
    compute: (v) => [{ label: 'Indicative road tax', value: inr(v.exShowroom * (v.rate / 100)) }],
  },
  'on-road-price': {
    fields: [
      { key: 'exShowroom', label: 'Ex-showroom (₹)', defaultValue: 1000000 },
      { key: 'rto', label: 'RTO / road tax (₹)', defaultValue: 100000 },
      { key: 'insurance', label: 'Insurance (₹)', defaultValue: 35000 },
      { key: 'handling', label: 'Handling / extras (₹)', defaultValue: 15000 },
    ],
    compute: (v) => [
      {
        label: 'Indicative on-road',
        value: inr(v.exShowroom + v.rto + v.insurance + v.handling),
      },
    ],
  },
  'charging-cost': {
    fields: [
      { key: 'km', label: 'Monthly km', defaultValue: 1000 },
      { key: 'kwhPer100', label: 'kWh / 100 km', defaultValue: 15 },
      { key: 'tariff', label: 'Tariff (₹ / kWh)', defaultValue: 8 },
    ],
    compute: (v) => {
      const kwh = (v.km / 100) * v.kwhPer100;
      return [
        { label: 'Monthly energy', value: `${kwh.toFixed(1)} kWh` },
        { label: 'Monthly cost', value: inr(kwh * v.tariff) },
      ];
    },
  },
  range: {
    fields: [
      { key: 'battery', label: 'Usable battery (kWh)', defaultValue: 40 },
      { key: 'kwhPer100', label: 'kWh / 100 km', defaultValue: 15 },
    ],
    compute: (v) => {
      const km = v.kwhPer100 > 0 ? (v.battery / v.kwhPer100) * 100 : 0;
      return [{ label: 'Indicative range', value: `${km.toFixed(0)} km` }];
    },
  },
  'ev-vs-petrol': {
    fields: [
      { key: 'km', label: 'Monthly km', defaultValue: 1000 },
      { key: 'mileage', label: 'Petrol mileage (km/l)', defaultValue: 15 },
      { key: 'petrol', label: 'Petrol price (₹/l)', defaultValue: 105 },
      { key: 'kwhPer100', label: 'EV kWh / 100 km', defaultValue: 15 },
      { key: 'tariff', label: 'Electricity (₹/kWh)', defaultValue: 8 },
    ],
    compute: (v) => {
      const petrolCost = v.mileage > 0 ? (v.km / v.mileage) * v.petrol : 0;
      const evCost = (v.km / 100) * v.kwhPer100 * v.tariff;
      return [
        { label: 'Petrol / month', value: inr(petrolCost) },
        { label: 'EV / month', value: inr(evCost) },
        { label: 'Difference', value: inr(petrolCost - evCost) },
      ];
    },
  },
  'resale-value': {
    fields: [
      { key: 'purchasePrice', label: 'Purchase price (₹)', defaultValue: 1200000 },
      { key: 'rate', label: 'Annual depreciation (%)', defaultValue: 15 },
      { key: 'years', label: 'Years owned', defaultValue: 5 },
    ],
    compute: (v) => {
      const remaining = v.purchasePrice * Math.pow(1 - v.rate / 100, Math.max(v.years, 0));
      return [
        { label: 'Indicative resale', value: inr(remaining) },
        { label: 'Value lost', value: inr(v.purchasePrice - remaining) },
      ];
    },
  },
};

export function AutomobileFormulaTool({ slug }: { slug: string }) {
  const config = AUTOMOBILE_FORMULA_TOOLS[slug];
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((config?.fields ?? []).map((f) => [f.key, f.defaultValue])),
  );

  const results = useMemo(() => (config ? config.compute(values) : []), [config, values]);

  if (!config) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        {config.fields.map((field) => (
          <label key={field.key} className="block text-sm font-medium text-slate-700">
            {field.label}
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0b1f3a]"
              value={Number.isFinite(values[field.key]) ? values[field.key] : ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))
              }
            />
          </label>
        ))}
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {results.map((row) => (
          <li
            key={row.label}
            className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {row.label}
            </span>
            <span className="text-base font-extrabold text-[#0b1f3a]">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">
        Educational estimate only — not a quote from a dealer, RTO or energy provider.
      </p>
    </div>
  );
}
