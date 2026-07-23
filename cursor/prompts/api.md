# API prompt

Implement REST endpoints for: **[FEATURE DESCRIPTION]**

## Requirements

- NestJS controller under `/api/v1/`
- HTTP verbs match semantics (GET list/detail, POST create, PUT/PATCH update, DELETE remove)
- Cursor pagination: `cursorPaginationQuerySchema` from `@varnarc/validation`
- Filtering via Zod query schemas
- `@RequirePermissions()` on every non-public route
- `@Public()` only for truly anonymous endpoints
- OpenAPI: `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`
- Standard error envelope via `HttpExceptionFilter`
- Integration test with `supertest` for health-critical paths

## Response shape

```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

List endpoints use `okCursor()` with `items`, `nextCursor`, `hasMore`.

## Verify

`pnpm --filter @varnarc/api test`
