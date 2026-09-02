'use client';

import Link from 'next/link';
import { formatAutomobileMileage, formatAutomobilePriceRange } from '@varnarc/validation';
import type { AutomobileModelSummary } from '@/services/automobile';
import { AutomobileVehicleImage } from './vehicle-image';

function joinUnique(values: string[], max = 3) {
  return values.filter(Boolean).slice(0, max).join(' • ');
}

export function AutomobileDiscoveryCard({
  model,
  selected,
  onToggleCompare,
}: {
  model: AutomobileModelSummary;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
}) {
  const price = formatAutomobilePriceRange(model.minPrice, model.maxPrice);
  const mileage = formatAutomobileMileage(model.maxMileage ?? model.minMileage);
  const seats =
    model.minSeats && model.maxSeats && model.minSeats !== model.maxSeats
      ? `${model.minSeats}–${model.maxSeats} seats`
      : model.minSeats
        ? `${model.minSeats} seats`
        : null;
  const body = model.bodyTypes[0] ?? null;
  const safety =
    model.safetyRating != null && Number(model.safetyRating) > 0
      ? `${model.safetyRating}${model.safetyAgency ? ` (${model.safetyAgency})` : ''}`
      : null;
  const href = `/automobile/vehicles/${model.slug}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Link href={href} className="block">
        <AutomobileVehicleImage
          src={model.imageUrl}
          alt={model.name}
          vehicleId={model.representativeId}
          attribution={model.imageAttribution}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-extrabold text-[#0b1f3a]">
          <Link href={href} className="hover:underline">
            {model.name}
          </Link>
        </h3>
        {price ? <p className="text-base font-semibold text-[#ea580c]">{price}</p> : null}
        {model.fuels.length ? (
          <p className="text-sm text-slate-600">{joinUnique(model.fuels)}</p>
        ) : null}
        {model.transmissions.length ? (
          <p className="text-sm text-slate-600">{joinUnique(model.transmissions)}</p>
        ) : null}
        <p className="text-sm text-slate-600">
          {[seats, mileage, body, safety].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {onToggleCompare ? (
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#ea580c]"
                checked={Boolean(selected)}
                onChange={() => onToggleCompare(model.representativeId)}
              />
              Compare
            </label>
          ) : null}
          <Link
            href={href}
            className="inline-flex min-h-11 items-center rounded-lg bg-[#0b1f3a] px-3 text-sm font-semibold text-white"
          >
            View details
          </Link>
          <Link
            href={`/automobile/calculators/on-road-price?vehicle=${model.slug}`}
            className="inline-flex min-h-11 items-center text-sm font-medium text-[#ea580c] hover:underline"
          >
            Get on-road price →
          </Link>
        </div>
      </div>
    </article>
  );
}
