import { PageHeader, Card, CardHeader, CardTitle, CardDescription } from '@varnarc/ui';

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>Coming in a later phase</CardTitle>
          <CardDescription>
            This screen is permission-gated and ready for module implementation.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
