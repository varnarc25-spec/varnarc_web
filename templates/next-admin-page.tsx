import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type ExampleRow = {
  id: string;
  name: string;
};

export default async function ExamplePage() {
  const result = await apiServerFetch<ExampleRow[]>('/examples');

  return (
    <div>
      <PageHeader title="Examples" description="List page template." />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load data</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul>
          {(result.data ?? []).map((row) => (
            <li key={row.id}>{row.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
