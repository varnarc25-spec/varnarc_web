# Production catalog import

Load large finance, construction, and automobile catalogs via batched CSV import and search reindex.

## Admin UI

**Admin → Catalog ops** (`/catalog-ops`)

- View row counts per vertical
- Upload large CSV files (batched, default 500 rows per batch)
- Optional automatic search reindex after import

## CLI (CI / ops)

```bash
export CATALOG_IMPORT_TOKEN="<admin JWT>"
export API_URL=https://api.example.com/api/v1

pnpm catalog:import -- --vertical finance --entity loans --file ./data/loans-production.csv
pnpm catalog:import -- --vertical construction --entity materials --file ./data/materials.csv --batch-size 1000
```

Reindex search indexes after bulk load:

```bash
pnpm catalog:reindex
```

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/catalog/ops/overview` | `finance.view` | Supported entities + defaults |
| GET | `/catalog/ops/counts` | `finance.view` | Row counts |
| POST | `/catalog/ops/import` | `finance.create` | Multipart `file` + query `vertical`, `entity`, `batchSize`, `reindex` |
| POST | `/catalog/ops/reindex` | `search.reindex` | Reindex modules |

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `CATALOG_IMPORT_BATCH_SIZE` | `500` | Rows per batch |
| `CATALOG_IMPORT_MAX_MB` | `50` | Max upload size |

## CSV templates

Headers and examples: [data/catalog-templates/README.md](../../data/catalog-templates/README.md)

## Workflow

1. Export or prepare CSV from your content/ops source.
2. Import via CLI or admin (batches prevent timeouts).
3. Run reindex if not auto-triggered.
4. Verify counts on `/catalog-ops` and public list pages.

## Related

- Per-vertical admin toolbars still support small CSV import/export.
- Search reindex script: `packages/database/scripts/reindex-search.ts`
