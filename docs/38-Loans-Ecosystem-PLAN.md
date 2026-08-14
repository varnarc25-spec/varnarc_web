# 38 — Varnarc Loans Ecosystem Plan

**Status:** Planning complete · Phase 1 implementation started  
**Last updated:** 2026-08-11  
**Scope:** Transform Finance → Loans into a production-grade loan comparison ecosystem  
**Companion:** [`38-Loans-Ecosystem-IMPLEMENTATION.md`](./38-Loans-Ecosystem-IMPLEMENTATION.md)

---

## 1. Architecture audit (existing)

### Stack

| Layer      | Location              | Tech                                        |
| ---------- | --------------------- | ------------------------------------------- |
| Web        | `apps/web`            | Next.js 15 App Router, React 19, Tailwind 4 |
| Admin      | `apps/admin`          | Next.js admin + BFF proxies                 |
| API        | `apps/api`            | NestJS + ZodValidationPipe                  |
| DB         | `packages/database`   | Neon PostgreSQL + Prisma                    |
| Validation | `packages/validation` | Zod schemas                                 |
| Auth       | `packages/auth`       | Auth0 + `FINANCE_*` RBAC                    |

### What already exists for loans

| Capability       | Implementation                                              |
| ---------------- | ----------------------------------------------------------- |
| Loan catalog     | Prisma `Loan` + `Bank` + `FinanceCategory`                  |
| Public listing   | `/finance/loans`                                            |
| Product detail   | `/finance/loans/[id]` (**UUID**, not slug)                  |
| Admin CRUD       | `/finance/loans`, CSV import/export, publish                |
| Compare (thin)   | `/finance/compare?type=loans&ids=` + `FinanceComparison`    |
| Rate history     | `InterestRate` linked to loan/bank                          |
| FAQs / guides    | `FinanceFaq`, `FinanceGuide`                                |
| EMI calculators  | Calculator engine + seeded EMI suite                        |
| SEO              | Finance page SEO, sitemap type `finance`, JSON-LD on detail |
| Ads / disclaimer | `AdBanner`, `HubDisclaimer`                                 |
| Eligibility logs | `LoanEligibilityCheck`                                      |

### Canonical entity names (do not rename)

| Spec name       | Existing model      | Strategy                                                                              |
| --------------- | ------------------- | ------------------------------------------------------------------------------------- |
| LoanCategory    | `FinanceCategory`   | **Extend** with loan hub fields (nullable for non-loan categories) + `loanHubEnabled` |
| Lender          | `Bank`              | **Extend** with lender metadata fields                                                |
| LoanProduct     | `Loan`              | **Extend** with rates/fees/eligibility/source/verification fields                     |
| LoanFAQ         | `FinanceFaq`        | **Extend** with polymorphic scope (`entityType` / `entityId`)                         |
| LoanRateHistory | `InterestRate`      | Keep + add `LoanRateHistory` for product-level min/max snapshots                      |
| Comparison      | `FinanceComparison` | **Extend** for SEO compare pages under `/finance/loans/compare/[slug]`                |
| Article         | CMS `Article`       | Reuse; relate via tags / `ArticleRelated` / guide category                            |

### Critical URLs that must not break

- `/finance`, `/finance/loans`, `/finance/loans/{uuid}`
- `/finance/compare?type=loans&ids=...`
- `/finance/categories/{slug}`, `/finance/banks/{slug}`
- `/calculators/emi`, `/calculators/personal-loan-emi`, `/calculators/home-loan-emi`, `/calculators/car-loan`, `/calculators/loan-eligibility`, `/calculators/loan-prepayment`, etc.
- Seeded articles and `/disclaimer`

---

## 2. Compatibility risks

