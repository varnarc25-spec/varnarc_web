import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';
import { Calculator } from 'lucide-react';

export function CalculatorCard({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  return (
    <Link href={`/calculators/${slug}`} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-[var(--varnarc-muted)] text-[var(--varnarc-brand)]">
            <Calculator className="h-4 w-4" aria-hidden />
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {description ? (
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
