# Construction UI foundation

Reusable layout and calculator primitives for `/construction`. Extend these instead of inventing one-off markup per page.

## Recommended module layout

```text
apps/web/src/components/construction/
  index.ts                 # public barrel
  styles.ts                # shared class tokens
  types.ts                 # shared prop types
  construction-page-shell.tsx
  construction-hero.tsx
  construction-breadcrumbs.tsx
  construction-section.tsx
  tool-card.tsx
  material-card.tsx
  feature-card.tsx
  result-card.tsx          # ResultCard + MetricCard
  comparison-card.tsx
  construction-faq.tsx
  empty-state.tsx
  loading-state.tsx
  error-state.tsx
  sticky-mobile-cta.tsx
  related-tools.tsx
  related-guides.tsx
  calculator/
    calculator-shell.tsx
    calculator-form.tsx
    calculator-input.tsx
    calculator-select.tsx  # CalculatorSelect + UnitSelector
    calculation-result.tsx
    assumption-panel.tsx   # AssumptionPanel + MethodologyPanel
    index.ts

apps/web/src/lib/construction/
  routes.ts                # path helpers
  index.ts
  # future: formulas/, assumptions/, analytics.ts

apps/web/src/app/construction/
  # route pages only — compose foundation components

apps/api/src/modules/construction/
packages/validation/src/construction.ts
packages/database/.../construction/
```

Keep **business logic and formulas** in `lib/construction/` (or API services), not inside presentation components.

## Page patterns

### Catalog / content page

```tsx
import {
  ConstructionPageShell,
  ConstructionSection,
  MaterialCard,
  RelatedTools,
  EmptyState,
} from '@/components/construction';

export default function MaterialsPage() {
  return (
    <ConstructionPageShell
      title="Construction materials"
      description="Browse cement, steel, tiles, and more."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Materials' },
      ]}
    >
      <ConstructionSection title="Materials">
        {items.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <MaterialCard key={m.id} name={m.name} href={`/construction/materials/${m.id}`} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="No materials yet" message="Check back soon." />
        )}
      </ConstructionSection>
      <RelatedTools items={calculatorLinks} />
    </ConstructionPageShell>
  );
}
```

### Calculator page (do not invent a new shell)

```tsx
'use client';

import {
  CalculatorShell,
  CalculatorForm,
  CalculatorInput,
  UnitSelector,
  CalculationResult,
  CalculationBreakdown,
  AssumptionPanel,
  MethodologyPanel,
} from '@/components/construction';

export function CementCalculatorClient() {
  // compute result in lib/construction formulas — not here
  return (
    <CalculatorShell
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cement calculator' },
      ]}
      title="Cement calculator"
      description="Estimate cement bags from volume. Indicative only."
      lastUpdated="20 Aug 2026"
      form={
        <CalculatorForm onSubmit={onSubmit} onReset={onReset}>
          <CalculatorInput id="volume" label="Volume" type="number" required suffix="m³" />
          <UnitSelector
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'm3', label: 'm³' },
              { value: 'ft3', label: 'ft³' },
            ]}
          />
        </CalculatorForm>
      }
      result={
        result ? (
          <CalculationResult
            label="Estimated cement"
            value={result.bags}
            unit="bags"
            metrics={[{ label: 'Weight', value: `${result.kg} kg` }]}
          />
        ) : undefined
      }
      breakdown={<CalculationBreakdown rows={breakdownRows} />}
      assumptions={<AssumptionPanel items={assumptionItems} />}
      methodology={
        <MethodologyPanel
          formula="Bags = Volume × cement factor × (1 + wastage)"
          steps={['Convert units', 'Apply mix ratio', 'Add wastage']}
        />
      }
      relatedTools={[{ href: '/calculators/concrete', label: 'Concrete calculator' }]}
      faqs={faqs}
      stickyCta={{ primary: { label: 'Calculate', onClick: submit } }}
    />
  );
}
```

## Rules

1. **One H1 per page** — `ConstructionPageShell` or `CalculatorShell` owns it.
2. **Auth only for persistence** — calculators work logged out.
3. **Never present estimates as guaranteed** — use ResultCard / CalculationResult hint copy.
4. **Sponsored listings** — use MaterialCard `sponsored` badge; do not relabel as “recommended”.
5. **Reuse tokens** from `styles.ts` (`cx.input`, `cx.focus`, `cx.primaryBtn`) for new Construction controls.
6. **Module hub** (`/construction`) continues to use `ModuleHubShell` — this foundation is for subpages and calculators.
7. Existing imports from `construction-material-card` remain supported via re-exports.

## Component map

| Component                                                | Use for                                   |
| -------------------------------------------------------- | ----------------------------------------- |
| ConstructionPageShell                                    | Standard Construction subpage layout      |
| ConstructionHero                                         | Optional dark hero band                   |
| ConstructionBreadcrumbs                                  | Breadcrumb nav (wraps shared Breadcrumbs) |
| ConstructionSection                                      | Titled content sections                   |
| ToolCard / FeatureCard / MaterialCard / ComparisonCard   | Discovery grids                           |
| ResultCard / MetricCard                                  | Numbers and KPI tiles                     |
| CalculatorShell                                          | Full calculator page slots                |
| CalculatorForm / Input / Select / UnitSelector           | Accessible form controls                  |
| CalculationResult / Breakdown                            | Results + table breakdown                 |
| AssumptionPanel / MethodologyPanel                       | Transparency                              |
| RelatedTools / RelatedGuides / ConstructionFAQ           | Internal linking                          |
| RelatedMaterials / RelatedComparisons / RelatedCityPages | SEO internal links                        |
| RelatedCalculatorLinks / ConstructionRelatedLinks        | Composed related blocks                   |
| ConstructionSeo                                          | JSON-LD + last-updated stamp              |
| ConstructionAnalyticsBeacon / ConstructionTrackLink      | Structured analytics                      |
| EmptyState / LoadingState / ErrorState                   | Async UX                                  |
| StickyMobileCTA                                          | Mobile primary action                     |

## Analytics

Use `lib/construction/analytics.ts` only — see [`lib/construction/ANALYTICS.md`](../../lib/construction/ANALYTICS.md).

```ts
import { trackCalculatorCompleted } from '@/lib/construction/analytics';
```

**SEO architecture**

Use shared helpers in `lib/construction/seo.ts` (defaults in `seo-pages.ts`) instead of one-off `metadata` objects.

```tsx
// generateMetadata
export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('materials', { searchParams: params });
}

// page body
<ConstructionSeo
  breadcrumbs={constructionHubBreadcrumbs([{ name: 'Materials', path: '/construction/materials' }])}
  faqs={faqs}
  itemList={{ name: '…', path: '/construction/materials', items }}
  webApplication={{ name: '…', path: '/construction/estimate' }} // calculators only
  lastUpdated={updatedAt}
/>
<ConstructionRelatedLinks calculators={…} materials={…} guides={…} />
```

**Indexing rules**

- Filter/query pages (`categoryId`, `sort`, `q`, `ids`, …) → `noindex,follow` + canonical to clean path
- Calculator share params (`volume`, `length`, `wastage`, …) → `noindex,follow` + canonical to clean tool URL
- Private routes (`/construction/projects`) → `noindex,nofollow`

**JSON-LD** — only emit types that match the page (`BreadcrumbList`, `Article`, `ItemList`, `FAQPage` with ≥2 Q&As, `WebApplication` **or** `SoftwareApplication`, never both).
