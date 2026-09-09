import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';
import {
  DatabaseBackupPanel,
  type DatabaseBackupStatus,
} from '@/components/settings/database-backup-panel';

export default async function DatabaseSettingsPage() {
  const result = await apiServerFetch<DatabaseBackupStatus>('/settings/database');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Database"
        description="Download a full PostgreSQL dump of the live database (Neon today) and restore it on VPS Postgres."
      />
      <SettingsNav active="/settings/database" />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <DatabaseBackupPanel initial={result.data ?? { configured: false }} />
      )}
    </div>
  );
}
