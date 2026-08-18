# Education Loan schema & government schemes

## Page

- Route: `/finance/loans/education-loan`
- Dedicated page: `EducationLoanPage` (branched from `LoanCategoryPage`)
- Design freeze after the 9.5+ government-support / study-interest pass unless usability, a11y, calculation, government-data, SEO, performance, or user feedback requires change.

## Product metadata (`Loan.metadata`)

Optional keys (never invented when missing):

| Key                                  | Values                             |
| ------------------------------------ | ---------------------------------- |
| `studyCoverage` / `studyDestination` | `india` \| `abroad` \| `both`      |
| `securityType` / `securedUnsecured`  | `secured` \| `unsecured` \| `both` |
| `moratoriumMonthsMax`                | number                             |
| `coApplicantRequired`                | boolean                            |
| `collateralRequired`                 | boolean                            |

## Government schemes (CMS)

Stored on education category `contentSections.governmentSchemes` as a JSON array.

Admin path: **Finance → Category (education-loan) → Government schemes JSON**.

Required to publish each scheme:

- `id`, `name`, `slug`
- `officialSourceUrl` (required)
- `lastVerifiedAt` (ISO date, required)

Suggested fields (scalar where simple; use `contentJson` / rule summaries where complex):

`schemeType`, `authorityName`, `ministryDepartment`, `description`, `benefitSummary`, `eligibilitySummary`, `incomeLimitInr`, `loanLimitForSubventionInr`, `subventionRatePercent`, `subventionPeriodSummary`, `collateralRuleSummary`, `guaranteeRuleSummary`, `eligibleStudyLocation`, `eligibleInstitutionRule`, `admissionRule`, `courseRule`, `portalUrl`, `officialGuidelinesUrl`, `eligibleInstitutionSourceUrl`, `effectiveFrom`, `effectiveTo`, `status`, `keyRules`, `contentJson`.

Defaults ship in `EDUCATION_LOAN_DEFAULT_SCHEMES` for empty CMS — still include official URLs and must be re-verified. Do not treat prompt text or React literals as the legal source of truth.

## Soft eligibility evaluator

`evaluateGovernmentSchemeEligibility(scheme, input)` in `education-loan-schemes.ts`.

Public statuses (never APPROVED / REJECTED):

| Status                     | Public label                             |
| -------------------------- | ---------------------------------------- |
| `potential_match`          | Potential match                          |
| `may_be_relevant`          | May be relevant                          |
| `insufficient_information` | More information required                |
| `not_matched`              | Not matched based on entered information |

Result also returns `matchedConditions`, `unmetConditions`, `unknownConditions`, `explanation`, `freshness`, `showNumericRules`.

## Freshness

Internal: `fresh` (≤90d) · `review_soon` (≤180d) · `review_required` · `archived`.

Public: show **Last verified: DD MMM YYYY** + Official source. Do not expose editorial “Fresh / Review Soon” labels.

When `review_required` / stale: hide numeric income/subvention details and show caveat + official source link.

## QHEI / eligible institutions

No runtime scrape. Link users to the official eligible-institution list via `eligibleInstitutionSourceUrl` / `portalUrl` / `officialSourceUrl`. Optional future import table fields: `institution_name`, `official_identifier`, `state`, `eligibility_status`, `source_version`, `source_date`, `last_verified_at`.

## Study-interest assumption

Illustrative: simple interest over course + moratorium months (`P × r × n / 1200`). Exposed in UI. Not identical to every lender capitalization rule.
