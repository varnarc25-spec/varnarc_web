# Implementation status — 23 SEO

Aligned with `varnarc-project-docs/docs/23-SEO.md` (Auth0 + `/api/v1` + Nest RBAC).

## Delivered (required scope)

| Area | Status |
|------|--------|
| Centralized `seo_metadata` + extended fields | Done |
| Metadata API (get/list/upsert) | Done |
| 301/302 redirects CRUD + bulk import + hit tracking | Done |
| Redirect loop detection | Done |
| XML sitemaps (index + 11 module types) | Done |
| Cached sitemap generation + admin rebuild | Done |
| Configurable robots.txt (dev disallow all) | Done |
| SEO audit (missing metadata, duplicates, broken redirects) | Done |
| SEO health dashboard | Done |
| GSC/Bing integration settings (stubs) | Done |
| SEO analytics summary (indexed page count) | Done |
| RBAC: `seo.view`, `seo.edit`, `seo.audit`, `seo.redirects` | Done |
| Admin UI routes (dashboard, metadata, redirects, sitemaps, audit, analytics, integrations, robots) | Done |
| Bulk redirect import UI (CSV) | Done |
| Public web: sitemap/robots routes + redirect middleware | Done |
| Unified public metadata via `buildSeoMetadata()` helper | Done |
| Admin integrations + robots settings UI | Done |
| Extended SEO audit (calculators, AI tools, directory, comparisons) | Done |
| JSON-LD helpers on public pages (pre-existing) | Done |
| Audit logging on admin mutations | Done |

## Migrations

`20260721120000_seo_module` — `seo_redirects`, `seo_audits`, extended `seo_metadata`.

## Key paths

| Area | Path |
|------|------|
| API module | `apps/api/src/modules/seo/` |
| Repository | `packages/database/src/repositories/seo/` |
| Validation | `packages/validation/src/seo.ts` |
| Admin | `apps/admin/src/app/seo/` |
| Web redirects | `apps/web/src/lib/seo-redirects.ts` |
| Web sitemaps | `apps/web/src/app/sitemap.xml/`, `apps/web/src/app/sitemap/[type]/` |

## Future (not required for acceptance)

See updated Future Features section in `23-SEO.md`:

- AI-generated metadata / keyword optimization
- Hreflang / multilingual SEO
- IndexNow, Core Web Vitals monitoring
- Regex redirects, video SEO
- Live Google Search Console API sync (beyond settings stubs)
- Broken link crawler (external URLs)
- Full bulk metadata editor UI
