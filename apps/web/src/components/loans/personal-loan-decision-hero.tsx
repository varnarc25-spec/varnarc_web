'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CmsMediaImage, CmsMediaPreload } from '@/components/cms/cms-media-image';
import {
  PERSONAL_LOAN_ILLUSTRATIVE_RATE,
  usePersonalLoanDecision,
} from '@/components/loans/personal-loan-decision-context';
import { loansHubPath, financeEligibilityPath } from '@/lib/finance-routes';
import { PERSONAL_LOAN_EMI_PRESETS } from '@/lib/personal-loan-page';

const TENURE_YEARS = [1, 2, 3, 5] as const;
const HERO_MEDIA = '(min-width: 1024px)';

const CHIP_LABELS: Record<number, string> = {
  1_00_000: '₹1L',
  3_00_000: '₹3L',
  5_00_000: '₹5L',
  10_00_000: '₹10L',
};

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function PersonalLoanDecisionHero({
  illustrationSrc,
  illustrationAlt,
}: {
  illustrationSrc: string;
  illustrationAlt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { amount, tenureYears, employmentType, setAmount, setTenureYears, setEmploymentType } =
    usePersonalLoanDecision();

  const [amountDigits, setAmountDigits] = useState(() => String(amount));
  const amountDisplay = useMemo(() => formatAmountDisplay(amountDigits), [amountDigits]);

  function syncAmountDigits(next: number) {
    setAmount(next);
    setAmountDigits(String(next));
  }

  function onFindOptions(e: FormEvent) {
    e.preventDefault();
    const digits = amountDigits.replace(/\D/g, '');
    const parsed = Number(digits);
    if (Number.isFinite(parsed) && parsed > 0) setAmount(parsed);

    const filters: Record<string, string | undefined> = {
      amountMin: String(Number.isFinite(parsed) && parsed > 0 ? parsed : amount),
      tenureMin: String(tenureYears * 12),
    };
    if (employmentType === 'salaried' || employmentType === 'self-employed') {
      filters.employmentType = employmentType;
    }

    startTransition(() => {
      router.push(
        loansHubPath({
          categorySlug: 'personal-loan',
          filters,
          hash: 'personal-loan-offers',
        }),
      );
    });
  }

  return (
    <header className="overflow-hidden rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-1)]">
      <CmsMediaPreload href={illustrationSrc} media={HERO_MEDIA} />
      <div className="grid items-center gap-5 p-1 sm:p-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 lg:p-4">
        <div className="min-w-0">
          <p className="pl-eyebrow">Personal Loans</p>
          <h1 className="mt-1.5 text-[1.5rem] font-extrabold tracking-tight text-[var(--pl-navy)] sm:text-[1.875rem] sm:leading-tight">
            Compare Personal Loans
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--pl-muted)]">
            Compare Personal Loan rates, monthly repayments, fees and eligibility from available
            lenders.
          </p>

          <form
            onSubmit={onFindOptions}
            className="mt-6 space-y-5"
            aria-label="Personal loan planner"
          >
            <div>
              <label htmlFor="pl-borrow-amount" className="text-sm font-bold text-[var(--pl-navy)]">
                How much do you want to borrow?
              </label>
              <div className="relative mt-3 border-b-2 border-[var(--pl-navy)]/85 pb-1 transition focus-within:border-[var(--pl-orange)]">
                <span
                  className="pointer-events-none absolute bottom-2 left-0 text-2xl font-bold text-[var(--pl-muted)] sm:text-3xl"
                  aria-hidden
                >
                  ₹
                </span>
                <input
                  id="pl-borrow-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amountDisplay}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setAmountDigits(digits);
                    const n = Number(digits);
                    if (Number.isFinite(n) && n > 0) setAmount(n);
                  }}
                  placeholder="5,00,000"
                  className="w-full border-0 bg-transparent py-1 pl-8 text-[2rem] font-extrabold tabular-nums tracking-tight text-[var(--pl-navy)] outline-none placeholder:text-slate-300 focus-visible:ring-0 sm:pl-9 sm:text-[2.5rem]"
                />
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2" role="group" aria-label="Amount presets">
                {PERSONAL_LOAN_EMI_PRESETS.map((preset) => {
                  const active = amount === preset.amount;
                  return (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => syncAmountDigits(preset.amount)}
                      className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] focus-visible:ring-offset-2 ${
                        active
                          ? 'bg-[var(--pl-navy)] text-white'
                          : 'bg-[var(--pl-surface-2)] text-[var(--pl-navy)] hover:bg-[var(--pl-surface-4)]'
                      }`}
                    >
                      {CHIP_LABELS[preset.amount] ?? preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => document.getElementById('pl-borrow-amount')?.focus()}
                  className="inline-flex min-h-10 items-center rounded-full bg-[var(--pl-surface-2)] px-3.5 text-xs font-semibold text-[var(--pl-navy)] hover:bg-[var(--pl-surface-4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] focus-visible:ring-offset-2"
                >
                  Custom
                </button>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-bold text-[var(--pl-navy)]">
                Preferred repayment period
              </legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {TENURE_YEARS.map((years) => {
                  const active = tenureYears === years;
                  return (
                    <button
                      key={years}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTenureYears(years)}
                      className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] focus-visible:ring-offset-2 ${
                        active
                          ? 'bg-[var(--pl-navy)] text-white'
                          : 'bg-[var(--pl-surface-2)] text-[var(--pl-navy)] hover:bg-[var(--pl-surface-4)]'
                      }`}
                    >
                      {years} {years === 1 ? 'year' : 'years'}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block text-xs font-semibold text-slate-700">
              Employment type <span className="font-normal text-slate-400">(optional)</span>
              <select
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(e.target.value as '' | 'salaried' | 'self-employed' | 'other')
                }
                className="mt-1.5 min-h-11 w-full max-w-xs rounded-[var(--pl-radius-md)] border border-[var(--pl-border)] bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]/30"
              >
                <option value="">Any</option>
                <option value="salaried">Salaried</option>
                <option value="self-employed">Self-employed</option>
                <option value="other">Other</option>
              </select>
            </label>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--pl-radius-md)] bg-[var(--pl-navy)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--pl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {pending ? 'Updating…' : 'Find Personal Loan Options'}
              </button>
              <Link
                href={financeEligibilityPath({ loanType: 'personal-loan' })}
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition hover:text-[var(--pl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
              >
                Estimate Eligibility →
              </Link>
            </div>
            <p className="text-xs text-[var(--pl-muted)]">
              Illustrative planning only. EMI snapshots use a labeled default of{' '}
              {PERSONAL_LOAN_ILLUSTRATIVE_RATE}% p.a. unless you adjust the rate.
            </p>
          </form>

          {/* Compact mobile artwork after primary interaction */}
          <div className="relative mx-auto mt-6 w-full max-w-sm lg:hidden">
            <div
              className="pointer-events-none absolute -right-1 top-0 h-16 w-16 rounded-full bg-[var(--pl-orange-soft)] opacity-70"
              aria-hidden
            />
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
            className="pointer-events-none absolute -right-2 top-2 h-28 w-28 rounded-full bg-[var(--pl-orange-soft)] opacity-60"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-6 h-24 w-24 rounded-full bg-[var(--pl-surface-4)] opacity-90"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-16 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--pl-orange)] opacity-70"
            aria-hidden
          />
          <div className="relative aspect-[16/10] w-full max-h-[310px]">
            <CmsMediaImage
              src={illustrationSrc}
              alt={illustrationAlt}
              width={640}
              height={360}
              media={HERO_MEDIA}
              sizes="(max-width: 1024px) 0px, 520px"
              objectFit="contain"
              loading="eager"
              fetchPriority="high"
              imgClassName="max-h-[310px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
