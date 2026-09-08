# Construction Cost Intelligence architecture

Do **not** rebuild the Construction module. This layer extends tables that already exist.

## Reuse (do not duplicate)

| Need                              | Existing                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Country / state / city / locality | `construction_locations` (tree). Added `DISTRICT` only.                          |
| Materials / brands / categories   | `construction_materials`, `construction_brands`, `construction_categories`       |
| Dated material prices             | `construction_material_prices` (extended with provenance)                        |
| Labour/work rates                 | `construction_cost_rates` still used; detailed trades in `construction_labour_*` |
| Quick ₹/sq ft packs               | `cost_templates`, `construction_estimators`, `construction_benchmark_rates`      |
| User projects / BOQ / phases      | `construction_projects`, `construction_boqs`, `construction_project_phases`      |
| Saved calculators                 | `construction_calculations`, `saved_calculations`                                |
| Comparisons / guides              | `construction_comparisons`, `construction_guides`                                |
| Directory                         | `Business`                                                                       |
| Auth / audit / media / SEO        | existing platform tables                                                         |
| Public calculators                | `@varnarc/validation` engines + `CalculatorShell`                                |

## New

Rate sources, specifications, labour trades/rates, equipment, professional services, phase templates, work items/resources, productivity, wastage, quality tiers mapped to specs (not only multipliers), interiors, location factors, national/state **benchmark** ₹/sq ft (quick estimate only), user overrides, import batches, rate audit logs.

## Pricing rule

- Quick estimator: `ConstructionBenchmarkRate` (always labelled indicative / derived).
- Detailed BOQ: quantity × resolved rate + labour productivity + equipment + fees + contingency → LOW / EXPECTED / HIGH.
- Never label `ESTIMATED_FALLBACK` or `DERIVED` as live market or official SOR.

## Rate resolution

`resolveRate()` in `@varnarc/validation` (`construction-rate-resolution`): locality → city → district → state → national → fallback.
