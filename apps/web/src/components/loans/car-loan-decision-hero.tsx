'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { CmsMediaImage, CmsMediaPreload } from '@/components/cms/cms-media-image';
import {
  CAR_LOAN_ILLUSTRATIVE_RATE,
  useCarLoanDecision,
} from '@/components/loans/car-loan-decision-context';
import { financeEligibilityPath } from '@/lib/finance-routes';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { CAR_LOAN_VEHICLE_PRESETS, CAR_LOAN_TENURE_YEARS } from '@/lib/car-loan-page';
import { formatInr } from '@/components/loans/loan-format';

const HERO_MEDIA = '(min-width: 1024px)';

const chipBase =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] focus-visible:ring-offset-2';

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function CarLoanDecisionHero({
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
    tenureYears,
    setVehiclePrice,
    setDownPayment,
    setDownPaymentFromPercent,
    setVehicleCondition,
    setTenureYears,
  } = useCarLoanDecision();

  const [vehicleDigits, setVehicleDigits] = useState(() => String(vehiclePrice));
  const [downDigits, setDownDigits] = useState(() => String(downPayment));
  const [dpMode, setDpMode] = useState<'amount' | 'percent'>('percent');
  const [percentInput, setPercentInput] = useState(() =>
    String(Math.round(downPaymentPercent * 10) / 10),
  );
  const [customVehicle, setCustomVehicle] = useState(false);
  const [dpHint, setDpHint] = useState<string | null>(null);

  const vehicleDisplay = useMemo(() => formatAmountDisplay(vehicleDigits), [vehicleDigits]);
  const downDisplay = useMemo(() => formatAmountDisplay(downDigits), [downDigits]);

  const activePreset = useMemo(() => {
    if (customVehicle) return 'custom' as const;
    const match = CAR_LOAN_VEHICLE_PRESETS.find((p) => p.value === vehiclePrice);
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
    if (vehiclePrice > 0) {
      const clamped = Math.min(Math.max(0, next), vehiclePrice);
      setPercentInput(String(Math.round((clamped / vehiclePrice) * 1000) / 10));
    }
  }

  function applyPercent(pct: number) {
    const safe = Math.min(100, Math.max(0, pct));
    if (pct > 100) {
      setDpHint('Down payment cannot exceed 100% of vehicle price.');
    } else {
      setDpHint(null);
    }
    setDownPaymentFromPercent(safe);
    setPercentInput(String(safe));
    setDownDigits(String(Math.round((vehiclePrice * safe) / 100)));
    setDpMode('percent');
    try {
      trackAnalyticsEvent({
        eventType: 'custom',
        entityType: 'car_loan',
        entityId: 'down_payment',
        metadata: { action: 'down_payment_changed', source: 'percent_chip' },
      });
    } catch {
      /* optional */
    }
  }

  function onPlan(e: FormEvent) {
    e.preventDefault();
    const v = Number(vehicleDigits.replace(/\D/g, ''));
    const d = Number(downDigits.replace(/\D/g, ''));
    if (Number.isFinite(v) && v > 0) setVehiclePrice(v);
    if (Number.isFinite(d) && d >= 0) setDownPayment(d);
    try {
      trackAnalyticsEvent({
        eventType: 'custom',
        entityType: 'car_loan',
        entityId: 'plan_cta',
        metadata: { action: 'car_loan_plan_started' },
      });
    } catch {
      /* analytics optional */
    }
    document.getElementById('car-loan-offers')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <header className="overflow-hidden rounded-[var(--cl-radius-lg)] bg-[var(--cl-surface-1)]">
      <CmsMediaPreload href={illustrationSrc} media={HERO_MEDIA} />
      <div className="grid items-center gap-6 p-1 sm:p-2 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-10 lg:p-4">
        <div className="min-w-0">
          <p className="cl-eyebrow">Car Loan Planner</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--cl-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan and Compare Car Loans
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--cl-muted)]">
            Estimate your down payment, loan requirement, EMI and total financing cost before
            comparing Car Loan offers.
          </p>

          <form onSubmit={onPlan} className="mt-7 space-y-6" aria-label="Car loan planner">
            {/* Vehicle Price */}
            <div>
              <label htmlFor="cl-vehicle-price" className="text-sm font-bold text-[var(--cl-navy)]">
                What is the vehicle price?
              </label>
              <div className="relative mt-3 border-b-2 border-[var(--cl-navy)] pb-1.5 transition duration-150 focus-within:border-[var(--cl-orange)]">
                <span
                  className="pointer-events-none absolute bottom-2.5 left-0 text-2xl font-bold text-[var(--cl-muted)] sm:text-3xl"
                  aria-hidden
                >
                  ₹
                </span>
                <input
                  ref={vehicleInputRef}
                  id="cl-vehicle-price"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={vehicleDisplay}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setVehicleDigits(digits);
                    setCustomVehicle(true);
                    const n = Number(digits);
                    if (Number.isFinite(n) && n > 0) syncVehicle(n);
                  }}
                  placeholder="12,00,000"
                  className="w-full border-0 bg-transparent py-1 pl-8 text-[2.25rem] font-extrabold tabular-nums tracking-tight text-[var(--cl-navy)] outline-none placeholder:text-slate-300 focus-visible:ring-0 sm:pl-10 sm:text-[2.75rem]"
                />
              </div>
              <div
                className="mt-3.5 flex flex-wrap gap-2"
                role="group"
                aria-label="Vehicle price presets"
              >
                {CAR_LOAN_VEHICLE_PRESETS.map((preset) => {
                  const active = activePreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setCustomVehicle(false);
                        syncVehicle(preset.value);
                        setDownDigits(
                          String(Math.round((preset.value * downPaymentPercent) / 100)),
                        );
                        try {
                          trackAnalyticsEvent({
                            eventType: 'custom',
                            entityType: 'car_loan',
                            entityId: 'vehicle_price',
                            metadata: { action: 'vehicle_price_changed', source: 'preset' },
                          });
                        } catch {
                          /* optional */
                        }
                      }}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--cl-navy)] text-white'
                          : 'border border-[var(--cl-border)] bg-white text-[var(--cl-navy)] hover:bg-[var(--cl-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--cl-orange)]"
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
                      ? 'bg-[var(--cl-navy)] text-white'
                      : 'border border-[var(--cl-border)] bg-white text-[var(--cl-navy)] hover:bg-[var(--cl-surface-2)]'
                  }`}
                >
                  {activePreset === 'custom' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cl-orange)]" aria-hidden />
                  ) : null}
                  Custom
                </button>
              </div>
            </div>

            {/* New / Used toggle */}
            <div>
              <p className="text-sm font-bold text-[var(--cl-navy)]">Vehicle Condition</p>
              <div
                className="mt-2.5 inline-flex rounded-full bg-[var(--cl-surface-2)] p-0.5"
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
                    onClick={() => {
                      setVehicleCondition(key);
                      try {
                        trackAnalyticsEvent({
                          eventType: 'custom',
                          entityType: 'car_loan',
                          entityId: 'vehicle_condition',
                          metadata: {
                            action: 'vehicle_condition_changed',
                            condition: key,
                          },
                        });
                      } catch {
                        /* optional */
                      }
                    }}
                    className={`min-h-9 rounded-full px-4 text-xs font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] ${
                      vehicleCondition === key
                        ? 'bg-[var(--cl-navy)] text-white'
                        : 'text-[var(--cl-navy)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[var(--cl-navy)]">Down Payment</p>
                <div
                  className="inline-flex rounded-full bg-[var(--cl-surface-2)] p-0.5"
                  role="group"
                  aria-label="Down payment input mode"
                >
                  {(
                    [
                      ['percent', 'Percent'],
                      ['amount', 'Amount'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDpMode(key)}
                      className={`min-h-8 rounded-full px-3 text-[11px] font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] ${
                        dpMode === key ? 'bg-[var(--cl-navy)] text-white' : 'text-[var(--cl-navy)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-end">
                <div>
                  <label
                    htmlFor="cl-down-payment-percent"
                    className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]"
                  >
                    Percent
                  </label>
                  <div className="relative mt-1 border-b border-[var(--cl-border)] pb-1 focus-within:border-[var(--cl-orange)]">
                    <input
                      id="cl-down-payment-percent"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step={0.5}
                      value={
                        dpMode === 'percent'
                          ? percentInput
                          : String(Math.round(downPaymentPercent * 10) / 10)
                      }
                      onChange={(e) => {
                        setPercentInput(e.target.value);
                        setDpMode('percent');
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 0) {
                          if (n > 100) {
                            setDpHint('Down payment cannot exceed 100% of vehicle price.');
                          } else {
                            setDpHint(null);
                          }
                          setDownPaymentFromPercent(n);
                          setDownDigits(
                            String(Math.round((vehiclePrice * Math.min(100, n)) / 100)),
                          );
                        }
                      }}
                      className="w-full border-0 bg-transparent py-1 pr-8 text-xl font-bold tabular-nums text-[var(--cl-navy)] outline-none focus-visible:ring-0"
                    />
                    <span className="pointer-events-none absolute bottom-1.5 right-0 text-lg font-bold text-[var(--cl-muted)]">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="cl-down-payment"
                    className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]"
                  >
                    Amount
                  </label>
                  <div className="relative mt-1 border-b border-[var(--cl-border)] pb-1 focus-within:border-[var(--cl-orange)]">
                    <span
                      className="pointer-events-none absolute bottom-1.5 left-0 text-lg font-bold text-[var(--cl-muted)]"
                      aria-hidden
                    >
                      ₹
                    </span>
                    <input
                      id="cl-down-payment"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={downDisplay}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setDownDigits(digits);
                        setDpMode('amount');
                        const n = Number(digits);
                        if (Number.isFinite(n) && n >= 0) syncDown(n);
                      }}
                      placeholder="2,40,000"
                      className="w-full border-0 bg-transparent py-1 pl-6 text-xl font-bold tabular-nums text-[var(--cl-navy)] outline-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label="Down payment presets"
              >
                {[10, 20, 30].map((pct) => {
                  const active = Math.abs(downPaymentPercent - pct) < 0.05;
                  return (
                    <button
                      key={pct}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyPercent(pct)}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--cl-navy)] text-white'
                          : 'border border-[var(--cl-border)] bg-white text-[var(--cl-navy)] hover:bg-[var(--cl-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--cl-orange)]"
                          aria-hidden
                        />
                      ) : null}
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loan Required — calculated output */}
            <div
              className="rounded-[var(--cl-radius-md)] bg-[var(--cl-surface-4)] px-4 py-4"
              aria-live="polite"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cl-muted)]">
                Loan Required
              </p>
              <p className="mt-1.5 text-[1.75rem] font-extrabold tabular-nums tracking-tight text-[var(--cl-navy)] sm:text-[2rem]">
                {formatInr(loanRequirement)}
              </p>
              <p
                className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--cl-muted)]"
                aria-label={`${formatInr(vehiclePrice)} vehicle minus ${formatInr(downPayment)} down payment equals ${formatInr(loanRequirement)} loan required`}
              >
                <span className="font-semibold tabular-nums text-[var(--cl-navy)]">
                  {formatInr(vehiclePrice)}
                </span>
                <span aria-hidden>−</span>
                <span className="font-semibold tabular-nums text-[var(--cl-navy)]">
                  {formatInr(downPayment)}
                </span>
                <span aria-hidden>=</span>
                <span className="font-bold tabular-nums text-[var(--cl-navy)]">
                  {formatInr(loanRequirement)}
                </span>
              </p>
              {dpHint ? (
                <p className="mt-2 text-xs font-medium text-[var(--cl-orange)]" role="status">
                  {dpHint}
                </p>
              ) : null}
            </div>

            <fieldset>
              <legend className="text-sm font-bold text-[var(--cl-navy)]">Preferred Tenure</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {CAR_LOAN_TENURE_YEARS.map((years) => {
                  const active = tenureYears === years;
                  return (
                    <button
                      key={years}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setTenureYears(years);
                        try {
                          trackAnalyticsEvent({
                            eventType: 'custom',
                            entityType: 'car_loan',
                            entityId: 'tenure',
                            metadata: {
                              action: 'car_loan_tenure_changed',
                              tenureYears: years,
                            },
                          });
                        } catch {
                          /* optional */
                        }
                      }}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--cl-navy)] text-white'
                          : 'border border-[var(--cl-border)] bg-white text-[var(--cl-navy)] hover:bg-[var(--cl-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--cl-orange)]"
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
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-6 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--cl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] focus-visible:ring-offset-2"
              >
                Plan My Car Loan
              </button>
              <Link
                href={financeEligibilityPath({ loanType: 'car' })}
                onClick={() => {
                  try {
                    trackAnalyticsEvent({
                      eventType: 'custom',
                      entityType: 'car_loan',
                      entityId: 'eligibility_link',
                      metadata: { action: 'car_eligibility_started' },
                    });
                  } catch {
                    /* optional */
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition duration-150 hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
              >
                Check Eligibility →
              </Link>
            </div>
            <p className="text-xs text-[var(--cl-muted)]">
              Illustrative planning only. EMI snapshots use a labeled default of{' '}
              {CAR_LOAN_ILLUSTRATIVE_RATE}% p.a. unless you adjust the rate.
            </p>
          </form>

          <div className="relative mx-auto mt-6 w-full max-w-sm lg:hidden">
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
            className="pointer-events-none absolute -right-2 top-2 h-32 w-32 rounded-full bg-[var(--cl-orange-soft)] opacity-55"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-6 h-28 w-28 rounded-full bg-[var(--cl-surface-4)] opacity-90"
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
