# Implementation status — 37 Future Features Module

Central backlog registry for deferred capabilities across all platform modules.

## Required scope (delivered)

| Area | Status |
|------|--------|
| Backlog data model | Done — `FutureFeature`, `FutureFeatureModule` types |
| Aggregated backlog config | Done — `packages/config/src/future-features.ts` (~150 items) |
| Module spec cross-references | Done — entries map to `04`–`33` Future Features sections |
| Platform-wide themes | Done — i18n, mobile, marketplace, subscriptions, RAG |
| Helper functions | Done — `groupFeaturesByModule`, `countFutureFeatures`, `getFeaturesByPhase` |
| Living documentation | Done — `docs/FUTURE-FEATURES.md` |
| Maintenance process | Done — `future-features/README.md` |
| Admin backlog UI | Done — `/roadmap/backlog` |
| Documentation | Done — this file |

## Admin routes

| Route | Permission |
|-------|------------|
| `/roadmap/backlog` | `api.view` |

Linked from Roadmap nav alongside Overview, Releases, and Milestones.

## Design decisions

| Decision | Rationale |
|----------|-----------|
| No database tables | Spec: backlog is planning metadata, not runtime data |
| No REST API | Admin reads `@varnarc/config` directly (same as roadmap module) |
| Static TypeScript config | Version-controlled, PR-reviewable, type-safe |
| `phase` optional field | Links backlog items to roadmap phases when known |

## Sync with module specs

When implementing a new module, add its Future Features bullets to:

1. `varnarc-project-docs/docs/{NN}-Module.md` — `# Future Features` section
2. `packages/config/src/future-features.ts` — structured entries
3. `docs/FUTURE-FEATURES.md` — summary counts if materially changed

## Deferred (full spec expansion)

| Topic | Notes |
|-------|-------|
| Backlog API endpoints | Not required; use config package |
| DB-backed feature requests | Future product workflow |
| Public roadmap/backlog page | Internal admin only for now |
| Automated spec → config sync | Manual sync; script possible later |

## Related

- Spec: `varnarc-project-docs/docs/37-Future-Features.md`
- Backlog doc: `docs/FUTURE-FEATURES.md`
- Roadmap: `docs/36-Roadmap-IMPLEMENTATION.md`
- Config: `packages/config/src/future-features.ts`
