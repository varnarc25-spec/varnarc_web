'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { CmsMediaImage, CmsMediaPreload } from '@/components/cms/cms-media-image';
import {
  TW_ILLUSTRATIVE_RATE,
  useTwoWheelerDecision,
} from '@/components/loans/two-wheeler-loan-decision-context';
import { financeEligibilityPath } from '@/lib/finance-routes';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import {
  TW_VEHICLE_PRESETS,
  TW_TENURE_YEARS,
  parseTwoWheelerMoneyInput,
} from '@/lib/two-wheeler-loan-page';
import { formatInr } from '@/components/loans/loan-format';

const HERO_MEDIA = '(min-width: 1024px)';

const chipBase =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)] focus-visible:ring-offset-2';

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function TwoWheelerLoanDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const vehicleInputRef = useRef<HTMLInputElement>(null);
  const {
    vehiclePrice,
    downPayment,
    downPaymentPercent,
    loanRequirement,
    vehicleCondition,
    vehicleType,
    tenureYears,
    setVehiclePrice,
    setDownPayment,
    setVehicleCondition,
    setVehicleType,
    setTenureYears,
  } = useTwoWheelerDecision();

  const [vehicleDigits, setVehicleDigits] = useState(() => String(vehiclePrice));
  const [downDigits, setDownDigits] = useState(() => String(downPayment));
  const [customVehicle, setCustomVehicle] = useState(false);
  const [dpHint, setDpHint] = useState<string | null>(null);

  const vehicleDisplay = useMemo(() => formatAmountDisplay(vehicleDigits), [vehicleDigits]);
  const downDisplay = useMemo(() => formatAmountDisplay(downDigits), [downDigits]);

  const activePreset = useMemo(() => {
    if (customVehicle) return 'custom' as const;
    const match = TW_VEHICLE_PRESETS.find((p) => p.value === vehiclePrice);
    return match ? match.value : ('custom' as const);
  }, [vehiclePrice, customVehicle]);

  function syncVehicle(next: number) {
    setVehiclePrice(next);
    setVehicleDigits(String(next));
    const nextDown = Math.round((next * Math.min(100, Math.max(0, downPaymentPercent))) / 100);
    setDownDigits(String(nextDown));
    setDpHint(null);
  }

  function syncDown(next: number) {
    if (next > vehiclePrice) {
      setDpHint('Down payment cannot exceed vehicle price.');
    } else {
      setDpHint(null);
    }
    setDownPayment(next);
    setDownDigits(String(Math.min(Math.max(0, next), vehiclePrice)));
  }

  function onPlan(e: FormEvent) {
    e.preventDefault();
    const v = parseTwoWheelerMoneyInput(vehicleDigits);
    const d = parseTwoWheelerMoneyInput(downDigits);
    if (Number.isFinite(v) && v > 0) setVehiclePrice(v);
    if (Number.isFinite(d) && d >= 0) setDownPayment(d);
    try {
      trackAnalyticsEvent({
        eventType: 'custom',
        entityType: 'two_wheeler_loan',
        entityId: 'plan_cta',
        metadata: { action: 'tw_loan_plan_started' },
      });
    } catch {
      /* analytics optional */
    }
    document.getElementById('tw-snapshot')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <header
      id="tw-hero-planner"
      className="tw-hero overflow-hidden rounded-[var(--tw-radius-md)] bg-[var(--tw-surface-1)]"
    >
      <CmsMediaPreload href={illustrationSrc} media={HERO_MEDIA} />
      <div className="grid items-center gap-6 p-1 sm:p-2 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-10 lg:p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
            Two-Wheeler Loan
          </p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--tw-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan and Compare Two-Wheeler Loans
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--tw-muted)]">
            Estimate your down payment, loan requirement and EMI for motorcycles, scooters and
            electric two-wheelers before comparing offers.
          </p>

          <form onSubmit={onPlan} className="mt-7 space-y-6" aria-label="Two-wheeler loan planner">
            {/* Vehicle Price */}
            <div>
              <label htmlFor="tw-vehicle-price" className="text-sm font-bold text-[var(--tw-navy)]">
                Vehicle Price
              </label>
              <div className="relative mt-3 border-b-2 border-[var(--tw-navy)] pb-1.5 transition duration-150 focus-within:border-[var(--tw-orange)]">
                <span
                  className="pointer-events-none absolute bottom-2.5 left-0 text-2xl font-bold text-[var(--tw-muted)] sm:text-3xl"
                  aria-hidden
                >
                  ₹
                </span>
                <input
                  ref={vehicleInputRef}
                  id="tw-vehicle-price"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={vehicleDisplay}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setVehicleDigits(digits);
                    setCustomVehicle(true);
                    const n = Number(digits);
                    if (Number.isFinite(n) && n > 0) syncVehicle(n);
                  }}
                  placeholder="1,20,000"
                  className="w-full border-0 bg-transparent py-1 pl-8 text-[2.25rem] font-extrabold tabular-nums tracking-tight text-[var(--tw-navy)] outline-none placeholder:text-slate-300 focus-visible:ring-0 sm:pl-10 sm:text-[2.75rem]"
                />
              </div>
              <div
                className="mt-3.5 flex flex-wrap gap-2"
                role="group"
                aria-label="Vehicle price presets"
              >
                {TW_VEHICLE_PRESETS.map((preset) => {
                  const active = activePreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setCustomVehicle(false);
                        syncVehicle(preset.value);
                      }}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--tw-navy)] text-white'
                          : 'border border-[var(--tw-border)] bg-white text-[var(--tw-navy)] hover:bg-[var(--tw-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--tw-orange)]"
                          aria-hidden
                        />
                      ) : null}
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={activePreset === 'custom'}
                  onClick={() => {
                    setCustomVehicle(true);
                    vehicleInputRef.current?.focus();
                  }}
                  className={`${chipBase} ${
                    activePreset === 'custom'
                      ? 'bg-[var(--tw-navy)] text-white'
                      : 'border border-[var(--tw-border)] bg-white text-[var(--tw-navy)] hover:bg-[var(--tw-surface-2)]'
                  }`}
                >
                  {activePreset === 'custom' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--tw-orange)]" aria-hidden />
                  ) : null}
                  Custom
                </button>
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <p className="text-sm font-bold text-[var(--tw-navy)]">Vehicle Type</p>
              <div
                className="mt-2.5 flex flex-wrap gap-2"
                role="group"
                aria-label="Vehicle type"
              >
                {(
                  [
                    ['motorcycle', 'Motorcycle'],
                    ['scooter', 'Scooter'],
                    ['electric', 'Electric'],
                    ['other', 'Other'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={vehicleType === key}
                    onClick={() => setVehicleType(key)}
                    className={`${chipBase} ${
                      vehicleType === key
                        ? 'bg-[var(--tw-navy)] text-white'
                        : 'border border-[var(--tw-border)] bg-white text-[var(--tw-navy)] hover:bg-[var(--tw-surface-2)]'
                    }`}
                  >
                    {vehicleType === key ? (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[var(--tw-orange)]"
                        aria-hidden
                      />
                    ) : null}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Condition */}
            <div>
              <p className="text-sm font-bold text-[var(--tw-navy)]">Vehicle Condition</p>
              <div
                className="mt-2.5 inline-flex rounded-full bg-[var(--tw-surface-2)] p-0.5"
                role="group"
                aria-label="Vehicle condition"
              >
                {(
                  [
                    ['new', 'New'],
                    ['used', 'Used'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={vehicleCondition === key}
                    onClick={() => setVehicleCondition(key)}
                    className={`min-h-9 rounded-full px-4 text-xs font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)] ${
                      vehicleCondition === key
                        ? 'bg-[var(--tw-navy)] text-white'
                        : 'text-[var(--tw-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <label htmlFor="tw-down-payment" className="text-sm font-bold text-[var(--tw-navy)]">
                Down Payment
              </label>
              <div className="relative mt-3 border-b border-[var(--tw-border)] pb-1 focus-within:border-[var(--tw-orange)]">
                <span
                  className="pointer-events-none absolute bottom-1.5 left-0 text-lg font-bold text-[var(--tw-muted)]"
                  aria-hidden
                >
                  ₹
                </span>
                <input
                  id="tw-down-payment"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={downDisplay}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setDownDigits(digits);
                    const n = Number(digits);
                    if (Number.isFinite(n) && n >= 0) syncDown(n);
                  }}
                  placeholder="20,000"
                  className="w-full border-0 bg-transparent py-1 pl-6 text-xl font-bold tabular-nums text-[var(--tw-navy)] outline-none focus-visible:ring-0"
                />
              </div>
              {dpHint ? (
                <p className="mt-2 text-xs font-medium text-[var(--tw-orange)]" role="status">
                  {dpHint}
                </p>
              ) : null}
            </div>

            {/* Loan Required */}
            <div
              className="rounded-[var(--tw-radius-md)] bg-[var(--tw-surface-4)] px-4 py-4"
              aria-live="polite"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tw-muted)]">
                Loan Required
              </p>
              <p className="mt-1.5 text-[1.75rem] font-extrabold tabular-nums tracking-tight text-[var(--tw-navy)] sm:text-[2rem]">
                {formatInr(loanRequirement)}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--tw-muted)]">
                <span className="font-semibold tabular-nums text-[var(--tw-navy)]">
                  {formatInr(vehiclePrice)}
                </span>
                <span aria-hidden>−</span>
                <span className="font-semibold tabular-nums text-[var(--tw-navy)]">
                  {formatInr(downPayment)}
                </span>
                <span aria-hidden>=</span>
                <span className="font-bold tabular-nums text-[var(--tw-navy)]">
                  {formatInr(loanRequirement)}
                </span>
              </p>
            </div>

            {/* Tenure */}
            <fieldset>
              <legend className="text-sm font-bold text-[var(--tw-navy)]">Preferred Tenure</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {TW_TENURE_YEARS.map((years) => {
                  const active = tenureYears === years;
                  return (
                    <button
                      key={years}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTenureYears(years)}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--tw-navy)] text-white'
                          : 'border border-[var(--tw-border)] bg-white text-[var(--tw-navy)] hover:bg-[var(--tw-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--tw-orange)]"
                          aria-hidden
                        />
                      ) : null}
                      {years} {years === 1 ? 'yr' : 'yrs'}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--tw-radius-md)] bg-[var(--tw-navy)] px-6 text-sm font-semibold !text-white transition duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)] focus-visible:ring-offset-2"
              >
                Plan My Two-Wheeler Loan
              </button>
              <Link
                href={financeEligibilityPath({ loanType: 'two-wheeler' })}
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition duration-150 hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
              >
                Check Eligibility →
              </Link>
            </div>
            <p className="text-xs text-[var(--tw-muted)]">
              Illustrative planning only. EMI snapshots use a default of {TW_ILLUSTRATIVE_RATE}%
              p.a. unless you adjust the rate.
            </p>
          </form>

          <div className="relative mx-auto mt-6 w-full max-w-sm lg:hidden" aria-hidden>
            <div className="relative mx-auto aspect-[16/10] w-[72%] max-h-[140px]">
              <CmsMediaImage
                src={illustrationSrc}
                alt=""
                width={400}
                height={220}
                sizes="280px"
                objectFit="contain"
                loading="lazy"
                imgClassName="max-h-[140px]"
              />
            </div>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xl justify-self-end lg:block">
          <div
            className="pointer-events-none absolute -right-2 top-2 h-32 w-32 rounded-full bg-[var(--tw-orange)] opacity-20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-6 h-28 w-28 rounded-full bg-[var(--tw-surface-4)] opacity-90"
            aria-hidden
          />
          <div className="relative aspect-[16/10] w-full max-h-[380px]">
            <CmsMediaImage
              src={illustrationSrc}
              alt={illustrationAlt}
              width={640}
              height={360}
              media={HERO_MEDIA}
              sizes="(max-width: 1024px) 0px, 580px"
              objectFit="contain"
              loading="eager"
              fetchPriority="high"
              imgClassName="max-h-[380px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
