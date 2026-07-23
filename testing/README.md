# Varnarc testing

Local commands for the monorepo test suite (`project/`).

## Unit tests

```bash
# All packages with a test script (api, validation, web)
pnpm test

# Per package
pnpm --filter @varnarc/api test
pnpm --filter @varnarc/validation test
pnpm --filter @varnarc/web test

# Watch mode
pnpm --filter @varnarc/api test:watch
```

## E2E (Playwright — web)

Build the web app first, then run Playwright (starts `pnpm start` via `playwright.config.ts`):

```bash
pnpm --filter @varnarc/web build
pnpm --filter @varnarc/web test:e2e
```

Suites:

| Path | Coverage |
|------|----------|
| `apps/web/tests/e2e/smoke.spec.ts` | Core public routes |
| `apps/web/tests/e2e/accessibility.spec.ts` | axe serious/critical violations |
| `apps/web/tests/e2e/seo.spec.ts` | robots.txt, title, meta |

## CI

GitHub Actions workflow `.github/workflows/ci.yml`:

1. Typecheck
2. `pnpm test` (api + validation + web unit)
3. Build
4. Playwright e2e (chromium)
5. `pnpm audit` (high severity, non-blocking)

## Coverage target

The spec targets **90%** coverage for core business logic. Current implementation is a **foundation** — expand tests per module as features ship.

## Related docs

- `docs/31-Testing-IMPLEMENTATION.md` — delivered scope and deferred items
- `varnarc-project-docs/docs/31-Testing.md` — full module specification
