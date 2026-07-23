import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@varnarc/ui';
import {
  CROSS_CUTTING_WORKSTREAMS,
  ROADMAP_KPIS,
  ROADMAP_LAST_UPDATED,
  ROADMAP_PHASES,
  ROADMAP_RISKS,
  ROADMAP_VISION,
  phaseProgressPercent,
} from '@varnarc/config';
import { RoadmapNav } from '@/components/roadmap/roadmap-nav';
import { ItemStatusBadge, PhaseStatusBadge } from '@/components/roadmap/status-badge';

export default function RoadmapOverviewPage() {
  const phase1 = ROADMAP_PHASES[0];
  const phase1Progress = phase1 ? phaseProgressPercent(phase1) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Development roadmap"
        description={`Long-term phases, release strategy, and platform vision. Last updated ${ROADMAP_LAST_UPDATED}.`}
      />
      <RoadmapNav active="/roadmap" />

      <p className="text-sm text-[var(--varnarc-subtle)]">
        Canonical source: <code className="text-xs">packages/config/src/roadmap.ts</code> and{' '}
        <code className="text-xs">docs/ROADMAP.md</code>. Review after every major release.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current release</CardDescription>
            <CardTitle className="text-2xl">v1.x</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Phase 1 progress</CardDescription>
            <CardTitle className="text-2xl">{phase1Progress}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Phases defined</CardDescription>
            <CardTitle className="text-2xl">{ROADMAP_PHASES.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Vision</h2>
        <p className="text-sm text-[var(--varnarc-subtle)]">{ROADMAP_VISION.join(' · ')}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Phases</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {ROADMAP_PHASES.map((phase) => (
            <Card key={phase.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Phase {phase.id}: {phase.title}
                  </CardTitle>
                  <PhaseStatusBadge status={phase.status} />
                </div>
                <CardDescription>{phase.objective}</CardDescription>
                <p className="text-sm font-medium text-[var(--varnarc-ink)]">
                  {phaseProgressPercent(phase)}% complete · {phase.releaseVersion}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cross-cutting workstreams</h2>
        <div className="flex flex-wrap gap-2">
          {CROSS_CUTTING_WORKSTREAMS.map((stream) => (
            <span key={stream.id} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              {stream.label}
              <ItemStatusBadge status={stream.status} />
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">KPIs</h2>
          <ul className="space-y-2 text-sm">
            {ROADMAP_KPIS.map((kpi) => (
              <li key={kpi.id} className="flex justify-between gap-4 border-b pb-2">
                <span>
                  <span className="text-[var(--varnarc-subtle)]">{kpi.category}</span> — {kpi.label}
                </span>
                <span className="font-medium">{kpi.target}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Risks</h2>
          <ul className="space-y-3 text-sm">
            {ROADMAP_RISKS.map((risk) => (
              <li key={risk.id} className="rounded-lg border p-3">
                <p className="font-medium">{risk.challenge}</p>
                <p className="mt-1 text-[var(--varnarc-subtle)]">{risk.mitigation}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-[var(--varnarc-subtle)]">
                  Severity: {risk.severity}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
