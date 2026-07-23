import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchConstructionChecklists } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction Checklists',
  description: 'Material and milestone checklists for residential and commercial builds.',
  alternates: { canonical: '/construction/checklists' },
};

export default async function ConstructionChecklistsPage() {
  const { data: checklists } = await fetchConstructionChecklists();

  return (
    <ContentLayout
      title="Construction checklists"
      description="Track materials, inspections, and milestones from planning through handover."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Checklists' },
      ]}
    >
      {checklists.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {checklists.map((checklist) => (
            <Link
              key={checklist.slug}
              href={`/construction/checklists/${checklist.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h2 className="text-base font-extrabold text-[#0b1f3a]">{checklist.title}</h2>
              {checklist.description ? (
                <p className="mt-2 text-sm text-slate-600">{checklist.description}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                {checklist.phase ? <span className="rounded-full bg-slate-100 px-2 py-1">{checklist.phase}</span> : null}
                {checklist.itemCount != null ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1">{checklist.itemCount} items</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Checklists coming soon"
          message="Published construction checklists will appear here once available."
          action={
            <Link
              href="/construction/planner"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Open project planner
            </Link>
          }
        />
      )}
    </ContentLayout>
  );
}
