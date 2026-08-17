# Car Loan product schema notes

## Existing DB columns (already on `Loan`)

- `prepaymentChargeText` / `foreclosureChargeText` — exposed in admin edit + web type
- `rateType`, amounts, tenure, processing fee, eligibility, `officialApplicationUrl`, `rateLastVerifiedAt`
- `metadata` (JSON) — preferred store for car-specific fields until first-class columns are needed

## Recommended `Loan.metadata` keys (car products)

| Key                        | Type                        | Notes                           |
| -------------------------- | --------------------------- | ------------------------------- |
| `vehicleCondition`         | `'new' \| 'used' \| 'both'` | Used by offer columns + filters |
| `vehicleAgeMax`            | number (years)              | Display / future filters        |
| `financingPercentageMin`   | number 0–100                | Product financing range         |
| `financingPercentageMax`   | number 0–100                | Product financing range         |
| `vehicleValuationRequired` | boolean                     | Educational / eligibility UI    |

Admin: **Edit loan** shows these controls when `loanType` matches car/auto/vehicle.

## Filters

Query params on `/finance/loans/car-loan`:

- `vehicleCondition=new|used`
- `financingPercentMin=<0-100>`

API list + client-side catalog filtering both apply. Products without metadata are excluded when a car-specific filter is active (no fabricated matches).

## Future first-class columns (optional)

Add Prisma columns only if SQL filtering volume requires it; do not overload unrelated fields.
