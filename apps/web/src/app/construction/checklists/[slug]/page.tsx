import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionChecklistClient } from '@/components/construction/checklists/construction-checklist-client';
import { fetchConstructionChecklist, fetchConstructionChecklists } from '@/services/construction';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_CHECKLIST_QUALIFICATION, normalizeChecklistItems } from '@varnarc/validation';
import { ApiError } from '@/services/api-client';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const { data } = await fetchConstructionChecklists();
    return (data ?? []).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchConstructionChecklist(slug);
    return {
      title: data.seoTitle || `${data.title} Checklist | Varnarc`,
      description:
        data.seoDescription ||
        data.description ||
        `${data.title} construction checklist on Varnarc. Planning aid — not a compliance certificate.`,
      alternates: { canonical: `/construction/checklists/${slug}` },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: 'Checklist',
      robots: { index: false },
      alternates: { canonical: `/construction/checklists/${slug}` },
    };
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

  const items = normalizeChecklistItems(
    checklist.items.map((item) => ({
      id: item.id,
      title: item.title ?? item.label,
      description: item.description,
      category: item.category,
      phase: item.phase,
      professionalReviewRequired: item.professionalReviewRequired,
      sortOrder: item.sortOrder,
    })),
    checklist.phase,
  );

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Checklists', path: '/construction/checklists' },
          { name: checklist.title, path: `/construction/checklists/${slug}` },
        ])}
        article={{
          title: checklist.title,
          description: checklist.description,
          path: `/construction/checklists/${slug}`,
          dateModified: checklist.updatedAt,
        }}
      />
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
        <div className="mb-6 flex flex-wrap gap-3 print:hidden">
          <Link href="/construction/checklists" className={cx.secondaryBtn}>
            ← All checklists
          </Link>
          <Link href="/construction/projects" className={cx.primaryBtn}>
            My projects
          </Link>
          <Link href="/construction/project-readiness" className={cx.secondaryBtn}>
            Project readiness
          </Link>
        </div>

        <ConstructionChecklistClient
          slug={slug}
          title={checklist.title}
          items={items}
          qualification={checklist.qualification ?? CONSTRUCTION_CHECKLIST_QUALIFICATION}
          professionalReviewNote={checklist.professionalReviewNote}
        />
      </ContentLayout>
    </>
  );
}
