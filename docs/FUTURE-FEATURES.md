# Future Features Backlog

Central registry of **deferred and out-of-scope** capabilities across all Varnarc modules. These items do not block Phase 1 or current module acceptance criteria.

**Structured source of truth:** `packages/config/src/future-features.ts`  
**Last updated:** 2026-07-22

## Purpose

- Aggregate "Future Features" sections from every module spec (`varnarc-project-docs/docs/*.md`)
- Track platform-wide themes (i18n, mobile, marketplace, enterprise) without duplicating roadmap phases
- Give engineering and product a single backlog view in admin (`/roadmap/backlog`)

## How items enter the backlog

1. Module specs define **Future Features** as explicitly out of scope
2. Items are added to `FUTURE_FEATURES` in config with `moduleId`, `category`, `priority`, `status`, and optional `phase`
3. When an item is scheduled for delivery, promote it to `packages/config/src/roadmap.ts` and update status to `planned`

## Status values

| Status | Meaning |
|--------|---------|
| `backlog` | Documented, not scheduled |
| `planned` | Scheduled in a roadmap phase |
| `in_research` | Spike or design in progress |
| `deferred` | Intentionally postponed |

## Priority

| Priority | Guidance |
|----------|----------|
| `high` | Strategic or high user/business impact |
| `medium` | Valuable but not urgent |
| `low` | Nice-to-have or experimental |

## Module coverage

Backlog entries exist for modules: 04, 08, 10–33, and platform-wide themes (37).

Modules without a Future Features section in spec (e.g. 03 Database, 05 Backend) defer to roadmap phases instead.

## Counts (2026-07-22)

- **~150+** tracked items across **26** module groups
- Majority status: `backlog`
- High-priority themes: multilingual content, live data feeds, semantic search, mobile push, enterprise SSO/tenancy

## Maintenance

See [`future-features/README.md`](../future-features/README.md).

## Related

- Roadmap phases: [`ROADMAP.md`](./ROADMAP.md)
- Implementation: [`37-Future-Features-IMPLEMENTATION.md`](./37-Future-Features-IMPLEMENTATION.md)
- Spec: `varnarc-project-docs/docs/37-Future-Features.md`
