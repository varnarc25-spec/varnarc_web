import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';

type Version = {
  version?: string;
  apiPrefix?: string;
  environment?: string;
  node?: string;
};

export default async function SystemVersionPage() {
  const result = await apiServerFetch<Version>('/version');

  return (
    <div className="space-y-8">
      <PageHeader title="System version" description="Deployed API version and runtime metadata." />
      <SystemNav active="/system/version" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load version</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>API version</CardDescription>
            <CardTitle className="text-3xl">{result.data?.version ?? '—'}</CardTitle>
            <CardDescription className="mt-4 space-y-1">
              <span className="block">Prefix: {result.data?.apiPrefix ?? '—'}</span>
              <span className="block">Environment: {result.data?.environment ?? '—'}</span>
              <span className="block">Node: {result.data?.node ?? '—'}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
