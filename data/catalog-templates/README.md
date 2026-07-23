# Catalog CSV templates

Use these headers when preparing production-scale imports for finance, construction, and automobile verticals.

## Finance

### banks
`name,slug,website,status,featured`

### loans
`name,slug,loanType,interestRate,status,affiliateUrl,bankSlug` (or `bankId`)

### credit-cards
`name,slug,annualFee,joiningFee,status,affiliateUrl,bankSlug`

### insurance
`name,slug,providerName,premium,status,affiliateUrl`

### investments
`name,slug,providerName,riskLevel,expectedReturn,status,affiliateUrl`

## Construction

### brands
`name,slug,website,status`

### materials
`name,slug,unit,unitCost,categorySlug,brandSlug,status,affiliateUrl`

## Automobile

### manufacturers
`name,slug,country,website,status`

### vehicles
`name,slug,model,variant,fuelType,exShowroomPrice,manufacturerSlug,status`

## Large imports

- **Admin UI:** `/catalog-ops` — batched upload (default 500 rows/batch, up to 50MB)
- **CLI:** `pnpm catalog:import -- --vertical finance --entity loans --file ./exports/loans.csv`
- **Reindex:** `pnpm catalog:reindex` or POST `/catalog/ops/reindex`

See [deploy/gcp/catalog-import.md](../../deploy/gcp/catalog-import.md) for the production runbook.
