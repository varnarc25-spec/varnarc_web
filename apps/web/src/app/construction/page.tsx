import { ConstructionLandingPage } from '@/components/construction/landing/landing-page';
import { buildConstructionPageMetadata } from '@/lib/construction/seo';
import {
  fetchConstructionDashboard,
  fetchConstructionFaqs,
  fetchConstructionGuides,
  fetchConstructionMaterials,
  fetchConstructionProjects,
} from '@/services/construction';

type Props = {
  searchParams: Promise<{ intent?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('hub', { searchParams: params });
}

export const revalidate = 60;

const FALLBACK_CALCULATORS = [
  {
    label: 'Construction Cost',
    href: '/calculators/construction-cost',
    description: 'Project cost planning',
  },
  { label: 'Cement', href: '/construction/cement-calculator', description: 'Bag quantities' },
  { label: 'Concrete', href: '/construction/concrete-calculator', description: 'Mix & volume' },
  { label: 'RCC', href: '/construction/rcc-calculator', description: 'Slab, beam, column' },
  { label: 'Brick', href: '/construction/brick-calculator', description: 'Wall quantities' },
  {
    label: 'AAC blocks',
    href: '/construction/aac-block-calculator',
    description: 'Lightweight blocks',
  },
  { label: 'Steel', href: '/construction/steel-calculator', description: 'TMT weight' },
  {
    label: 'Bar bending schedule',
    href: '/construction/bar-bending-schedule',
    description: 'BBS quantities',
  },
  {
    label: 'BOQ Generator',
    href: '/construction/boq-generator',
    description: 'Indicative planning BOQ',
  },
  {
    label: 'Timeline planner',
    href: '/construction/timeline-planner',
    description: 'Phase schedule estimates',
  },
  {
    label: 'Budget tracker',
    href: '/construction/budget-tracker',
    description: 'Budget vs actual spend',
  },
  {
    label: 'Document vault',
    href: '/construction/document-vault',
    description: 'Private project files',
  },
  {
    label: 'Material selector',
    href: '/construction/material-selector',
    description: 'Task-based material guidance',
  },
  { label: 'Sand', href: '/construction/sand-calculator', description: 'Sand volumes' },
  { label: 'Aggregate', href: '/construction/aggregate-calculator', description: 'Jelly / stone' },
  { label: 'Plaster', href: '/construction/plaster-calculator', description: 'Wall & ceiling' },
  { label: 'Paint', href: '/construction/paint-calculator', description: 'Coverage & litres' },
  { label: 'Tile', href: '/construction/tile-calculator', description: 'Floor & wall area' },
  { label: 'Flooring', href: '/construction/flooring-calculator', description: 'Area by type' },
];

export default async function ConstructionPage({ searchParams }: Props) {
  const params = await searchParams;
  const [dashboardRes, materialsRes, guidesRes, faqsRes, projectsRes] = await Promise.all([
    fetchConstructionDashboard(),
    fetchConstructionMaterials({ featured: true, limit: 6 }),
    fetchConstructionGuides(),
    fetchConstructionFaqs(),
    fetchConstructionProjects(),
  ]);

  const calculators =
    dashboardRes.data?.relatedCalculators?.map((calc) => ({
      label: calc.name,
      description: 'Calculator',
      href: `/calculators/${calc.slug}`,
    })) ?? FALLBACK_CALCULATORS;

  const materials = (materialsRes.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    href: `/construction/materials/${item.id}`,
    description: item.description,
    meta: [item.category?.name, item.brand?.name].filter(Boolean).join(' · ') || null,
    price: item.approximatePrice,
    unit: item.unit,
    priceLabel:
      item.approximatePrice != null
        ? `₹${item.approximatePrice}${item.unit ? ` / ${item.unit}` : ''}`
        : null,
  }));

  const guides =
    guidesRes.data?.slice(0, 6).map((g) => ({
      href: `/construction/guides/${g.slug}`,
      label: g.title,
      description: g.summary,
      category: 'Guide',
      readMinutes: 6,
    })) ?? [];

  const faqs =
    faqsRes.data?.slice(0, 8).map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    })) ?? [];

  const projects =
    !projectsRes.unauthorized && projectsRes.data?.length
      ? projectsRes.data.slice(0, 3).map((p) => ({
          id: p.id,
          name: p.name,
          href: `/construction/project/${p.id}`,
          summary:
            [p.projectType, p.estimatedCost != null ? `₹${p.estimatedCost}` : null]
              .filter(Boolean)
              .join(' · ') || null,
        }))
      : [];

  return (
    <ConstructionLandingPage
      calculators={calculators}
      materials={materials}
      guides={guides}
      faqs={faqs}
      projects={projects}
      initialIntent={params.intent ?? null}
    />
  );
}
