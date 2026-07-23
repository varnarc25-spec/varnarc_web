# SEO Module

Centralized SEO for metadata, redirects, sitemaps, robots.txt, audits, and analytics.

## Architecture

| Layer | Location |
|-------|----------|
| Prisma models | `SeoMetadata`, `SeoRedirect`, `SeoAudit` |
| Repository | `packages/database/src/repositories/seo/seo.repository.ts` |
| Validation | `packages/validation/src/seo.ts` |
| Permissions | `seo.view`, `seo.edit`, `seo.audit`, `seo.redirects` |
| API | `apps/api/src/modules/seo/` |

## REST API (`/api/v1/seo`)

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/status` | Module health |
| GET | `/meta/:entityType/:entityId` | Metadata for entity |
| GET | `/redirects/resolve?path=` | Resolve redirect (increments hit count) |
| GET | `/redirects/active` | Active redirects list (cached) |
| GET | `/sitemap` | Sitemap index XML |
| GET | `/sitemap/:type` | Typed sitemap XML |
| GET | `/robots.txt` | Robots.txt (dev: disallow all) |

### Authenticated

| Method | Path | Permission |
|--------|------|------------|
| GET | `/dashboard` | `seo.view` |
| GET/PUT | `/meta/:entityType/:entityId` | `seo.edit` |
| GET | `/meta` | `seo.view` |
| GET/POST/PUT/DELETE | `/redirects` | `seo.redirects` |
| POST | `/redirects/import` | `seo.redirects` |
| GET | `/sitemaps/status` | `seo.view` |
| POST | `/sitemaps/rebuild` | `seo.edit` |
| GET/PUT | `/robots/settings` | `seo.view` / `seo.edit` |
| GET | `/audit` | `seo.audit` |
| POST | `/audit/run` | `seo.audit` |
| GET | `/analytics` | `seo.view` |
| GET/PUT | `/integrations` | `seo.edit` |

## Public web

- `/sitemap.xml` — proxies API sitemap index
- `/sitemap/:type.xml` — module sitemaps (articles, pages, reviews, etc.)
- `/robots.txt` — API-driven in production; disallow all in development
- Middleware applies DB redirects with 60s cache

## Admin UI

`/seo`, `/seo/metadata`, `/seo/redirects`, `/seo/sitemaps`, `/seo/audit`, `/seo/analytics`
