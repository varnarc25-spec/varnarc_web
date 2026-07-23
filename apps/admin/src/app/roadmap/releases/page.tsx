import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { RELEASE_TRACKS, ROADMAP_PHASES, ROADMAP_LAST_UPDATED } from '@varnarc/config';
import { RoadmapNav } from '@/components/roadmap/roadmap-nav';
import { PhaseStatusBadge } from '@/components/roadmap/status-badge';

export default function RoadmapReleasesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Release strategy"
        description={`Semantic release tracks aligned to roadmap phases. Last updated ${ROADMAP_LAST_UPDATED}.`}
      />
      <RoadmapNav active="/roadmap/releases" />

      <div className="space-y-4">
        {RELEASE_TRACKS.map((release) => {
          const phases = ROADMAP_PHASES.filter((phase) => release.targetPhaseIds.includes(phase.id));
          return (
            <Card key={release.version}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    {release.version} — {release.name}
                  </CardTitle>
                  <PhaseStatusBadge status={release.status} />
                </div>
                <CardDescription>{release.focus}</CardDescription>
                <p className="text-sm text-[var(--varnarc-subtle)]">
                  Phases: {phases.map((p) => `${p.id}. ${p.title}`).join(' · ') || '—'}
                </p>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
