import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { fetchConstructionChecklists } from '@/services/construction';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_CHECKLIST_QUALIFICATION } from '@varnarc/validation';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildConstructionPageMetadata('checklists');
}

export default async function ConstructionChecklistsPage() {
  const { data: checklists } = await fetchConstructionChecklists();

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Checklists', path: '/construction/checklists' },
        ])}
        itemList={{
          name: 'Construction checklists',
          path: '/construction/checklists',
          items: (checklists ?? []).map((c) => ({
            name: c.title,
            path: `/construction/checklists/${c.slug}`,
          })),
        }}
      />
      <ContentLayout
        title="Construction checklists"
        description="Phase-wise planning checklists from before construction through house handover. Mark complete, add notes, print, and save progress to a project when logged in."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Checklists' },
        ]}
      >
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          {CONSTRUCTION_CHECKLIST_QUALIFICATION}
        </p>

        {checklists?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checklists.map((checklist) => (
              <Link
                key={checklist.slug}
                href={`/construction/checklists/${checklist.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                <h2 className="text-base font-extrabold text-[#0b1f3a]">{checklist.title}</h2>
                {checklist.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {checklist.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                  {checklist.phase ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">{checklist.phase}</span>
                  ) : null}
                  {checklist.itemCount != null ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {checklist.itemCount} items
                    </span>
                  ) : null}
                </div>
                <span className="mt-3 inline-block text-sm font-medium text-[#f97316]">
                  Open checklist →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Checklists coming soon"
            message="Published construction checklists will appear here once available."
            action={
              <Link
                href="/construction/project-readiness"
                className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white"
              >
                Project readiness checker
              </Link>
            }
          />
        )}
      </ContentLayout>
    </>
  );
}
