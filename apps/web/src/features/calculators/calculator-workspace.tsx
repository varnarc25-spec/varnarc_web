import type { ReactNode } from 'react';
import { AdBanner } from '@/components/business/ad-banner';
import { CalculatorInfoPanel } from '@/features/calculators/calculator-info-panel';
import type { RelatedArticle } from '@/features/calculators/calculator-related-articles';

export function CalculatorWorkspace({
  name,
  slug,
  description,
  faq,
  relatedCalculators,
  relatedArticles,
  extraSidebar,
  children,
}: {
  name: string;
  slug: string;
  description?: string | null;
  faq: Array<{ q: string; a: string }>;
  relatedCalculators: Array<{ name: string; slug: string; href?: string }>;
  relatedArticles?: RelatedArticle[];
  extraSidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-5 lg:items-start">
        <div className="space-y-4 lg:col-span-3">{children}</div>
        <div className="space-y-5 lg:col-span-2">
          <AdBanner slot="calculator-sidebar" />
          <CalculatorInfoPanel
            name={name}
            slug={slug}
            description={description}
            faq={faq}
            relatedCalculators={relatedCalculators}
            relatedArticles={relatedArticles ?? []}
          />
          {extraSidebar}
        </div>
      </div>
      <AdBanner slot="calculator-bottom" />
    </div>
  );
}
