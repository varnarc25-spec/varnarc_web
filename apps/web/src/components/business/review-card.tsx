import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, Badge } from '@varnarc/ui';

export function ReviewCard({
  title,
  slug,
  score,
}: {
  title: string;
  slug: string;
  score?: number | null;
}) {
  return (
    <Link href={`/reviews/${slug}`} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {score != null ? <Badge>{Number(score).toFixed(1)}</Badge> : null}
          </div>
          <CardDescription>Read the full review</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
