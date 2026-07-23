# Implementation status — 31 Testing Module

Testing foundation for the Varnarc monorepo: unit tests (Vitest), API integration smoke, Playwright e2e (smoke + a11y + SEO), CI quality gates, and ops documentation.

## Required scope (delivered)

| Area | Status |
|------|--------|
| API unit tests (startup-env, response helpers, health service, request-id) | Done — `apps/api/test/*.spec.ts` |
| API integration (health + ready via Supertest) | Done — `health.integration.spec.ts` |
| Validation package unit tests | Done — `packages/validation/tests/` |
| Web unit tests (existing) | Done — `apps/web/tests/unit/` |
| Playwright smoke (existing) | Done |
| Playwright accessibility (`@axe-core/playwright`) | Done — `accessibility.spec.ts` |
| Playwright SEO smoke | Done — `seo.spec.ts` |
| CI: all unit tests + audit | Done — `.github/workflows/ci.yml` |
| Local testing guide | Done — `testing/README.md` |
| Admin ops hub | Done — `/system/tests` |

## Key paths

| Path | Purpose |
|------|---------|
| `apps/api/vitest.config.ts` | API Vitest config |
| `apps/api/test/` | API unit + integration specs |
| `packages/validation/vitest.config.ts` | Shared Zod schema tests |
| `apps/web/tests/e2e/` | Playwright suites |
| `testing/README.md` | Local commands |
| `.github/workflows/ci.yml` | CI quality gates |

## Commands

```bash
pnpm test                              # turbo: api + validation + web unit
pnpm --filter @varnarc/api test
pnpm --filter @varnarc/web test:e2e     # after web build
```

## Deferred (full spec)

- 90% coverage across all modules
- Supertest coverage for authenticated API routes
- Database migration / constraint tests
- Redis, Auth0, webhook integration tests
- Lighthouse / k6 performance gates in CI
- Coverage artifacts (`@vitest/coverage-v8`) uploaded to CI
- Admin `/system/coverage`, `/system/performance`
- Visual regression, load testing, mutation testing

## Related

- Spec: `varnarc-project-docs/docs/31-Testing.md`
- Deployment smoke: `scripts/deploy/smoke-test.sh` (module 28)
