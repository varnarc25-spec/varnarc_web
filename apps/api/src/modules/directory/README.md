# Directory Module

Centralized business directory for the Varnarc platform. Listings are stored on the shared `Business` model with category, location, media, hours, leads, and analytics support.

## Architecture

| Layer | Location |
|-------|----------|
| Prisma models | `packages/database/prisma/schema.prisma` (`Business`, `BusinessCategory`, `LeadRequest`, …) |
| Repository | `packages/database/src/repositories/directory/` |
| Validation | `packages/validation/src/directory.ts` |
| Permissions | `packages/auth` — `directory.view\|create\|edit\|publish\|delete\|verify` |
| API | `apps/api/src/modules/directory/` |
| Admin UI | `apps/admin/src/app/directory/` |
| Public UI | `apps/web/src/app/directory/` |

Entity type for reviews and comparisons: `directory_listing`.

## REST API (`/api/v1/directory`)

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | List categories (cursor pagination) |
| GET | `/categories/slug/:slug` | Category by slug |
| GET | `/search` | Search with filters (city, category, verified, openNow, topRated, geo) |
| GET | `/map` | Map markers (lat/lng) |
| GET | `/listings`, `/businesses` | List approved listings |
| GET | `/listings/slug/:slug` | Listing detail |
| GET | `/listings/slug/:slug/nearby` | Nearby listings |
| GET | `/listings/slug/:slug/related` | Reviews, comparisons, related businesses |
| POST | `/leads` | Submit lead |
| POST | `/listings/:id/events` | Track view/click events |

### Admin (Auth0 + RBAC)

| Method | Path | Permission |
|--------|------|------------|
| POST | `/categories` | `directory.create` |
| PUT/DELETE | `/categories/:id` | `directory.edit` / `directory.delete` |
| GET | `/listings/admin` | `directory.view` |
| GET | `/listings/admin/:id` | `directory.view` |
| POST | `/listings` | `directory.create` |
| PUT/DELETE | `/listings/:id` | `directory.edit` / `directory.delete` |
| POST | `/listings/:id/publish` | `directory.publish` |
| POST | `/listings/:id/verify` | `directory.verify` |
| POST | `/listings/:id/feature` | `directory.edit` |
| POST | `/listings/:id/sponsor` | `directory.edit` |
| GET | `/listings/admin/verification` | `directory.verify` |
| GET | `/admin/export/listings` | `directory.view` |
| POST | `/admin/import/listings` | `directory.create` |
| GET | `/analytics` | `directory.view` |
| GET/PUT | `/leads`, `/leads/:id` | `directory.view` / `directory.edit` |

## Admin routes

- `/directory` — dashboard
- `/directory/categories` — category manager
- `/directory/listings` — listing manager (CSV import/export, filters)
- `/directory/listings/[id]/edit` — full listing editor
- `/directory/listings/[id]/history` — audit history
- `/directory/verification` — verification queue
- `/directory/leads` — lead manager
- `/directory/analytics` — analytics dashboard

## Public routes

- `/directory` — home (categories, sponsored, search)
- `/directory/search` — filtered search results
- `/directory/map` — map view
- `/directory/[slug]` — listing or category page
- `/directory/[category]/[city]` — SEO landing pages

## Setup

```bash
cd packages/database
pnpm migrate:deploy
pnpm seed
```

Rebuild shared packages after schema changes:

```bash
pnpm --filter @varnarc/database build
pnpm --filter @varnarc/validation build
pnpm --filter @varnarc/auth build
```

## CSV import/export

Export returns columns: `id,name,slug,description,phone,email,website,city,state,country,status,featured,sponsored,verificationStatus,listingType`.

Import upserts by `slug` — existing listings are updated; new slugs are created.

## Integrations

- **Reviews** — user ratings via `entityType: directory_listing`; editorial reviews linked by entity
- **Comparisons** — related comparisons on listing pages
- **Analytics** — views, clicks, leads, sponsored performance
- **SEO** — LocalBusiness / Organization / FAQ / Breadcrumb JSON-LD

## Deferred (future)

Claim listing, subscriptions, marketplace, booking, messaging, multilingual content, franchise support, live directions, geofencing.
