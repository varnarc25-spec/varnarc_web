# CMS prompt

Implement production-ready CMS functionality for: **[FEATURE DESCRIPTION]**

## Requirements

- Draft / published workflow (`PublishStatus` enum)
- Slug generation and uniqueness validation
- SEO metadata integration (`packages/validation/src/seo.ts`)
- Media library integration (`media.upload` permission)
- Version history or revision tracking where spec requires
- RBAC: `article.create`, `article.edit`, `article.publish`, etc.
- Admin editor pages + public rendering in `apps/web`
- Search index hooks (`SearchService` upsert on publish)
- Audit logs on publish and delete

## Patterns

- Follow `apps/api/src/modules/cms/`
- Admin: `apps/admin/src/app/articles/`, `pages/`

## Tests

- Validation tests for slug and status transitions
- Service unit tests for publish logic
