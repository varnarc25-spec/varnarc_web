# Varnarc Development Roadmap

Living planning document for engineering, product, and infrastructure. **Structured source of truth:** `packages/config/src/roadmap.ts` (consumed by the admin Planning Dashboard).

**Last updated:** 2026-07-22

## Current status

| Track | Status | Notes |
|-------|--------|-------|
| **v1.x Platform Foundation** | Complete | Modules 03–36 implemented |
| **v2.x Content Expansion** | Complete | 100 articles, 30 calculators, 20 comparisons, 20 reviews seeded |
| **v3.x+ Utility / AI / Community** | Planned | See phases 3–9 in spec |

## Release strategy

| Version | Focus | Phases |
|---------|-------|--------|
| v1.x | Platform Foundation | 1 |
| v2.x | Content Expansion | 2 |
| v3.x | Utility + AI Platform | 3, 4 |
| v4.x | Community & Premium | 5, 6 |
| v5.x | Business, Mobile, Enterprise | 7, 8, 9 |

## Phase 1 — Platform Foundation (MVP)

**Objective:** Core architecture and publishing capabilities.

**Milestone:** Stable production-ready publishing platform.

| Area | Status | Implementation doc |
|------|--------|-------------------|
| Monorepo, web, API, database | Complete | `03`–`06` |
| Auth0 + RBAC + Admin | Complete | `05`, `07` |
| CMS, media, themes | Complete | `08` |
| Ads, search | Complete | `10`, search modules |
| SEO, analytics, notifications | Complete | `22`–`24` |
| Settings, API console | Complete | `26`, `27` |
| Docker, GCP, deployment | Complete | `28`–`30` |
| Testing, performance, security | Complete | `31`–`33` |
| Coding standards, Cursor prompts | Complete | `34`, `35` |
| Roadmap tracking | Complete | `36` (this module) |

## Phases 2–9 (summary)

See `varnarc-project-docs/docs/36-Roadmap.md` for full feature lists. Progress is tracked in `packages/config/src/roadmap.ts` and the admin UI at `/roadmap`.

## Cross-cutting workstreams

Ongoing across every phase: security, testing, performance, accessibility, SEO, documentation, CI/CD, monitoring, cost optimization.

## Infrastructure evolution

| Current | Future (no redesign required) |
|---------|------------------------------|
| Google Cloud Run | Kubernetes, multi-region |
| Neon PostgreSQL | Read replicas, managed clusters |
| Redis cache | Distributed Redis |
| CDN headers + purge scripts | Full edge CDN (Cloudflare) |
| Optional OpenSearch | Primary search at scale |

## KPIs

**Technical:** uptime > 99.9%, API p95 < 200 ms, Core Web Vitals pass, test coverage > 90%.

**Business:** monthly visitors, organic traffic, newsletter subscribers, returning users, revenue, conversion rate.

## Risks & mitigation

Documented in `ROADMAP_RISKS` in config — SEO changes, AI costs, scaling, third-party outages, content quality, security threats. Mitigate via diversification, caching, monitoring, CI security gates, and the Security module.

## Maintenance process

1. After each major release, review phase item statuses in `packages/config/src/roadmap.ts`.
2. Update `ROADMAP_LAST_UPDATED` and this file.
3. Add or adjust items when new modules land; link `moduleRef` to spec or `docs/*-IMPLEMENTATION.md`.
4. Escalate blockers via risk register / technical debt backlog before release.
5. Validate against architecture (`docs/01-Architecture.md`), security, performance, and testing policies.

See also: [`roadmap/README.md`](../roadmap/README.md).

## Admin UI

| Route | Purpose |
|-------|---------|
| `/roadmap` | Overview, vision, phases, KPIs, risks |
| `/roadmap/releases` | v1–v5 release tracks |
| `/roadmap/milestones` | Per-phase milestones and item status |

Permission: `api.view` (internal planning, same as System status).

## Future features backlog

Deferred capabilities from all module specs are tracked in [`FUTURE-FEATURES.md`](./FUTURE-FEATURES.md) and admin `/roadmap/backlog`.

## Related

- Spec: `varnarc-project-docs/docs/36-Roadmap.md`
- Implementation: `docs/36-Roadmap-IMPLEMENTATION.md`
- Project spec: `PROJECT_SPEC.md`
