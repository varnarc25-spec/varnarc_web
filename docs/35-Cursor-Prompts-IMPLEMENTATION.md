# Implementation status — 35 Cursor Prompts Module

AI-assisted development strategy: prompt library, Cursor rules, workflow docs, and master prompt.

## Required scope (delivered)

| Area | Status |
|------|--------|
| Master Cursor prompt | Done — `cursor/MASTER.md` |
| Domain prompt templates | Done — `cursor/prompts/*.md` (11 templates) |
| Reusable context variables | Done — `cursor/CONTEXT.md` |
| Global AI rules | Done — `AI_RULES.md` + `.cursor/rules/varnarc-global.mdc` |
| File-scoped Cursor rules | Done — NestJS, Next.js, Prisma `.mdc` files |
| Implementation workflow | Done — `cursor/WORKFLOW.md` |
| Quality checklist | Done — `cursor/QUALITY-CHECKLIST.md` |
| Prohibited output list | Done — `cursor/PROHIBITED.md` |
| 13-section feature template | Done — `cursor/prompts/feature-module.md` |
| Agent entry point | Done — `AGENTS.md` |
| Documentation | Done — this file |

## Prompt templates

| File | Purpose |
|------|---------|
| `cursor/prompts/backend.md` | NestJS modules |
| `cursor/prompts/frontend.md` | Next.js public app |
| `cursor/prompts/admin.md` | Admin dashboard |
| `cursor/prompts/database.md` | Prisma + repositories |
| `cursor/prompts/api.md` | REST endpoints |
| `cursor/prompts/cms.md` | CMS features |
| `cursor/prompts/testing.md` | Vitest + Playwright |
| `cursor/prompts/security.md` | Security hardening |
| `cursor/prompts/performance.md` | Performance optimization |
| `cursor/prompts/documentation.md` | Doc updates |
| `cursor/prompts/feature-module.md` | Full module spec |

## Cursor rules (`.cursor/rules/`)

| Rule | `alwaysApply` | Globs |
|------|---------------|-------|
| `varnarc-global.mdc` | yes | — |
| `nestjs-backend.mdc` | no | `apps/api/**/*.ts` |
| `nextjs-frontend.mdc` | no | `apps/web/**`, `apps/admin/**` |
| `prisma-database.mdc` | no | `packages/database/**` |

## Usage

```text
# In Cursor chat — paste MASTER.md or a domain prompt, then your task:

Implement module 36 roadmap tracking per cursor/prompts/feature-module.md
Required scope only. Update docs/36-*-IMPLEMENTATION.md when done.
```

## Deferred (full spec)

| Topic | Notes |
|-------|-------|
| Admin `/developer/prompts` UI | Spec marks as future |
| ADR generation prompts | `cursor/prompts/` extensible |
| AI code review automation | Future enhancement section in spec |
| Architecture validation bot | Future |

## Related

- Spec: `varnarc-project-docs/docs/35-Cursor-Prompts.md`
- Coding standards: `docs/34-Coding-Standards-IMPLEMENTATION.md`
- Code templates: `templates/README.md`
