# AI Tools Module

Centralized catalog of AI products for discovery, comparison, reviews, bookmarking, affiliate/sponsored placements, and deterministic embedded utilities. Separate from the existing `/ai` module (LLM jobs/prompts).

## Architecture

| Layer | Location |
|-------|----------|
| Prisma models | `packages/database/prisma/schema.prisma` (`AiCategory`, `AiTool`, `AiToolBookmark`, …) |
| Repository | `packages/database/src/repositories/ai-tools/` |
| Validation | `packages/validation/src/ai-tools.ts` |
| Permissions | `packages/auth` — `ai-tools.view\|create\|edit\|publish\|delete` |
| API | `apps/api/src/modules/ai-tools/` |
| Admin UI | `apps/admin/src/app/ai-tools/` (planned) |
| Public UI | `apps/web/src/app/ai-tools/` |

Entity type for reviews and comparisons: `ai_tool`.

Do **not** modify `apps/api/src/modules/ai/` — that module handles AI jobs and prompts only.

## REST API (`/api/v1/ai-tools`)

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/status` | Module health |
| GET | `/categories` | List categories (cursor pagination) |
| GET | `/categories/slug/:slug` | Category by slug |
| GET | `/` | List published tools (filters: category, pricing, featured, freePlan, …) |
| GET | `/slug/:slug` | Tool detail (records recently viewed when authenticated) |
| GET | `/slug/:slug/related` | Reviews, comparisons, related tools in category |
| GET | `/compare?slugs=` | Side-by-side compare (CSV of slugs) |
| POST | `/:id/events` | Track VIEW / AFFILIATE_CLICK / OUTBOUND_CLICK / … |
| POST | `/utilities/run` | Deterministic utilities (no external LLM) |

### Authenticated (user)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/bookmarks` | List / create bookmarks |
| DELETE | `/bookmarks/:id` | Remove own bookmark |
| GET | `/bookmarks/collections` | Distinct collection names |
| GET | `/me/recently-viewed` | Recently viewed tools |

### Admin (Auth0 + RBAC)

| Method | Path | Permission |
|--------|------|------------|
| POST | `/categories` | `ai-tools.create` |
| PUT/DELETE | `/categories/:id` | `ai-tools.edit` / `ai-tools.delete` |
| GET | `/admin` | `ai-tools.view` |
| GET | `/:id` | `ai-tools.view` |
| POST | `/` | `ai-tools.create` |
| PUT/DELETE | `/:id` | `ai-tools.edit` / `ai-tools.delete` |
| POST | `/:id/publish`, `/unpublish` | `ai-tools.publish` |
| POST | `/:id/feature`, `/sponsor` | `ai-tools.publish` |
| POST | `/bulk/publish`, `/bulk/delete` | `ai-tools.publish` / `ai-tools.delete` |
| GET | `/admin/export/tools` | `ai-tools.view` |
| POST | `/admin/import/tools` | `ai-tools.create` |
| GET | `/admin/:id/history` | `ai-tools.view` |
| GET | `/analytics` | `ai-tools.view` |

## Cache keys

- `ai-tools:categories`
- `ai-tools:published`
- `ai-tools:slug:{slug}`
- `ai-tools:analytics`

TTL: 60 seconds. Bust on create/update/delete/publish/import.

## Audit actions

- `ai-tools.category.create|update|delete`
- `ai-tools.tool.create|update|delete|publish|unpublish|feature|sponsor`
- `ai-tools.import`

History is read from `auditLogs` with `entity: 'ai_tool'`.

## Embedded utilities

`POST /utilities/run` accepts `{ utility, input, options? }` and runs local string transforms:

| Utility | Behavior |
|---------|----------|
| `prompt-generator` | Structured prompt template |
| `text-summarizer` | Truncate to N words |
| `seo-title` | Clean + max 60 chars |
| `meta-description` | Max 155 chars |
| `keyword-cluster` | Frequency-ranked terms |
| `regex-generator` | Escaped word-boundary pattern |
| `json-formatter` | Pretty-print JSON |
| `markdown-converter` | Lightweight Markdown → HTML |

## CSV import/export

Export columns: `id,name,slug,description,pricingModel,freePlan,freeTrial,apiAvailable,website,documentation,affiliateUrl,featured,sponsored,status,category`.

Import upserts by `slug`. `category` is matched by category slug when present.

## Integrations

- **Reviews** — user + editorial via `entityType: ai_tool`
- **Comparisons** — `comparisons.findByEntity('ai_tool', …)`
- **Directory** — optional `companyId` link to `Business`
- **Analytics** — view/bookmark counts + event type aggregates

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

## Deferred (future)

Live API status monitoring, AI marketplace, prompt marketplace, workflow builder, agent directory, MCP catalog, embedded playgrounds with external LLMs.
