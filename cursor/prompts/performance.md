# Performance prompt

Optimize performance for: **[AREA / ENDPOINT / PAGE]**

## Requirements

### API

- Avoid N+1 queries — use Prisma `include` or batch repository methods
- Cursor pagination on all list endpoints
- Redis cache for expensive reads (`CacheModule`, TTL from settings)
- Response compression (enabled in `main.ts`)
- Index DB columns used in WHERE/ORDER BY
- Background jobs (BullMQ) for long-running work

### Frontend

- Server Components for data fetching
- `dynamic()` for heavy client components
- Image optimization (AVIF/WebP via Next config)
- Core Web Vitals RUM (`web-vitals` → analytics API)

### Observability

- Prometheus metrics (`/metrics/prometheus`)
- k6 scripts in `performance/k6/`

## Reference

- `docs/32-Performance-IMPLEMENTATION.md`
- `packages/config/src/performance.ts` — latency targets

## Verify

- Measure before/after (P95 from `api_request_logs` or Lighthouse)
- `pnpm --filter @varnarc/api test` and load test if critical path
