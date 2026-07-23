import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';

export function BusinessCard({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  return (
    <Link href={`/directory/${slug}`} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          {description ? (
            <CardDescription className="line-clamp-3">{description}</CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
