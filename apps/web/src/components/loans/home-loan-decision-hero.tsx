'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { CmsMediaImage, CmsMediaPreload } from '@/components/cms/cms-media-image';
import {
  HOME_LOAN_ILLUSTRATIVE_RATE,
  useHomeLoanDecision,
} from '@/components/loans/home-loan-decision-context';
import { financeEligibilityPath } from '@/lib/finance-routes';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { HOME_LOAN_PROPERTY_PRESETS, HOME_LOAN_TENURE_YEARS } from '@/lib/home-loan-page';
import { formatInr } from '@/components/loans/loan-format';

const HERO_MEDIA = '(min-width: 1024px)';

const chipBase =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] focus-visible:ring-offset-2';

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function HomeLoanDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const propertyInputRef = useRef<HTMLInputElement>(null);
  const {
    propertyValue,
    downPayment,
    downPaymentPercent,
    loanRequirement,
    tenureYears,
    setPropertyValue,
    setDownPayment,
    setDownPaymentFromPercent,
    setTenureYears,
  } = useHomeLoanDecision();

  const [propertyDigits, setPropertyDigits] = useState(() => String(propertyValue));
  const [downDigits, setDownDigits] = useState(() => String(downPayment));
  const [dpMode, setDpMode] = useState<'amount' | 'percent'>('percent');
  const [percentInput, setPercentInput] = useState(() =>
    String(Math.round(downPaymentPercent * 10) / 10),
  );
  const [customProperty, setCustomProperty] = useState(false);
  const [dpHint, setDpHint] = useState<string | null>(null);

  const propertyDisplay = useMemo(() => formatAmountDisplay(propertyDigits), [propertyDigits]);
  const downDisplay = useMemo(() => formatAmountDisplay(downDigits), [downDigits]);

  const activePreset = useMemo(() => {
    if (customProperty) return 'custom' as const;
    const match = HOME_LOAN_PROPERTY_PRESETS.find((p) => p.value === propertyValue);
    return match ? match.value : ('custom' as const);
  }, [propertyValue, customProperty]);

  function syncProperty(next: number) {
    setPropertyValue(next);
    setPropertyDigits(String(next));
    const nextDown = Math.round((next * Math.min(100, Math.max(0, downPaymentPercent))) / 100);
    setDownDigits(String(nextDown));
    setDpHint(null);
  }

  function syncDown(next: number) {
    if (next > propertyValue) {
      setDpHint('Down payment cannot exceed property value.');
    } else {
      setDpHint(null);
    }
    setDownPayment(next);
    setDownDigits(String(Math.min(Math.max(0, next), propertyValue)));
    if (propertyValue > 0) {
      const clamped = Math.min(Math.max(0, next), propertyValue);
      setPercentInput(String(Math.round((clamped / propertyValue) * 1000) / 10));
    }
  }

  function applyPercent(pct: number) {
    const safe = Math.min(100, Math.max(0, pct));
    if (pct > 100) {
      setDpHint('Down payment cannot exceed 100% of property value.');
    } else {
      setDpHint(null);
    }
    setDownPaymentFromPercent(safe);
    setPercentInput(String(safe));
    setDownDigits(String(Math.round((propertyValue * safe) / 100)));
    setDpMode('percent');
  }

  function onPlan(e: FormEvent) {
    e.preventDefault();
    const p = Number(propertyDigits.replace(/\D/g, ''));
    const d = Number(downDigits.replace(/\D/g, ''));
    if (Number.isFinite(p) && p > 0) setPropertyValue(p);
    if (Number.isFinite(d) && d >= 0) setDownPayment(d);
    try {
      trackAnalyticsEvent({
        eventType: 'custom',
        entityType: 'home_loan',
        entityId: 'plan_cta',
        metadata: { action: 'home_loan_plan_started' },
      });
    } catch {
      /* analytics optional */
    }
    document.getElementById('home-loan-offers')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <header className="overflow-hidden rounded-[var(--hl-radius-lg)] bg-[var(--hl-surface-1)]">
      <CmsMediaPreload href={illustrationSrc} media={HERO_MEDIA} />
      <div className="grid items-center gap-6 p-1 sm:p-2 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-10 lg:p-4">
        <div className="min-w-0">
          <p className="hl-eyebrow">Home Loan Planner</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--hl-navy)] sm:text-[1.875rem] sm:leading-tight">
            Plan and Compare Home Loans
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--hl-muted)]">
            Estimate your property financing, down payment, EMI and total borrowing cost before
            comparing Home Loan offers.
          </p>

          <form onSubmit={onPlan} className="mt-7 space-y-6" aria-label="Home loan planner">
            {/* Property Value — strongest control */}
            <div>
              <label
                htmlFor="hl-property-value"
                className="text-sm font-bold text-[var(--hl-navy)]"
              >
                What is the property value?
              </label>
              <div className="relative mt-3 border-b-2 border-[var(--hl-navy)] pb-1.5 transition duration-150 focus-within:border-[var(--hl-orange)]">
                <span
                  className="pointer-events-none absolute bottom-2.5 left-0 text-2xl font-bold text-[var(--hl-muted)] sm:text-3xl"
                  aria-hidden
                >
                  ₹
                </span>
                <input
                  ref={propertyInputRef}
                  id="hl-property-value"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={propertyDisplay}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setPropertyDigits(digits);
                    setCustomProperty(true);
                    const n = Number(digits);
                    if (Number.isFinite(n) && n > 0) syncProperty(n);
                  }}
                  placeholder="75,00,000"
                  className="w-full border-0 bg-transparent py-1 pl-8 text-[2.25rem] font-extrabold tabular-nums tracking-tight text-[var(--hl-navy)] outline-none placeholder:text-slate-300 focus-visible:ring-0 sm:pl-10 sm:text-[2.75rem]"
                />
              </div>
              <div
                className="mt-3.5 flex flex-wrap gap-2"
                role="group"
                aria-label="Property value presets"
              >
                {HOME_LOAN_PROPERTY_PRESETS.map((preset) => {
                  const active = activePreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setCustomProperty(false);
                        syncProperty(preset.value);
                        setDownDigits(
                          String(Math.round((preset.value * downPaymentPercent) / 100)),
                        );
                      }}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--hl-navy)] text-white'
                          : 'border border-[var(--hl-border)] bg-white text-[var(--hl-navy)] hover:bg-[var(--hl-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--hl-orange)]"
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
                    setCustomProperty(true);
                    propertyInputRef.current?.focus();
                  }}
                  className={`${chipBase} ${
                    activePreset === 'custom'
                      ? 'bg-[var(--hl-navy)] text-white'
                      : 'border border-[var(--hl-border)] bg-white text-[var(--hl-navy)] hover:bg-[var(--hl-surface-2)]'
                  }`}
                >
                  {activePreset === 'custom' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hl-orange)]" aria-hidden />
                  ) : null}
                  Custom
                </button>
              </div>
            </div>

            {/* Down Payment — secondary, linked % ↔ amount */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[var(--hl-navy)]">Down Payment</p>
                <div
                  className="inline-flex rounded-full bg-[var(--hl-surface-2)] p-0.5"
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
                      className={`min-h-8 rounded-full px-3 text-[11px] font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] ${
                        dpMode === key ? 'bg-[var(--hl-navy)] text-white' : 'text-[var(--hl-navy)]'
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
                    htmlFor="hl-down-payment-percent"
                    className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]"
                  >
                    Percent
                  </label>
                  <div className="relative mt-1 border-b border-[var(--hl-border)] pb-1 focus-within:border-[var(--hl-orange)]">
                    <input
                      id="hl-down-payment-percent"
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
                            setDpHint('Down payment cannot exceed 100% of property value.');
                          } else {
                            setDpHint(null);
                          }
                          setDownPaymentFromPercent(n);
                          setDownDigits(
                            String(Math.round((propertyValue * Math.min(100, n)) / 100)),
                          );
                        }
                      }}
                      className="w-full border-0 bg-transparent py-1 pr-8 text-xl font-bold tabular-nums text-[var(--hl-navy)] outline-none focus-visible:ring-0"
                    />
                    <span className="pointer-events-none absolute bottom-1.5 right-0 text-lg font-bold text-[var(--hl-muted)]">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="hl-down-payment"
                    className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]"
                  >
                    Amount
                  </label>
                  <div className="relative mt-1 border-b border-[var(--hl-border)] pb-1 focus-within:border-[var(--hl-orange)]">
                    <span
                      className="pointer-events-none absolute bottom-1.5 left-0 text-lg font-bold text-[var(--hl-muted)]"
                      aria-hidden
                    >
                      ₹
                    </span>
                    <input
                      id="hl-down-payment"
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
                      placeholder="15,00,000"
                      className="w-full border-0 bg-transparent py-1 pl-6 text-xl font-bold tabular-nums text-[var(--hl-navy)] outline-none focus-visible:ring-0"
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
                          ? 'bg-[var(--hl-navy)] text-white'
                          : 'border border-[var(--hl-border)] bg-white text-[var(--hl-navy)] hover:bg-[var(--hl-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--hl-orange)]"
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
              className="rounded-[var(--hl-radius-md)] bg-[var(--hl-surface-4)] px-4 py-4"
              aria-live="polite"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hl-muted)]">
                Loan Required
              </p>
              <p className="mt-1.5 text-[1.75rem] font-extrabold tabular-nums tracking-tight text-[var(--hl-navy)] sm:text-[2rem]">
                {formatInr(loanRequirement)}
              </p>
              <p
                className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--hl-muted)]"
                aria-label={`${formatInr(propertyValue)} property minus ${formatInr(downPayment)} down payment equals ${formatInr(loanRequirement)} loan required`}
              >
                <span className="font-semibold tabular-nums text-[var(--hl-navy)]">
                  {formatInr(propertyValue)}
                </span>
                <span aria-hidden>−</span>
                <span className="font-semibold tabular-nums text-[var(--hl-navy)]">
                  {formatInr(downPayment)}
                </span>
                <span aria-hidden>=</span>
                <span className="font-bold tabular-nums text-[var(--hl-navy)]">
                  {formatInr(loanRequirement)}
                </span>
              </p>
              {dpHint ? (
                <p className="mt-2 text-xs font-medium text-[var(--hl-orange)]" role="status">
                  {dpHint}
                </p>
              ) : null}
            </div>

            <fieldset>
              <legend className="text-sm font-bold text-[var(--hl-navy)]">Preferred Tenure</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {HOME_LOAN_TENURE_YEARS.map((years) => {
                  const active = tenureYears === years;
                  return (
                    <button
                      key={years}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTenureYears(years)}
                      className={`${chipBase} ${
                        active
                          ? 'bg-[var(--hl-navy)] text-white'
                          : 'border border-[var(--hl-border)] bg-white text-[var(--hl-navy)] hover:bg-[var(--hl-surface-2)]'
                      }`}
                    >
                      {active ? (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--hl-orange)]"
                          aria-hidden
                        />
                      ) : null}
                      {years} yrs
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--hl-radius-md)] bg-[var(--hl-navy)] px-6 text-sm font-semibold text-white transition duration-150 hover:bg-[var(--hl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] focus-visible:ring-offset-2"
              >
                Plan My Home Loan
              </button>
              <Link
                href={financeEligibilityPath({ loanType: 'home-loan' })}
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition duration-150 hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
              >
                Check Eligibility →
              </Link>
            </div>
            <p className="text-xs text-[var(--hl-muted)]">
              Illustrative planning only. EMI snapshots use a labeled default of{' '}
              {HOME_LOAN_ILLUSTRATIVE_RATE}% p.a. unless you adjust the rate.
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
            className="pointer-events-none absolute -right-2 top-2 h-32 w-32 rounded-full bg-[var(--hl-orange-soft)] opacity-55"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-6 h-28 w-28 rounded-full bg-[var(--hl-surface-4)] opacity-90"
            aria-hidden
          />
          <div className="relative aspect-[16/10] w-full max-h-[410px]">
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
              imgClassName="max-h-[410px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
