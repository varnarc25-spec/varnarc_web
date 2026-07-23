# Implementation status — 08 CMS Module

Aligned with `varnarc-project-docs/docs/08-CMS.md` (Auth0 + `/api/v1` + Nest RBAC).

## Workflow

Statuses: `DRAFT → REVIEW → SCHEDULED → PUBLISHED → ARCHIVED`

- `POST /articles|pages/:id/submit-review` → `REVIEW`
- `POST /articles|pages/:id/schedule` `{ publishedAt }` → `SCHEDULED`
- `POST /articles|pages/:id/publish` → `PUBLISHED` + immutable revision
- Background `PublishSchedulerService` promotes due `SCHEDULED` rows every 60s and busts CMS cache keys

## API surface

| Area | Highlights |
|------|------------|
| Articles | Public published list/slug (`featured`, `categoryId`); admin `/articles/manage`; CRUD; publish/schedule/submit-review/duplicate/preview; versions; SEO; related; featured; reading time; author ownership |
| Pages | Auth list/CRUD; public slug; publish/schedule/submit-review/duplicate/preview; page versions; SEO |
| Categories | List/slug public; create/update/delete |
| Tags | List/slug/articles public; create/update/delete; description + usage count |
| Menus | CRUD + items; public by location (`header\|footer\|sidebar\|mobile`) |
| Search | `GET /search?q=` — published articles + pages (ILIKE) |
| CMS dashboard | `GET /cms/dashboard/summary` |
| Media / SEO | Existing modules |
| Errors | Prisma unique slug → `409 DUPLICATE_SLUG` |

## Admin UI

`/cms`, `/articles`, `/pages`, `/categories`, `/tags`, `/menus`, `/media`

Article/page editors include autosave, schedule datetime, preview modal, submit-review, featured image picker, related articles, featured flag, and category select.

## Public web

- Header/footer menus from CMS (`/menus/location/:location`) with static fallback
- CMS pages at `/p/[slug]`
- Search at `/search` wired to `GET /search`
- Homepage widgets: `latest` / `featured` / `category` article sources
- Article detail shows reading time + related articles

## Permissions

`article.*`, `page.view|create|edit|publish|delete`, `menu.manage`, `media.*`

Authors may edit only their own articles unless they also have publish/admin roles.

## Caching

In-memory Nest `CacheModule` for published article/page slug + menu location. Invalidated on publish/update/schedule promote.

## Migrations

- `20260717220000_cms_review_page_versions` — `REVIEW` enum, `tags.description`, `page_versions`
- `20260717230000_cms_featured_related` — `is_featured`, `reading_time_minutes`, `article_related`

## Still future (explicitly out of required scope)

- AI-assisted drafting
- Redis-backed cache / CDN search index (`tsvector`)
- Drag-drop page builder / form builder
- Multilingual content
- Contributor/Reviewer dedicated roles beyond current RBAC
- Version comparison UI
