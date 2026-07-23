import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';
import { formatPricingModel, type AiPricingModel } from './types';

export function AiToolCard({
  name,
  slug,
  description,
  pricingModel,
  freePlan,
  featured,
  sponsored,
  logoUrl,
  categoryName,
}: {
  name: string;
  slug: string;
  description?: string | null;
  pricingModel?: AiPricingModel | string | null;
  freePlan?: boolean;
  featured?: boolean;
  sponsored?: boolean;
  logoUrl?: string | null;
  categoryName?: string | null;
}) {
  return (
    <Link href={`/ai-tools/${slug}`} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-2 flex items-start gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-md border border-[var(--varnarc-border)] object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap gap-1.5 text-xs">
                {featured ? (
                  <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">Featured</span>
                ) : null}
                {sponsored ? (
                  <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">Sponsored</span>
                ) : null}
                {pricingModel ? (
                  <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">
                    {formatPricingModel(pricingModel)}
                  </span>
                ) : null}
                {freePlan ? (
                  <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">Free plan</span>
                ) : null}
              </div>
              <CardTitle className="text-lg">{name}</CardTitle>
              {categoryName ? (
                <p className="text-xs text-[var(--varnarc-subtle)]">{categoryName}</p>
              ) : null}
            </div>
          </div>
          {description ? (
            <CardDescription className="line-clamp-3">{description}</CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