| Risk                                                                | Mitigation                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Route clash: `[id]` UUID vs `personal-loan` slug                    | Single smart segment: if UUID → load loan + **301** to canonical `/finance/loans/{categorySlug}/{productSlug}`; else treat as category slug |
| Renaming `Loan` → `LoanProduct`                                     | **Do not rename** table/model; use domain language “loan product” in UI/docs                                                                |
| Renaming `Bank` → `Lender`                                          | **Do not rename**; UI label “Lender”                                                                                                        |
| Dual compare systems (`FinanceComparison` vs platform `Comparison`) | Loan SEO compares use `FinanceComparison` with `entityType=loan`; platform compare remains for cross-module                                 |
| Fabricated rates                                                    | All rate fields nullable; require `rateLastVerifiedAt` + `sourceUrl` for public display of rates                                            |
| Hardcoded product data in templates                                 | Hub/category/product pages fetch via API/repos only; static fallbacks only for empty CMS copy                                               |
| Breaking Zod/API contracts                                          | Additive optional fields; existing create/update schemas use `.partial()` extensions                                                        |
| FinanceCategory used by cards/insurance                             | New loan fields nullable; `loanHubEnabled` gates loan hub pills                                                                             |
| Calculator slug aliases                                             | Prefer **aliases/redirects** for requested URLs (`emi-calculator` → `emi`) rather than duplicate calculator rows                            |

---

## 3. Route plan

### Public (web)

| URL                                           | Purpose                            | Notes                                   |
| --------------------------------------------- | ---------------------------------- | --------------------------------------- |
| `/finance/loans`                              | Loan hub                           | Redesign Phase 2                        |
| `/finance/loans/compare`                      | Interactive compare (2–4 products) | `noindex` when arbitrary query          |
| `/finance/loans/compare/[slug]`               | Admin-approved SEO compare         | Indexable when PUBLISHED                |
| `/finance/loans/[categorySlug]`               | Category template                  | e.g. `personal-loan`                    |
| `/finance/loans/[categorySlug]/[productSlug]` | Product detail                     | e.g. `personal-loan/hdfc-personal-loan` |
| `/finance/loans/[uuid]`                       | Legacy detail                      | **301** → canonical slug URL            |

Keep existing sibling finance routes unchanged.

### Calculator URL strategy

| Requested URL                               | Existing / action                           |
| ------------------------------------------- | ------------------------------------------- |
| `/calculators/emi-calculator`               | Redirect → `/calculators/emi`               |
| `/calculators/personal-loan-emi-calculator` | Redirect → `/calculators/personal-loan-emi` |
| `/calculators/home-loan-emi-calculator`     | Redirect → `/calculators/home-loan-emi`     |
| `/calculators/car-loan-emi-calculator`      | Redirect → `/calculators/car-loan`          |
| Remaining new calculators                   | Seed via calculator engine when missing     |

### Admin

```
Finance
  Loans
    Categories      → /finance/categories (loan hub filter) + loan fields
    Lenders         → /finance/banks
    Loan Products   → /finance/loans (tabbed editor)
    Rate Updates    → /finance/rates + rate history
    Comparisons     → /finance/comparisons
    FAQs            → /finance/faqs
    Calculators     → link to existing calculator admin
    Loan Content    → guides + CMS articles tagged finance/loans
    Sources         → /finance/sources (new)
```

### API (additive)

```
GET  /finance/loans?category=&bank=&rateMax=&amountMin=&tenureMin=&sort=&creditScore=&employment=
GET  /finance/loans/by-slug/:categorySlug/:productSlug
GET  /finance/loan-categories          (loanHubEnabled=true)
GET  /finance/loans/compare/:slug
POST /finance/admin/loan-rate-history
CRUD /finance/admin/content-sources
```

Preserve existing `GET /finance/loans/:id`.

---

## 4. Database migration plan

### Phase 1A — Extend `finance_categories`

Additive columns (all nullable unless noted):

- `short_description`, `introduction`, `icon`, `featured_image`, `hero_image`
- `min_interest_rate`, `max_interest_rate`
- `typical_min_amount`, `typical_max_amount`, `typical_min_tenure`, `typical_max_tenure`
- `meta_title`, `meta_description`, `seo_content` (text/json)
- `status` (PublishStatus, default DRAFT for new; backfill PUBLISHED for existing)
- `published_at`
- `loan_hub_enabled` Boolean default false
- `content_sections` Json? (CMS-editable section map for category template)

### Phase 1B — Extend `banks` (Lender)

