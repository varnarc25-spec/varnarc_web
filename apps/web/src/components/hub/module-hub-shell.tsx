import type { ReactNode } from 'react';
import { AdBanner } from '@/components/business/ad-banner';
import { HubHero, type HubCrumb } from '@/components/hub/hub-hero';
import { HubIntentSelector } from '@/components/hub/hub-intent-selector';
import { HubTrustBar } from '@/components/hub/hub-trust-bar';
import { HubDisclaimer } from '@/components/hub/hub-disclaimer';
import { getModuleHubMeta } from '@/lib/module-hub-configs';

export function ModuleHubShell({
  moduleKey,
  title,
  description,
  breadcrumbs,
  popularLinks,
  overviewTitle,
  searchPath,
  showAd = true,
  showIntentSelector = false,
  children,
}: {
  moduleKey: string;
  title: string;
  description: string;
  breadcrumbs?: HubCrumb[];
  popularLinks?: Array<{ label: string; href: string }>;
  overviewTitle?: string;
  searchPath?: string;
  showAd?: boolean;
  showIntentSelector?: boolean;
  children: ReactNode;
}) {
  const meta = getModuleHubMeta(moduleKey);
  const isFinance = moduleKey === 'finance';

  return (
    <main className="w-full bg-white">
      <HubHero
        moduleKey={moduleKey}
        badge={meta.badge}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        searchPlaceholder={meta.searchPlaceholder}
        popularLinks={isFinance ? undefined : popularLinks}
        heroSteps={meta.heroSteps}
        overviewTitle={overviewTitle ?? (isFinance ? 'Your Finance Overview' : undefined)}
        searchPath={searchPath}
        showBreadcrumbs={!isFinance}
        popularLabel={isFinance ? 'Popular searches:' : 'Popular:'}
        popularStyle={isFinance ? 'pills' : 'links'}
      />
      {showIntentSelector ? <HubIntentSelector /> : null}
      <div className="site-container space-y-10 px-4 py-8 sm:space-y-12 sm:py-10">
        {showAd ? (
          <div>
            <AdBanner slot="content-top" />
          </div>
        ) : null}
        {children}
      </div>
      <HubTrustBar title={meta.trustTitle} items={meta.trustItems} />
      <HubDisclaimer text={meta.disclaimer} />
    </main>
  );
}
