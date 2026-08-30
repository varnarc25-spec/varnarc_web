# Construction analytics events

Central helper: `apps/web/src/lib/construction/analytics.ts`  
Transport: existing `trackAnalyticsEvent` → `POST /api/analytics/events`  
Wire format: `eventType: "custom"` with `metadata.construction_event` + `metadata.vertical: "construction"`.

Do **not** emit Construction events by calling `trackAnalyticsEvent` directly with ad-hoc shapes — use the helpers below.

## Privacy rules

Never send:

- Personal data (name, email, phone, user ids as free text)
- Uploaded content / documents / BOQ line text
- Exact financial amounts, budgets, unit prices, or totals
- Free-text search queries or place names (city/region strings)
- Private project notes or titles

Safe patterns:

- `logged_in` boolean
- `calculator_type`, `unit`, `page_key`, `category_key` (opaque ids/slugs)
- `location_level`: `city` | `state` | `national` | `unknown` (level only)
- `result_range_category`: `low` | `mid` | `high` | `unknown`
- Query/result **buckets** (`short` / `medium` / `long`, `none` / `few` / `many`)

`sanitizeConstructionAnalyticsMetadata()` strips known sensitive keys and oversized / nested values.

## Event catalog

| Event                              | When                                                            | Typical metadata                                                                                         |
| ---------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `construction_page_view`           | User lands on a Construction route (beacon)                     | `page_key`, `logged_in`                                                                                  |
| `construction_category_view`       | Category filter present on listings                             | `category_key`                                                                                           |
| `calculator_started`               | User begins a calculation submit                                | `calculator_type`, `logged_in`                                                                           |
| `calculator_completed`             | Calculation succeeds                                            | `calculator_type`, `unit?`, `location_level`, `result_range_category`, `logged_in`                       |
| `calculator_error`                 | Calculation fails                                               | `calculator_type`, `error_code`, `logged_in`                                                             |
| `calculator_reset`                 | User resets calculator form                                     | `calculator_type`                                                                                        |
| `reverse_calculator_started`       | User begins a reverse-mode calculation                          | `calculator_type`, `calc_mode: reverse`, `logged_in`                                                     |
| `reverse_calculator_completed`     | Reverse calculation succeeds (tracked independently of forward) | `calculator_type`, `calc_mode: reverse`, `unit?`, `location_level`, `result_range_category`, `logged_in` |
| `reverse_calculator_error`         | Reverse calculation fails                                       | `calculator_type`, `calc_mode: reverse`, `error_code`, `logged_in`                                       |
| `calculation_shared`               | Share / copy shareable URL                                      | `calculator_type`, `logged_in`                                                                           |
| `calculation_saved`                | Saved calculation to account                                    | `calculator_type`, `logged_in`                                                                           |
| `calculation_added_to_project`     | Result attached to a project                                    | `calculator_type`, `logged_in`                                                                           |
| `project_created`                  | New project created (e.g. estimate save)                        | `logged_in`                                                                                              |
| `project_updated`                  | Project fields saved                                            | `logged_in`                                                                                              |
| `boq_generated`                    | BOQ export/generate succeeds                                    | `logged_in`, `item_count_bucket`                                                                         |
| `comparison_started`               | Compare view opened with ≥2 ids                                 | `comparison_item_count`                                                                                  |
| `comparison_completed`             | Compare results rendered / saved                                | `comparison_item_count`, `logged_in`                                                                     |
| `material_selector_started`        | Selector opened / task chosen                                   | `task_id`                                                                                                |
| `material_selector_completed`      | Suggestions shown                                               | `task_id`, `answer_keys`, `result_count`                                                                 |
| `material_selector_result_clicked` | Calculator / material / comparison click                        | `task_id`, `suggestion_id`, `target_type`, `target_path`                                                 |
| `price_viewed`                     | Material/price surface viewed                                   | `material_key?`, `location_level`                                                                        |
| `price_position_viewed`            | Price position result shown                                     | `material_key?`, `location_level`, `position_band`                                                       |
| `price_location_changed`           | Price location filter changed                                   | `location_level`                                                                                         |
| `search_performed`                 | Construction search/filter query present                        | `surface`, `query_length_bucket`, `result_count_bucket?`                                                 |
| `search_result_clicked`            | User clicks a search/listing result                             | `surface`, `result_type`                                                                                 |
| `construction_search_no_result`    | Search returns zero results                                     | `surface`, `query_length_bucket`                                                                         |
| `guide_clicked`                    | Guide card/link clicked                                         | `guide_key?`                                                                                             |
| `supplier_clicked`                 | Supplier listing clicked                                        | `supplier_key?`                                                                                          |
| `intent_card_clicked`              | Intent navigator select / next-action click                     | `intent_key`, `action` (`select` \| `next_action`), `next_action_key?`                                   |
| `landing_cta_clicked`              | Landing CTAs (hero, sticky, estimator)                          | `cta_key`, `surface`                                                                                     |
| `what_next_clicked`                | Smart "What next?" actions on calculator results                | `calculator_type`, `action_id`, `logged_in`, `has_projects`                                              |
| `ask_search_performed`             | Ask Construction submit / results view                          | `intent`, `category`, `result_count_bucket`, `auto_routed`, `query_length_bucket`                        |
| `ask_result_clicked`               | Ask result / autocomplete / example click                       | `intent`, `result_type`                                                                                  |

## `calculator_completed` contract

Only these fields (plus path/session from the shared client):

```ts
{
  calculator_type: string;
  unit?: string | null;
  location_level?: 'city' | 'state' | 'national' | 'unknown';
  result_range_category?: 'low' | 'mid' | 'high' | 'unknown';
  logged_in: boolean;
}
```

## Components

| Component                      | Role                                               |
| ------------------------------ | -------------------------------------------------- |
| `ConstructionAnalyticsBeacon`  | Page/category/search beacons under `/construction` |
| `ConstructionCompareAnalytics` | Compare funnel                                     |
| `ConstructionTrackLink`        | Guide / supplier / search-result clicks            |

## Usage

```ts
import {
  trackCalculatorStarted,
  trackCalculatorCompleted,
  categorizeConstructionResultRange,
  resolveConstructionLocationLevel,
} from '@/lib/construction/analytics';

trackCalculatorStarted({ calculator_type: 'cost_estimator', logged_in: isAuthenticated });

trackCalculatorCompleted({
  calculator_type: 'cost_estimator',
  unit: 'sqft',
  location_level: resolveConstructionLocationLevel({ hasState: Boolean(region) }),
  result_range_category: categorizeConstructionResultRange(Number(totalCost)),
  logged_in: isAuthenticated,
});
```
