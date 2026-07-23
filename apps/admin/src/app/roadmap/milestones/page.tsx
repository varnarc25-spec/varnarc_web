import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { getAllMilestones, ROADMAP_LAST_UPDATED } from '@varnarc/config';
import { RoadmapNav } from '@/components/roadmap/roadmap-nav';
import { ItemStatusBadge, PhaseStatusBadge } from '@/components/roadmap/status-badge';

export default function RoadmapMilestonesPage() {
  const milestones = getAllMilestones();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Milestones"
        description={`Phase objectives, deliverables, and progress. Last updated ${ROADMAP_LAST_UPDATED}.`}
      />
      <RoadmapNav active="/roadmap/milestones" />

      <div className="space-y-4">
        {milestones.map(({ phase, progress }) => (
          <Card key={phase.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  Phase {phase.id}: {phase.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{progress}%</span>
                  <PhaseStatusBadge status={phase.status} />
                </div>
              </div>
              <CardDescription>
                <strong>Milestone:</strong> {phase.milestone}
              </CardDescription>
              <p className="text-sm text-[var(--varnarc-subtle)]">{phase.objective}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {phase.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <span>
                      {item.label}
                      {item.moduleRef ? (
                        <span className="ml-2 text-xs text-[var(--varnarc-subtle)]">({item.moduleRef})</span>
                      ) : null}
                    </span>
                    <ItemStatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
