# Agent instructions

This repository uses **Cursor** with persistent rules and a prompt library.

## Start here

1. [`AI_RULES.md`](./AI_RULES.md) — locked stack and architecture
2. [`cursor/README.md`](./cursor/README.md) — prompt templates index
3. [`cursor/MASTER.md`](./cursor/MASTER.md) — copy-paste master prompt
4. [`.cursor/rules/`](./.cursor/rules/) — auto-applied Cursor rules

## Monorepo

```bash
cd project
pnpm install
pnpm dev          # all apps
pnpm lint && pnpm typecheck && pnpm test
```

## Implementing a module

1. Read spec: `../varnarc-project-docs/docs/NN-Module.md`
2. Check status: `docs/NN-Module-IMPLEMENTATION.md`
3. Use `cursor/prompts/feature-module.md` filled in for your module
4. Follow `cursor/WORKFLOW.md`
5. Verify with `cursor/QUALITY-CHECKLIST.md`

## Key paths

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/` | NestJS features |
| `apps/admin/src/app/` | Admin UI |
| `apps/web/src/app/` | Public site |
| `packages/validation/` | Zod schemas |
| `packages/database/` | Prisma + repositories |
| `templates/` | Code scaffolding |

Do not introduce new frameworks. Extend existing patterns.
