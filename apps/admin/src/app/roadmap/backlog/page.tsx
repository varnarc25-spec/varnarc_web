import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import {
  FUTURE_FEATURES_LAST_UPDATED,
  countFutureFeatures,
  groupFeaturesByModule,
} from '@varnarc/config';
import { RoadmapNav } from '@/components/roadmap/roadmap-nav';
import { BacklogFeatureRow } from '@/components/roadmap/backlog-feature-row';

export default function RoadmapBacklogPage() {
  const groups = groupFeaturesByModule();
  const counts = countFutureFeatures();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Future features backlog"
        description={`Deferred and out-of-scope items aggregated from module specs. Last updated ${FUTURE_FEATURES_LAST_UPDATED}.`}
      />
      <RoadmapNav active="/roadmap/backlog" />

      <p className="text-sm text-[var(--varnarc-subtle)]">
        Canonical source: <code className="text-xs">packages/config/src/future-features.ts</code>.
        Items are explicitly out of scope for current module acceptance criteria unless promoted to the roadmap.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total items</CardDescription>
            <CardTitle className="text-2xl">{counts.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Backlog</CardDescription>
            <CardTitle className="text-2xl">{counts.byStatus.backlog}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>High priority</CardDescription>
            <CardTitle className="text-2xl">{counts.byPriority.high}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Modules tracked</CardDescription>
            <CardTitle className="text-2xl">{groups.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        {groups.map(({ module, features }) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle>
                {module.number}. {module.name}
              </CardTitle>
              <CardDescription>
                Spec: {module.specRef} · {features.length} future items
              </CardDescription>
              <ul className="mt-4 space-y-2">
                {features.map((feature) => (
                  <BacklogFeatureRow key={feature.id} feature={feature} />
                ))}
              </ul>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
