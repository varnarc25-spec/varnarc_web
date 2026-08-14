# 38 — Loans Ecosystem Implementation Checklist

Tracks delivery against [`38-Loans-Ecosystem-PLAN.md`](./38-Loans-Ecosystem-PLAN.md).

**Started:** 2026-08-11

## Phase 1 — Data architecture

| Item                                                         | Status     |
| ------------------------------------------------------------ | ---------- |
| Plan document                                                | ✅         |
| Extend `FinanceCategory` for loan hub                        | ✅         |
| Extend `Bank` (lender fields)                                | ✅         |
| Extend `Loan` (product fields)                               | ✅         |
| Add `LoanRateHistory`                                        | ✅         |
| Add `ContentSource`                                          | ✅         |
| Extend `FinanceFaq` polymorphic scope                        | ✅         |
| Extend `FinanceComparison` SEO fields                        | ✅         |
| Prisma migration `20260811090000_loans_ecosystem_phase1`     | ✅ applied |
| Zod schemas (`packages/validation/src/finance.ts`)           | ✅         |
| Repository methods (filters, by-slug, rate history, sources) | ✅         |
| Seed loan categories (8 hub categories, no fabricated rates) | ✅         |
| Generate Prisma client + package builds                      | ✅         |

## Phase 2 — Loan hub

| Item                                                  | Status |
| ----------------------------------------------------- | ------ |
| Hub redesign (`/finance/loans`)                       | ✅     |
| Loan finder (no login)                                | ✅     |
| Category pills + shareable query filters/sort         | ✅     |
| Featured offers + product cards (rates/fees/verified) | ✅     |
| Compare checkbox + sticky bar                         | ✅     |
| Disclaimer + ads                                      | ✅     |
| Educational sections + guides + FAQs + calculators    | ✅     |
| API `GET /finance/loan-categories`                    | ✅     |

## Phase 3 — Category pages

| Item                       | Status |
| -------------------------- | ------ |
| Reusable category template | ⏳     |
| CMS-editable sections      | ⏳     |
| Filters / sort / compare   | ⏳     |

## Phase 4 — Product detail

| Item                   | Status |
| ---------------------- | ------ |
| Slug detail page       | ⏳     |
| UUID → canonical 301   | ⏳     |
| Verification + sources | ⏳     |

## Phase 5 — Comparison

| Item                          | Status |
| ----------------------------- | ------ |
| Interactive compare           | ⏳     |
| SEO compare URLs              | ⏳     |
| noindex for arbitrary queries | ⏳     |

## Phases 6–10 — Calculators

| Item                                      | Status          |
| ----------------------------------------- | --------------- |
| EMI engine enhancements                   | ⏳              |
| Eligibility calculator                    | and URL aliases | ⏳  |
| Prepayment / refinance / flat vs reducing | ⏳              |

## Phases 11–12 — Admin + CMS

| Item                 | Status |
| -------------------- | ------ |
| Tabbed loan editor   | ⏳     |
| Rate review workflow | ⏳     |
| Sources admin        | ⏳     |
| Content wiring       | ⏳     |

## Phases 13–18 — SEO, perf, a11y, tests

| Item                     | Status |
| ------------------------ | ------ |
| Sitemap + schema         | ⏳     |
| Perf / responsive / a11y | ⏳     |
| Automated tests          | ⏳     |

## Notes

- Do not rename `Loan` / `Bank` / `FinanceCategory` tables.
- Do not fabricate rates in seeds or templates.
- Prefer additive migrations only.
- Existing `/finance/loans/{uuid}` remains until Phase 4 redirect.
