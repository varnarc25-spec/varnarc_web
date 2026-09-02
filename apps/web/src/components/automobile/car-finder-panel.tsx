'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Dialog, Input, Label } from '@varnarc/ui';
import { trackAutomobileEvent } from '@/lib/automobile/analytics';
import { fetchAutomobileManufacturers, type AutomobileManufacturer } from '@/services/automobile';

const BODY = ['', 'SUV', 'Hatchback', 'Sedan', 'MUV'];
const FUEL = ['', 'Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANS = ['', 'Manual', 'automatic'];
const BUDGETS = [
  { label: 'Any', value: '' },
  { label: 'Under ₹5L', value: '500000' },
  { label: 'Under ₹10L', value: '1000000' },
  { label: 'Under ₹15L', value: '1500000' },
  { label: 'Under ₹20L', value: '2000000' },
  { label: 'Under ₹30L', value: '3000000' },
];

export function AutomobileCarFinderPanel({
  manufacturers: initialMfrs = [],
}: {
  manufacturers?: AutomobileManufacturer[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [mfrs, setMfrs] = useState(initialMfrs);

  useEffect(() => {
    if (initialMfrs.length) return;
    void fetchAutomobileManufacturers({ limit: 80 }).then((res) => setMfrs(res.data ?? []));
  }, [initialMfrs.length]);

  const fields = useMemo(
    () => (
      <>
        <div>
          <Label htmlFor="budget">Budget</Label>
          <select
            id="budget"
            name="maxPrice"
            className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          >
            {BUDGETS.map((b) => (
              <option key={b.label} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <select
            id="brand"
            name="manufacturerSlug"
            className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          >
            <option value="">Any brand</option>
            {mfrs.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="body">Body type</Label>
          <select
            id="body"
            name="bodyType"
            className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          >
            {BODY.map((b) => (
              <option key={b || 'any'} value={b}>
                {b || 'Any'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fuel">Fuel type</Label>
          <select
            id="fuel"
            name="fuelType"
            className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          >
            {FUEL.map((b) => (
              <option key={b || 'any'} value={b}>
                {b || 'Any'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="trans">Transmission</Label>
          <select
            id="trans"
            name="transmission"
            className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm"
          >
            {TRANS.map((b) => (
              <option key={b || 'any'} value={b}>
                {b === 'automatic' ? 'Automatic' : b || 'Any'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="seats">Seats (minimum)</Label>
          <Input id="seats" name="minSeats" type="number" min={2} max={12} className="mt-1 h-11" />
        </div>
      </>
    ),
    [mfrs],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const qs = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      const s = String(v).trim();
      if (s) qs.set(k, s);
    }
    trackAutomobileEvent('vehicle_search', { filters: [...qs.keys()] });
    setOpen(false);
    router.push(`/automobile/vehicles${qs.toString() ? `?${qs}` : ''}`);
  }

  const form = (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields}
      {advanced ? (
        <>
          <div>
            <Label htmlFor="minMileage">Min claimed mileage</Label>
            <Input
              id="minMileage"
              name="minMileage"
              type="number"
              step="0.1"
              className="mt-1 h-11"
            />
          </div>
          <div>
            <Label htmlFor="minSafety">Min safety rating</Label>
            <Input
              id="minSafety"
              name="minSafety"
              type="number"
              min={0}
              max={5}
              step="0.5"
              className="mt-1 h-11"
            />
          </div>
        </>
      ) : null}
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit">Find Cars</Button>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
        <button
          type="button"
          className="min-h-11 text-sm font-medium text-[#ea580c] underline"
          onClick={() => setAdvanced((v) => !v)}
        >
          {advanced ? 'Hide advanced filters' : 'Advanced filters'}
        </button>
      </div>
    </form>
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Find your car</h2>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium md:hidden"
          onClick={() => setOpen(true)}
        >
          Filters
        </button>
      </div>
      <div className="hidden md:block">{form}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <h2 className="mb-4 text-lg font-extrabold">Filters</h2>
        {form}
      </Dialog>
    </section>
  );
}
