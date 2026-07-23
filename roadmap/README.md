# Roadmap maintenance

This folder documents how the Varnarc roadmap is kept current.

## Source of truth

1. **Structured data:** `packages/config/src/roadmap.ts` — phases, releases, KPIs, risks, helpers.
2. **Human-readable summary:** `docs/ROADMAP.md`
3. **Full spec:** `varnarc-project-docs/docs/36-Roadmap.md`
4. **Admin dashboard:** `apps/admin/src/app/roadmap/*`

No database tables or API endpoints are required for the roadmap module.

## When to update

- A module implementation doc is marked complete → set matching `RoadmapItem.status` to `complete`.
- A new module is scoped → add items under the appropriate phase.
- A major release ships → review release track status and phase `status` fields.
- Strategic pivot → update spec in `varnarc-project-docs` first, then sync config + `docs/ROADMAP.md`.

## Checklist (per release)

- [ ] Phase item statuses reflect reality
- [ ] `ROADMAP_LAST_UPDATED` bumped
- [ ] `docs/ROADMAP.md` summary updated if priorities changed
- [ ] `PROJECT_SPEC.md` phase section aligned
- [ ] Risks reviewed; new blockers added to `ROADMAP_RISKS`
- [ ] Admin `/roadmap` pages spot-checked

## Status values

| Value | Meaning |
|-------|---------|
| `complete` | Shipped and documented |
| `in_progress` | Active development or partial delivery |
| `planned` | Not started |
| `deferred` | Explicitly postponed |

Phase-level `status` uses `complete`, `in_progress`, or `planned` only.