- `legal_name`, `lender_type`, `headquarters`, `support_url`, `source_url`

### Phase 1C — Extend `loans` (LoanProduct)

Rate & amount:

- `interest_rate_min`, `interest_rate_max` (keep legacy `interest_rate` as display fallback / migrate)
- `rate_type`, `benchmark_type`
- `loan_amount_min`, `loan_amount_max` (keep `max_amount`)
- `processing_fee_min`, `processing_fee_max`, `processing_fee_text`
- Charge texts: `foreclosure_charge_text`, `prepayment_charge_text`, `late_payment_charge_text`

Eligibility / content:

- `minimum_age`, `maximum_age`, `minimum_income`, `minimum_credit_score`
- `employment_types` Json?
- `eligibility_summary`, `documents_required` Json?/text
- `features`, `benefits`, `disadvantages` (text or Json)
- `application_process`, `approval_time`, `disbursement_time`
- `official_application_url`, `source_url`
- `rate_last_verified_at`
- `sponsored`, `sponsored_disclosure`
- `canonical_url`
- `short_description`
- `needs_rate_review` Boolean generated/maintained by admin job

Indexes: `(category_id, slug)` unique for public URLs; keep `(bank_id, slug)`.

### Phase 1D — New tables

**`loan_rate_histories`**

- `loan_id`, `interest_rate_min`, `interest_rate_max`, `source_url`, `effective_date`, `verified_at`, audit fields

**`content_sources`**

- `name`, `source_url`, `retrieved_at`, `verified_at`, `notes`, `entity_type`, `entity_id`, status/audit

**`loan_category_faqs` / extend `finance_faqs`**

Prefer extend `finance_faqs`:

- `entity_type` (`loan_hub` | `loan_category` | `loan` | `calculator` | `article` | null)
- `entity_id` nullable UUID

### Phase 1E — Extend `finance_comparisons`

- `seo_title`, `seo_description`, `intro`, `canonical_url`
- `robots` / `noindex` Boolean
- `methodology_note`
- Ensure `entity_type = 'loan'` + slug pattern `hdfc-vs-sbi-personal-loan`

### Seed (Phase 1F)

Loan categories (loan_hub_enabled):

`personal-loan`, `home-loan`, `car-loan`, `education-loan`, `business-loan`, `gold-loan`, `two-wheeler-loan`, `loan-against-property`

No fabricated product rates in seed — placeholder DRAFT products only if needed for UI wiring.

---

## 5. Files to create / modify

### Create

| Path                                                                         | Purpose                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------- |
| `docs/38-Loans-Ecosystem-PLAN.md`                                            | This plan                                |
| `docs/38-Loans-Ecosystem-IMPLEMENTATION.md`                                  | Phase checklist                          |
| `packages/database/prisma/migrations/20260811090000_loans_ecosystem_phase1/` | Schema migration                         |
| `packages/database/src/seed-loan-categories.ts`                              | Category seed                            |
| `packages/validation/src/loans-ecosystem.ts`                                 | Extended Zod                             |
| `apps/web/src/components/loans/*`                                            | Hub, filters, cards, disclaimer, compare |
| `apps/web/src/app/finance/loans/compare/**`                                  | Compare routes                           |
| `apps/web/src/app/finance/loans/[categorySlug]/**`                           | Category + product                       |
| `apps/admin/src/app/finance/sources/**`                                      | Content sources admin                    |
| `apps/api/test/loans-*.spec.ts`                                              | Formula/filter/SEO tests                 |

### Modify

| Path                                                               | Purpose                                      |
| ------------------------------------------------------------------ | -------------------------------------------- |
| `packages/database/prisma/schema.prisma`                           | Extend models                                |
| `packages/database/src/repositories/finance/finance.repository.ts` | Filters, by-slug, rate history               |
| `packages/validation/src/finance.ts`                               | Extended loan/bank/category schemas          |
| `apps/api/src/modules/finance/**`                                  | New endpoints, filters, sorting              |
| `apps/web/src/app/finance/loans/page.tsx`                          | Hub redesign                                 |
| `apps/web/src/app/finance/loans/[id]/page.tsx`                     | → smart redirect / replace with categorySlug |
| `apps/web/src/services/finance.ts`                                 | Client fetch helpers                         |
| `apps/web/src/components/finance/finance-product-card.tsx`         | Richer loan cards                            |
| `apps/admin/src/app/finance/loans/**`                              | Tabbed product editor                        |
| `apps/admin/src/components/finance-forms.tsx`                      | New fields                                   |
| `apps/admin/src/components/admin-nav-config.ts`                    | Loans submenu                                |
| SEO sitemap repo                                                   | Loan category + slug product URLs            |

