# 03 — Database Implementation Status

Implements [03-Database.md](./03-Database.md) against Neon PostgreSQL via Prisma.

## Done

| Area | Status |
|------|--------|
| Normalized multi-domain Prisma schema | ✅ ~88 models, 10 enums |
| UUID PKs + snake_case mapping | ✅ |
| Soft delete (`deleted_at`) + audit (`created_by` / `updated_by`) | ✅ on domain tables |
| RBAC (users, roles, permissions, junctions) | ✅ (Phase 1 + preserved) |
| Indexes / unique constraints / FKs | ✅ |
| Migration `20260716190000_full_domain_schema` | ✅ |
| Seed (RBAC + `en` language + default theme + feature flag) | ✅ |
| Polymorphic SEO (`entity_type` + `entity_id`, no conflicting FKs) | ✅ |
| Cursor pagination helpers (`@varnarc/database`) | ✅ |
| Domain repository classes + `createRepositories()` / `repos` | ✅ |
| Domain Zod schemas (`@varnarc/validation`) | ✅ |
| Cursor meta types (`@varnarc/types`) | ✅ |
| NestJS `DatabaseModule` + identity services on repos | ✅ |

## Packages

### `@varnarc/database`

- `paginateWithCursor`, `encodeCursor` / `decodeCursor`, `cursorWhereClause`
- Repositories: users, roles, permissions, articles, categories, pages, tags, seo, media, ads, calculators, products, reviews, comparisons, businesses, settings, themes, feature flags, homepage, AI, plans, subscriptions
- Usage:

```ts
import { prisma, repos, paginateWithCursor } from '@varnarc/database';

const page = await repos.articles.list({
  status: 'PUBLISHED',
  limit: 20,
  cursor: req.query.cursor,
});
```

### NestJS API

- Global `DatabaseModule` injects `REPOS` / `PRISMA`
- `UsersService`, `RolesService`, `PermissionsService` use repository layer (no direct `prisma.*` in those services)

### `@varnarc/validation`

- `cursorPaginationQuerySchema` + offset `paginationQuerySchema`
- Domain schemas: auth, cms, media, ads, calculators, reviews, directory, settings, premium/AI

```ts
import { createArticleSchema, cursorPaginationQuerySchema } from '@varnarc/validation';
```

## Still later

- CMS / media / ads Nest modules on repositories
- Full-text search indexes (tsvector)
- Materialized views / Redis cache wiring

## Commands

```bash
cd packages/database
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec tsx src/seed.ts
pnpm build
```
