import type { Metadata } from 'next';
import Link from 'next/link';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubFeaturedStack } from '@/components/hub/hub-featured-stack';
import { EmptyState } from '@/components/shared/empty-state';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { unwrapList, type AiCategory, type AiToolListItem } from '@/components/ai-tools/types';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'AI Tools',
  description: 'Discover, compare, and review AI tools for writing, image, coding, and more.',
  alternates: { canonical: '/ai-tools' },
};

export const revalidate = 60;

const quickLinks = [
  { label: 'Trending', href: '/ai-tools/trending' },
  { label: 'New tools', href: '/ai-tools/new' },
  { label: 'Compare', href: '/ai-tools/compare' },
];

const popularLinks = [
  { label: 'Writing AI', href: '/ai-tools/search?q=writing' },
  { label: 'Image AI', href: '/ai-tools/search?q=image' },
  { label: 'Coding AI', href: '/ai-tools/search?q=code' },
];

export default async function AiToolsHomePage() {
  const [categoriesResult, sponsoredResult, popularResult] = await Promise.all([
    apiPublicFetch<AiCategory[]>('/ai-tools/categories?limit=24', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as AiCategory[] })),
    apiPublicFetch<AiToolListItem[]>('/ai-tools?sponsored=true&limit=6', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as AiToolListItem[] })),
    apiPublicFetch<AiToolListItem[]>('/ai-tools?sort=popular&limit=12', {
      next: { revalidate: 60 },
    }).catch(() => ({ data: [] as AiToolListItem[] })),
  ]);

  const categories = unwrapList(categoriesResult.data);
  const sponsored = unwrapList(sponsoredResult.data);
  const popular = unwrapList(popularResult.data);

  const categoryItems = categories.map((c) => ({
    label: c.name,
    description: c._count?.tools != null ? `${c._count.tools} tools` : (c.description ?? 'Browse'),
    href: `/ai-tools/${c.slug}`,
    icon: 'sparkles',
  }));

  const featuredStack = (sponsored.length ? sponsored : popular).slice(0, 3).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.shortDescription || t.description,
    href: `/ai-tools/${t.slug}`,
  }));

  const navItems = [
    {
      label: 'Advanced search',
      href: '/ai-tools/search',
      description: 'Filters & tags',
      icon: 'search',
    },
    { label: 'Trending', href: '/ai-tools/trending', description: 'Popular now', icon: 'trending' },
    { label: 'New tools', href: '/ai-tools/new', description: 'Recently added', icon: 'sparkles' },
    { label: 'Compare', href: '/ai-tools/compare', description: 'Side-by-side', icon: 'scale' },
    { label: 'Utilities', href: '/ai-tools/utilities', description: 'Free utilities', icon: 'zap' },
    {
      label: 'Bookmarks',
      href: '/ai-tools/bookmarks',
      description: 'Your saved tools',
      icon: 'star',
    },
  ];

  return (
    <ModuleHubShell
      moduleKey="ai-tools"
      title="Discover & compare AI tools"
      description="Discover and compare AI products for writing, image, video, coding, and productivity."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Tools' }]}
      popularLinks={popularLinks}
      searchPath="/ai-tools/search"
      overviewTitle="AI tools overview"
    >
      <div className="flex flex-wrap gap-3 text-sm">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-semibold text-blue-600 hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {categoryItems.length ? (
        <section>
          <HubSectionHeader title="Browse by category" viewAllHref="/ai-tools/search" />
          <HubIconGrid items={categoryItems} columns={4} />
        </section>
      ) : null}

      <section>
        <HubSectionHeader title="Explore AI tools" />
        <HubIconGrid items={navItems} columns={4} />
      </section>

      {featuredStack.length ? (
        <section>
          <HubFeaturedStack
            title="Featured AI tools"
            items={featuredStack}
            viewAllHref="/ai-tools/trending"
          />
        </section>
      ) : null}

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[#0b1f3a] sm:text-2xl">Trending tools</h2>
          <Link
            href="/ai-tools/trending"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        {popular.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {popular.map((t) => (
              <AiToolCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                description={t.shortDescription || t.description}
                pricingModel={t.pricingModel}
                freePlan={t.freePlan}
                featured={t.featured}
                sponsored={t.sponsored}
                logoUrl={t.logoUrl}
                categoryName={t.category?.name}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No AI tools yet" message="Published tools will appear here." />
        )}
      </section>
    </ModuleHubShell>
  );
}
