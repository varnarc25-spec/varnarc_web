import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { fetchConstructionChecklist } from '@/services/construction';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchConstructionChecklist(slug);
    return buildSeoMetadata({
      entityType: 'construction_checklist',
      entityId: slug,
      path: `/construction/checklists/${slug}`,
      title: data.title,
      description: data.description || `Construction checklist: ${data.title}`,
    });
  } catch {
    return { title: 'Checklist', alternates: { canonical: `/construction/checklists/${slug}` } };
  }
}

export default async function ConstructionChecklistDetailPage({ params }: Props) {
  const { slug } = await params;
  let checklist: Awaited<ReturnType<typeof fetchConstructionChecklist>>['data'] | null = null;

  try {
    const result = await fetchConstructionChecklist(slug);
    checklist = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const phases = groupByPhase(checklist.items);

  return (
    <ContentLayout
      title={checklist.title}
      description={checklist.description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Checklists', href: '/construction/checklists' },
        { label: checklist.title },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/construction/planner"
          className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]"
        >
          Open planner
        </Link>
        <Link
          href="/construction/projects"
          className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
        >
          My projects
        </Link>
      </div>

      {Object.entries(phases).map(([phase, items]) => (
        <section key={phase} className="mb-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">{phase}</h2>
          <ul className="mt-3 space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id ?? `${phase}-${index}`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-semibold text-[#0b1f3a]">{item.label}</p>
                {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </ContentLayout>
  );
}

function groupByPhase(items: Array<{ id?: string; label: string; description?: string | null; phase?: string | null }>) {
  return items.reduce<Record<string, typeof items>>((acc, item) => {
    const phase = item.phase?.trim() || 'General';
    acc[phase] = acc[phase] ?? [];
    acc[phase].push(item);
    return acc;
  }, {});
}
