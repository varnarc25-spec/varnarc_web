# Testing prompt

Generate tests for: **[FEATURE / MODULE]**

## Requirements

### Unit (Vitest)

- `packages/validation` — schema edge cases
- `apps/api` — service logic with mocked `REPOS`
- `apps/web` — pure utilities

### Integration

- `apps/api/test/*.integration.spec.ts` — HTTP with `Test.createTestingModule`
- Database tests use test env or mocks (no production DB)

### E2E (Playwright)

- `apps/web/tests/e2e/` — smoke, a11y (`@axe-core/playwright`), SEO checks
- Run: `pnpm --filter @varnarc/web test:e2e`

### Coverage target

Aim for meaningful coverage on business logic. Full 90% gate is a future CI enhancement.

## Test naming

```text
describe('ServiceName', () => {
  it('does X when Y', () => { ... });
});
```

## Verify

```bash
pnpm test
```
