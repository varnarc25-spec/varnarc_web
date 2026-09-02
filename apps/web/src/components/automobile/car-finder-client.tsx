'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Input, Label } from '@varnarc/ui';
import {
  scoreAutomobileRecommendation,
  type AutomobileRecommenderInput,
} from '@varnarc/validation';
import { ContentLayout } from '@/components/layout/content-layout';
import { trackAutomobileEvent } from '@/lib/automobile/analytics';
import { fetchAutomobileModels, type AutomobileModelSummary } from '@/services/automobile';

export function AutomobileCarFinderClient() {
  const [results, setResults] = useState<
    Array<{ model: AutomobileModelSummary; score: number; reasons: string[] }>
  >([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: AutomobileRecommenderInput = {
      budgetMax: Number(fd.get('budgetMax') || 0) || undefined,
      usage: (String(fd.get('usage') || 'mixed') as AutomobileRecommenderInput['usage']) || 'mixed',
      familySize: Number(fd.get('familySize') || 0) || undefined,
      fuel: String(fd.get('fuel') || '') || undefined,
      transmission: String(fd.get('transmission') || '') || undefined,
      priorities: String(fd.get('priority') || '')
        ? [
            String(fd.get('priority')) as NonNullable<
              AutomobileRecommenderInput['priorities']
            >[number],
          ]
        : [],
    };
    trackAutomobileEvent('car_finder_started');
    setLoading(true);
    const { data } = await fetchAutomobileModels({
      maxPrice: input.budgetMax,
      fuelType: input.fuel,
      transmission: input.transmission,
      minSeats: input.familySize,
      limit: 24,
    });
    const scored = (data.items ?? [])
      .map((model) => {
        const { score, reasons } = scoreAutomobileRecommendation(
          {
            id: model.representativeId,
            name: model.name,
            slug: model.slug,
            exShowroomPrice: model.minPrice,
            seatingCapacity: model.maxSeats,
            fuelType: model.fuels[0],
            transmission: model.transmissions[0],
            mileage: model.maxMileage,
            groundClearance: model.groundClearance,
            safetyRating: model.safetyRating,
            bodyType: model.bodyTypes[0],
          },
          input,
        );
        return { model, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setResults(scored);
    setLoading(false);
    trackAutomobileEvent('car_finder_completed', { results: scored.length });
  }

  return (
    <ContentLayout
      title="Car finder"
      description="Rule-based matches from published catalogue fields. Not an AI ranking and not a dealer recommendation."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Car finder' },
      ]}
    >
      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <div>
          <Label htmlFor="budgetMax">Budget (₹)</Label>
          <Input id="budgetMax" name="budgetMax" type="number" min={0} className="mt-1 h-11" />
        </div>
        <div>
          <Label htmlFor="usage">Primary usage</Label>
          <select
            id="usage"
            name="usage"
            className="mt-1 h-11 w-full rounded-md border px-3 text-sm"
            defaultValue="mixed"
          >
            <option value="city">City</option>
            <option value="highway">Highway</option>
            <option value="family">Family</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div>
          <Label htmlFor="familySize">Family size</Label>
          <Input
            id="familySize"
            name="familySize"
            type="number"
            min={1}
            max={12}
            className="mt-1 h-11"
          />
        </div>
        <div>
          <Label htmlFor="fuel">Fuel preference</Label>
          <Input id="fuel" name="fuel" placeholder="Petrol, Diesel, CNG…" className="mt-1 h-11" />
        </div>
        <div>
          <Label htmlFor="transmission">Transmission</Label>
          <select
            id="transmission"
            name="transmission"
            className="mt-1 h-11 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Any</option>
            <option value="automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            className="mt-1 h-11 w-full rounded-md border px-3 text-sm"
          >
            <option value="mileage">Mileage</option>
            <option value="safety">Safety</option>
            <option value="performance">Performance</option>
            <option value="comfort">Comfort</option>
            <option value="low_maintenance">Low maintenance</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Matching…' : 'Find matches'}
          </Button>
        </div>
      </form>
      <ul className="mt-8 space-y-4">
        {results.map((row) => (
          <li
            key={row.model.representativeId}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-sm font-semibold text-[#ea580c]">{row.score}% match</p>
            <Link
              className="text-lg font-extrabold text-[#0b1f3a] hover:underline"
              href={`/automobile/vehicles/${row.model.slug}`}
            >
              {row.model.name}
            </Link>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {row.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </ContentLayout>
  );
}