---

## 6. Component architecture (web)

```
components/loans/
  loan-disclaimer.tsx              # reusable disclosure
  loan-sponsored-disclosure.tsx
  loan-hub-hero.tsx                # H1, pills, finder
  loan-finder-form.tsx             # no login
  loan-filters.tsx                 # sidebar / drawer / shareable query
  loan-sort-select.tsx
  loan-product-card.tsx            # rates as ranges + verified date
  loan-product-grid.tsx
  loan-compare-bar.tsx             # sticky after selection
  loan-compare-table.tsx
  loan-category-sections.tsx       # CMS-driven sections
  loan-emi-example.tsx
  loan-faq-accordion.tsx
```

Reuse: `ContentLayout`, `AdBanner`, `@varnarc/ui`, hub tokens (`#0b1f3a`, `#f97316`), existing calculator runner.

**Rules:** semantic HTML, keyboard filters, no color-only comparison cues, lazy images below fold, SSR primary SEO content, paginate product lists.

---

## 7. Admin architecture

- Extend existing Finance admin; do not create a second design system
- Tabbed loan product editor: General · Rates · Amount & Tenure · Fees · Eligibility · Documents · Features · Application · Source & Verification · SEO · Publishing
- List columns: Product, Lender, Category, Rate, Last Verified, Featured, Sponsored, Status, Updated
- Filters: Category, Lender, Status, Needs Rate Review, Featured, Sponsored
- Bulk: Publish, Unpublish, Mark for review, Update verification date
- “Needs Review” when `rate_last_verified_at` older than configurable freshness (settings key)
- Audit: use existing `created_by` / `updated_by` + admin audit log if present

---

## 8. Phase delivery order

| Phase     | Focus                                                               | Depends on        |
| --------- | ------------------------------------------------------------------- | ----------------- |
| **1**     | Data architecture (schema, validation, repos, seed categories)      | —                 |
| **2**     | Loan hub UI + filters/sort + disclaimer                             | 1                 |
| **3**     | Category template (CMS sections)                                    | 1–2               |
| **4**     | Product detail + UUID redirects                                     | 1–3               |
| **5**     | Comparison engine + SEO compare URLs                                | 1, 4              |
| **6–10**  | Calculators (EMI, eligibility, prepay, refinance, flat vs reducing) | Calculator engine |
| **11–12** | Admin tabs + CMS wiring                                             | 1                 |
| **13–17** | SEO, performance, responsive, a11y, disclosures                     | 2–5               |
| **18**    | Automated tests                                                     | Ongoing per phase |

---

## 9. Financial content rules (non-negotiable)

1. Never hardcode bank rates in React templates.
2. Never invent rates or “best loan” claims without editorial methodology stored in CMS.
3. Public rate display requires range + “Starting from” wording where appropriate + last verified date.
4. Always show `LoanDisclaimer`; sponsored items show extra disclosure.
5. External apply links labeled as leaving Varnarc / official website.
6. Eligibility calculator outputs are **indicative estimates** only.

---

## 10. Success criteria (MVP slice)

- [ ] Migration applied; Prisma client generated
- [ ] Eight loan categories seeded with `loanHubEnabled`
- [ ] Hub lists DB products with shareable filter query params
- [ ] Category + product slug URLs live; UUID 301 preserved
- [ ] Compare 2–4 products; admin SEO compare pages
- [ ] EMI + eligibility calculators wired with disclaimers
- [ ] Admin can edit rates with verification + source URL
- [ ] Tests for EMI formula, filters, published visibility, canonicals
