# Construction data architecture

## Reuse (no new table)

| Need                                  | Existing                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Material categories                   | `construction_categories`                                                   |
| Brands                                | `construction_brands`                                                       |
| Materials                             | `construction_materials`                                                    |
| Estimate templates                    | `cost_templates` / `construction_estimators`                                |
| Editorial comparisons                 | `construction_comparisons`                                                  |
| Guides / FAQs / checklists            | existing CMS tables                                                         |
| Suppliers / contractors               | Directory `Business` (+ categories); expenses link via `vendor_business_id` |
| Generic calculator defs / saved calcs | `calculators`, `calculator_versions`, `saved_calculations`                  |
| File blobs                            | Media library (`media_id` on documents)                                     |

## New / extended

| Entity           | Table                                         | Role                                                     |
| ---------------- | --------------------------------------------- | -------------------------------------------------------- |
| Location         | `construction_locations`                      | Country→state→city→locality hierarchy for rates/prices   |
| Material price   | `construction_material_prices`                | Dated prices + source/freshness                          |
| Cost rate        | `construction_cost_rates`                     | Labor/built-up rates + methodology version               |
| Calculation      | `construction_calculations`                   | Project/user calc with assumptions + methodology version |
| BOQ + items      | `construction_boqs`, `construction_boq_items` | Bill of quantities                                       |
| Phase            | `construction_project_phases`                 | Timeline                                                 |
| Budget item      | `construction_budget_items`                   | Planned budget                                           |
| Expense          | `construction_expenses`                       | Actual spend                                             |
| Price alert      | `construction_price_alerts`                   | User alerts                                              |
| Saved comparison | `construction_saved_comparisons`              | User-owned compare sets                                  |
| Document         | `construction_documents`                      | Project docs                                             |

`construction_projects` extended with `status`, `location_id`, `currency`, `quality`, dates.

## Money & units

- Money: `Decimal(14,2)` in DB; Zod `moneyAmountSchema` enforces 2dp
- Default currency: `INR`
- Units: string columns constrained by `CONSTRUCTION_UNITS` in `@varnarc/validation`
