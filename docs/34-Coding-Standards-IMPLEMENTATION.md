# Implementation status — 34 Coding Standards Module

Engineering standards enforcement: ESLint, Prettier, Husky, Commitlint, CI gates, templates, and contributor docs.

## Required scope (delivered)

| Area | Status |
|------|--------|
| TypeScript strict mode | Done — `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`) |
| ESLint (flat config) | Done — `eslint.config.mjs` |
| Prettier | Done — `.prettierrc`, `.prettierignore` |
| EditorConfig | Done — `.editorconfig` |
| Husky pre-commit | Done — `.husky/pre-commit` → lint-staged |
| Commitlint | Done — `.husky/commit-msg`, `commitlint.config.cjs` |
| Per-package `lint` scripts | Done — all apps + packages run `eslint .` |
| CI lint + format gates | Done — lint in CI; Prettier via lint-staged |
| Code templates | Done — `templates/` |
| CONTRIBUTING + review checklist | Done — `CONTRIBUTING.md`, `docs/CODE_REVIEW_CHECKLIST.md` |
| Documentation | Done — this file |

## Key paths

| Path | Purpose |
|------|---------|
| `eslint.config.mjs` | Shared ESLint rules (TypeScript, Prettier compat) |
| `.prettierrc` | 2-space, single quotes, trailing commas, 100 cols |
| `commitlint.config.cjs` | Conventional Commits enforcement |
| `templates/nest-module/` | NestJS module starter |
| `templates/validation-schema.ts` | Zod schema patterns |
| `templates/next-admin-page.tsx` | Admin list page pattern |

## Commands

```bash
pnpm lint           # ESLint across monorepo (Turbo)
pnpm lint:fix       # ESLint auto-fix from repo root
pnpm format         # Prettier write
pnpm format:check   # Prettier CI check
pnpm prepare        # Install Husky hooks (runs on pnpm install)
```

## ESLint rules (summary)

| Rule | Level |
|------|-------|
| `no-var` | error |
| `prefer-const` | error |
| `no-console` | warn (allowed: warn, error) |
| `@typescript-eslint/no-explicit-any` | warn |
| `@typescript-eslint/consistent-type-imports` | warn |

## Architecture boundaries

| Layer | Responsibility |
|-------|----------------|
| Controller | HTTP, validation pipe, guards — no business logic |
| Service | Business logic |
| Repository | Prisma / database access only |
| `packages/validation` | Zod schemas shared by API + clients |
| `packages/types` | Shared TypeScript types |

API responses use the standard envelope via `ok()` / `okCursor()` helpers.

## CI quality gate order

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm audit --audit-level=high`
5. `pnpm build`

Prettier runs on **staged files** via lint-staged (pre-commit). Run `pnpm format:check` locally before large doc edits; a one-time `pnpm format` can normalize legacy files.

## Deferred (full spec)

| Topic | Notes |
|-------|-------|
| 90% coverage gate | Vitest coverage reporting — target for future CI job |
| Admin coding guideline viewer | Spec marks as future |
| ADRs / design system governance | Documented in spec; no tooling yet |
| Mutation testing | Future |
| `eslint-config-next` plugin | Can extend web/admin when needed |

## Related

- Spec: `varnarc-project-docs/docs/34-Coding-Standards.md`
- Testing standards: `docs/31-Testing-IMPLEMENTATION.md`
- Security practices: `docs/33-Security-IMPLEMENTATION.md`
