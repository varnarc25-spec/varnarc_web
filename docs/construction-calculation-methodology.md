# Construction calculation methodology

## Quick estimate

`built-up area × benchmark ₹/sq ft` (LOW–EXPECTED–HIGH ±12%). Uses `construction_benchmark_rates`. Public copy: **Indicative planning rate**.

## Detailed estimate (target)

Work item quantity × (material coeff + wastage) × resolved material rate

- labour days (qty / productivity) × labour rate
- equipment + subcontract + professional % + overhead + profit + tax + contingency.

Return a **range**, not a fake exact rupee.

## Quality

Tiers map to **specifications** (`construction_quality_specifications`), not only a multiplier. The legacy cost calculator still uses multipliers until BOQ work-item resources are fully populated.

## User overrides

`construction_user_rate_overrides` apply to that user/project only.
