# Implementation status — 26 Settings Module

## Required scope (delivered)

| Area | Status |
|------|--------|
| Typed category APIs (`general`, `maintenance`, `security`, `cms`, `seo-defaults`) | Done |
| Settings hub with category navigation | Done |
| Admin forms: general, maintenance, security | Done |
| Feature flags page (moved from hub) | Done |
| Advanced raw JSON upsert | Done |
| Module link-outs (analytics, SEO, notifications, themes) | Done |
| Public maintenance status endpoint | Done |
| Web maintenance middleware + `/maintenance` page | Done |
| Redis/memory cache on category reads | Done |
| Audit logging on category + flag updates | Done |
| `isFeatureEnabled` + public flag check API | Done |
| Validation schemas in `@varnarc/validation` | Done |

## Pre-existing (unchanged pattern)

| Area | Location |
|------|----------|
| Generic `GET/PUT /settings` | `apps/api/src/modules/settings/` |
| Analytics integrations | `analytics.integrations` → `/analytics/integrations` |
| SEO robots & integrations | `seo.robots`, `seo.integrations` |
| Notification providers | `notifications.providers` |
| Themes module | `/themes` |

## API endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/settings` | `settings.manage` | Cursor list |
| PUT | `/settings` | `settings.manage` | Raw upsert |
| GET/PUT | `/settings/general` | `settings.manage` | Typed general config |
| GET/PUT | `/settings/maintenance` | `settings.manage` | Maintenance config |
| GET | `/settings/maintenance/status` | Public | Web middleware |
| GET/PUT | `/settings/security` | `settings.manage` | Security defaults |
| GET/PUT | `/settings/cms` | `settings.manage` | CMS defaults |
| GET/PUT | `/settings/seo-defaults` | `settings.manage` | Platform SEO fallbacks |
| GET | `/settings/feature-flags/:key/enabled` | Public | Runtime flag check |
| GET/PUT | `/settings/feature-flags` | `settings.manage` | Flag CRUD |

Setting keys: `settings.general`, `settings.maintenance`, `settings.security`, `settings.cms`, `settings.seo-defaults`.

## Key paths

| Area | Path |
|------|------|
| API service | `apps/api/src/modules/settings/settings.service.ts` |
| API controller | `apps/api/src/modules/settings/settings.controller.ts` |
| Validation | `packages/validation/src/settings.ts` |
| Admin hub | `apps/admin/src/app/settings/` |
| Admin BFF | `apps/admin/src/app/api/admin/settings/` |
| Web maintenance | `apps/web/src/lib/maintenance.ts`, `apps/web/src/middleware.ts` |

## Deferred (future)

- `setting_history` table + rollback UI
- Import/export
- Encrypted secret storage
- `settings.view` / `settings.edit` split permissions
- Homepage layout admin
- AI providers / media / ads defaults admin pages
- Config provider injection across all modules (modules still read `repos.settings` directly where needed)
- IP/role bypass in web maintenance middleware
- Environment overrides table

## No migration required

Uses existing `settings` and `feature_flags` tables. Optional seed writes default JSON keys on `pnpm db:seed`.
