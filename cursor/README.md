# Cursor prompt library

Authoritative AI-assisted development prompts for the Varnarc monorepo.

## Quick start

1. Read [`AI_RULES.md`](../AI_RULES.md) and [`CONTEXT.md`](./CONTEXT.md)
2. Use [`MASTER.md`](./MASTER.md) for any large feature
3. Pick a domain template from [`prompts/`](./prompts/)
4. Cursor rules in [`.cursor/rules/`](../.cursor/rules/) apply automatically

## Prompt index

| Template | Use when |
|----------|----------|
| [`MASTER.md`](./MASTER.md) | Any significant feature |
| [`prompts/feature-module.md`](./prompts/feature-module.md) | Full module (13-section spec) |
| [`prompts/backend.md`](./prompts/backend.md) | NestJS API module |
| [`prompts/frontend.md`](./prompts/frontend.md) | Public Next.js pages |
| [`prompts/admin.md`](./prompts/admin.md) | Admin dashboard CRUD |
| [`prompts/database.md`](./prompts/database.md) | Prisma schema + migration |
| [`prompts/api.md`](./prompts/api.md) | REST endpoints only |
| [`prompts/cms.md`](./prompts/cms.md) | CMS content features |
| [`prompts/testing.md`](./prompts/testing.md) | Test coverage |
| [`prompts/security.md`](./prompts/security.md) | Security hardening |
| [`prompts/performance.md`](./prompts/performance.md) | Performance work |
| [`prompts/documentation.md`](./prompts/documentation.md) | Docs-only updates |

## Workflow & quality

- [`WORKFLOW.md`](./WORKFLOW.md) — implementation steps
- [`QUALITY-CHECKLIST.md`](./QUALITY-CHECKLIST.md) — pre-merge checks
- [`PROHIBITED.md`](./PROHIBITED.md) — never generate

## Cursor rules (auto-applied)

| Rule | Scope |
|------|-------|
| `varnarc-global.mdc` | Always |
| `nestjs-backend.mdc` | `apps/api/**` |
| `nextjs-frontend.mdc` | `apps/web/**`, `apps/admin/**` |
| `prisma-database.mdc` | `packages/database/**` |

## Module implementation order

When implementing numbered specs from `varnarc-project-docs/docs/`:

```
Read spec → MASTER.md + domain prompt → implement required scope →
docs/*-IMPLEMENTATION.md → lint/typecheck/test
```

## Future

- Admin `/developer/prompts` viewer (spec deferred)
- ADR and architecture-validation prompts
