/** Reusable Construction Checklist system — planning aids, not compliance certificates. */

import { z } from 'zod';

export const CONSTRUCTION_CHECKLIST_SYSTEM_VERSION = '2026.08.1';

export const CONSTRUCTION_CHECKLIST_QUALIFICATION =
  'Varnarc construction checklists are planning and coordination aids. Completing items does not certify that construction work is technically compliant, code-compliant, or structurally safe. For technical items, inspection by the relevant qualified professional may be required.';

export const CONSTRUCTION_CHECKLIST_PROFESSIONAL_REVIEW_NOTE =
  'Technical item — inspection or sign-off by the relevant qualified professional may be required. This checklist does not replace that review.';

export const constructionChecklistItemSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).max(80),
  phase: z.string().min(1).max(80),
  professionalReviewRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export type ConstructionChecklistItem = z.infer<typeof constructionChecklistItemSchema>;

export const constructionChecklistDefinitionSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional().nullable(),
  /** High-level phase grouping for hub filters / SEO. */
  phase: z.string().min(1).max(80),
  category: z.string().min(1).max(80).default('construction'),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  items: z.array(constructionChecklistItemSchema).min(1).max(120),
});

export type ConstructionChecklistDefinition = z.infer<typeof constructionChecklistDefinitionSchema>;

export const checklistItemProgressSchema = z.object({
  completed: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

export const saveConstructionChecklistProgressSchema = z.object({
  checklistSlug: z.string().min(1).max(120),
  items: z
    .record(z.string().min(1).max(80), checklistItemProgressSchema)
    .refine((obj) => Object.keys(obj).length <= 200, 'Too many progress entries.'),
});

export type SaveConstructionChecklistProgressInput = z.infer<
  typeof saveConstructionChecklistProgressSchema
>;

function item(
  id: string,
  title: string,
  opts: {
    description?: string;
    category: string;
    phase: string;
    professionalReviewRequired?: boolean;
    sortOrder: number;
  },
): ConstructionChecklistItem {
  return {
    id,
    title,
    description: opts.description ?? null,
    category: opts.category,
    phase: opts.phase,
    professionalReviewRequired: Boolean(opts.professionalReviewRequired),
    sortOrder: opts.sortOrder,
  };
}

/** Canonical published checklists — source of truth for seed + empty-DB fallback. */
export const CANONICAL_CONSTRUCTION_CHECKLISTS: ConstructionChecklistDefinition[] = [
  {
    slug: 'before-construction',
    title: 'Before construction',
    description:
      'Planning documents, approvals and commercial readiness before work starts on site.',
    phase: 'Before construction',
    category: 'planning',
    sortOrder: 10,
    seoTitle: 'Before Construction Checklist | Varnarc',
    seoDescription:
      'Planning checklist for budget, drawings, approvals, BOQ and contracts before construction starts. Not a compliance certificate.',
    items: [
      item('budget-approved', 'Project budget approved', {
        category: 'Commercial',
        phase: 'Before construction',
        sortOrder: 1,
        description: 'Overall budget and contingency agreed by decision-makers.',
      }),
      item('drawings-ready', 'Architectural drawings available', {
        category: 'Design',
        phase: 'Before construction',
        sortOrder: 2,
        professionalReviewRequired: true,
        description: 'Usable architectural set for pricing and approvals.',
      }),
      item('structural-drawings', 'Structural drawings available', {
        category: 'Design',
        phase: 'Before construction',
        sortOrder: 3,
        professionalReviewRequired: true,
        description: 'Structural drawings for the intended scope.',
      }),
      item('approvals', 'Required approvals obtained or in progress', {
        category: 'Approvals',
        phase: 'Before construction',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('boq-ready', 'BOQ or itemised scope ready', {
        category: 'Commercial',
        phase: 'Before construction',
        sortOrder: 5,
      }),
      item('contract-ready', 'Contractor engagement terms agreed', {
        category: 'Commercial',
        phase: 'Before construction',
        sortOrder: 6,
      }),
      item('insurance', 'Site insurance / coverage reviewed', {
        category: 'Risk',
        phase: 'Before construction',
        sortOrder: 7,
      }),
    ],
  },
  {
    slug: 'site-preparation',
    title: 'Site preparation',
    description: 'Access, temporary services, safety and clearing before excavation.',
    phase: 'Site preparation',
    category: 'site',
    sortOrder: 20,
    seoTitle: 'Site Preparation Checklist | Varnarc',
    seoDescription:
      'Site preparation checklist for access, temporary power/water, safety and clearing. Planning aid only.',
    items: [
      item('site-access', 'Site access and storage areas confirmed', {
        category: 'Logistics',
        phase: 'Site preparation',
        sortOrder: 1,
      }),
      item('temp-power-water', 'Temporary power and water arranged', {
        category: 'Services',
        phase: 'Site preparation',
        sortOrder: 2,
      }),
      item('boundary-marking', 'Boundaries and levels marked', {
        category: 'Survey',
        phase: 'Site preparation',
        sortOrder: 3,
        professionalReviewRequired: true,
      }),
      item('clearing', 'Site cleared of debris and vegetation as planned', {
        category: 'Works',
        phase: 'Site preparation',
        sortOrder: 4,
      }),
      item('safety-setup', 'Basic site safety measures in place', {
        category: 'Safety',
        phase: 'Site preparation',
        sortOrder: 5,
        professionalReviewRequired: true,
        description: 'Barricades, PPE expectations and first-aid arrangements as applicable.',
      }),
      item('soil-report', 'Soil / geotech inputs available for foundation design', {
        category: 'Investigation',
        phase: 'Site preparation',
        sortOrder: 6,
        professionalReviewRequired: true,
      }),
    ],
  },
  {
    slug: 'foundation',
    title: 'Foundation',
    description: 'Excavation, PCC, footings and below-grade waterproofing coordination.',
    phase: 'Foundation',
    category: 'structure',
    sortOrder: 30,
    seoTitle: 'Foundation Construction Checklist | Varnarc',
    seoDescription:
      'Foundation checklist for excavation, PCC, reinforcement and inspections. Not a structural compliance certificate.',
    items: [
      item('excavation-depth', 'Excavation depth and extents checked against drawings', {
        category: 'Excavation',
        phase: 'Foundation',
        sortOrder: 1,
        professionalReviewRequired: true,
      }),
      item('pcc-complete', 'PCC laid as specified', {
        category: 'Concrete',
        phase: 'Foundation',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('footing-steel', 'Footing reinforcement placed and inspected', {
        category: 'Reinforcement',
        phase: 'Foundation',
        sortOrder: 3,
        professionalReviewRequired: true,
      }),
      item('footing-pour', 'Footing concrete poured with required checks', {
        category: 'Concrete',
        phase: 'Foundation',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('backfill', 'Backfill and compaction completed as planned', {
        category: 'Earthworks',
        phase: 'Foundation',
        sortOrder: 5,
      }),
      item('below-grade-wp', 'Below-grade waterproofing applied where required', {
        category: 'Waterproofing',
        phase: 'Foundation',
        sortOrder: 6,
        professionalReviewRequired: true,
      }),
    ],
  },
  {
    slug: 'rcc',
    title: 'RCC',
    description: 'Columns, beams, slabs and related reinforced concrete works.',
    phase: 'RCC',
    category: 'structure',
    sortOrder: 40,
    seoTitle: 'RCC Construction Checklist | Varnarc',
    seoDescription:
      'RCC checklist for formwork, reinforcement, pours and curing. Technical inspection may be required — not a compliance certificate.',
    items: [
      item('formwork', 'Formwork / shuttering checked before pour', {
        category: 'Formwork',
        phase: 'RCC',
        sortOrder: 1,
        professionalReviewRequired: true,
      }),
      item('column-steel', 'Column reinforcement checked', {
        category: 'Reinforcement',
        phase: 'RCC',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('beam-slab-steel', 'Beam and slab reinforcement checked', {
        category: 'Reinforcement',
        phase: 'RCC',
        sortOrder: 3,
        professionalReviewRequired: true,
      }),
      item('cover-spacers', 'Cover blocks / spacers in place', {
        category: 'Reinforcement',
        phase: 'RCC',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('concrete-pour', 'Concrete pour executed with recorded checks', {
        category: 'Concrete',
        phase: 'RCC',
        sortOrder: 5,
        professionalReviewRequired: true,
      }),
      item('curing', 'Curing started and maintained as specified', {
        category: 'Concrete',
        phase: 'RCC',
        sortOrder: 6,
        professionalReviewRequired: true,
      }),
      item('cube-tests', 'Cube / strength tests arranged where required', {
        category: 'Quality',
        phase: 'RCC',
        sortOrder: 7,
        professionalReviewRequired: true,
      }),
    ],
  },
  {
    slug: 'masonry',
    title: 'Masonry',
    description: 'Block / brickwork, openings and wall readiness for finishes.',
    phase: 'Masonry',
    category: 'envelope',
    sortOrder: 50,
    seoTitle: 'Masonry Construction Checklist | Varnarc',
    seoDescription:
      'Masonry checklist for walls, openings and alignment. Planning aid — not technical certification.',
    items: [
      item('material-approved', 'Masonry materials approved (brick/block/mortar)', {
        category: 'Materials',
        phase: 'Masonry',
        sortOrder: 1,
      }),
      item('wall-alignment', 'Wall lines and levels checked', {
        category: 'Workmanship',
        phase: 'Masonry',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('openings', 'Door and window openings sized per drawings', {
        category: 'Openings',
        phase: 'Masonry',
        sortOrder: 3,
      }),
      item('lintels', 'Lintels / bands placed where required', {
        category: 'Structure',
        phase: 'Masonry',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('chases', 'Service chases coordinated before plaster', {
        category: 'MEP coordination',
        phase: 'Masonry',
        sortOrder: 5,
      }),
      item('curing-masonry', 'Masonry curing / wetting as specified', {
        category: 'Workmanship',
        phase: 'Masonry',
        sortOrder: 6,
      }),
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    description: 'Conduiting, wiring, boards and testing coordination.',
    phase: 'Electrical',
    category: 'mep',
    sortOrder: 60,
    seoTitle: 'Electrical Construction Checklist | Varnarc',
    seoDescription:
      'Electrical works checklist for conduiting, boards and testing. Licensed electrician inspection may be required.',
    items: [
      item('layout-approved', 'Electrical layout marked on site', {
        category: 'Layout',
        phase: 'Electrical',
        sortOrder: 1,
        professionalReviewRequired: true,
      }),
      item('conduiting', 'Conduiting completed before plaster/slab as applicable', {
        category: 'Conduiting',
        phase: 'Electrical',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('wiring', 'Wiring pulled and terminated as planned', {
        category: 'Wiring',
        phase: 'Electrical',
        sortOrder: 3,
        professionalReviewRequired: true,
      }),
      item('db-installed', 'Distribution board installed and labelled', {
        category: 'Boards',
        phase: 'Electrical',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('earthing', 'Earthing arrangements completed', {
        category: 'Safety',
        phase: 'Electrical',
        sortOrder: 5,
        professionalReviewRequired: true,
      }),
      item('testing', 'Insulation / functional tests recorded', {
        category: 'Testing',
        phase: 'Electrical',
        sortOrder: 6,
        professionalReviewRequired: true,
      }),
    ],
  },
  {
    slug: 'plumbing',
    title: 'Plumbing',
    description: 'Water supply, drainage and fixture readiness.',
    phase: 'Plumbing',
    category: 'mep',
    sortOrder: 70,
    seoTitle: 'Plumbing Construction Checklist | Varnarc',
    seoDescription:
      'Plumbing checklist for supply, drainage and pressure tests. Qualified plumber review may be required.',
    items: [
      item('layout-plumbing', 'Plumbing layout marked and coordinated', {
        category: 'Layout',
        phase: 'Plumbing',
        sortOrder: 1,
        professionalReviewRequired: true,
      }),
      item('supply-lines', 'Water supply lines installed', {
        category: 'Supply',
        phase: 'Plumbing',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('drainage', 'Drainage / soil lines installed with falls checked', {
        category: 'Drainage',
        phase: 'Plumbing',
        sortOrder: 3,
        professionalReviewRequired: true,
      }),
      item('pressure-test', 'Pressure / leak tests completed', {
        category: 'Testing',
        phase: 'Plumbing',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('fixtures', 'Sanitary fixtures fitted or staged for handover', {
        category: 'Fixtures',
        phase: 'Plumbing',
        sortOrder: 5,
      }),
      item('water-tank', 'Overhead / underground tank connections checked', {
        category: 'Storage',
        phase: 'Plumbing',
        sortOrder: 6,
        professionalReviewRequired: true,
      }),
    ],
  },
  {
    slug: 'waterproofing',
    title: 'Waterproofing',
    description: 'Wet areas, terraces and below-grade waterproofing steps.',
    phase: 'Waterproofing',
    category: 'finishes',
    sortOrder: 80,
    seoTitle: 'Waterproofing Construction Checklist | Varnarc',
    seoDescription:
      'Waterproofing checklist for bathrooms, terraces and critical areas. Specialist inspection may be required.',
    items: [
      item('surface-prep', 'Surfaces prepared and cleaned before treatment', {
        category: 'Preparation',
        phase: 'Waterproofing',
        sortOrder: 1,
      }),
      item('bathroom-wp', 'Bathroom / wet-area waterproofing applied', {
        category: 'Wet areas',
        phase: 'Waterproofing',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('terrace-wp', 'Terrace / roof waterproofing applied', {
        category: 'Terrace',
        phase: 'Waterproofing',
        sortOrder: 3,
        professionalReviewRequired: true,
      }),
      item('ponding-test', 'Ponding / leak test completed where applicable', {
        category: 'Testing',
        phase: 'Waterproofing',
        sortOrder: 4,
        professionalReviewRequired: true,
      }),
      item('protection-layer', 'Protection layer / screed sequenced correctly', {
        category: 'Protection',
        phase: 'Waterproofing',
        sortOrder: 5,
        professionalReviewRequired: true,
      }),
    ],
  },
  {
    slug: 'painting',
    title: 'Painting',
    description: 'Surface prep, primers and finish coats.',
    phase: 'Painting',
    category: 'finishes',
    sortOrder: 90,
    seoTitle: 'Painting Construction Checklist | Varnarc',
    seoDescription:
      'Painting checklist for putty, primer and finish coats. Coordination aid — not a quality certificate.',
    items: [
      item('surface-ready', 'Surfaces dry, cleaned and ready for paint', {
        category: 'Preparation',
        phase: 'Painting',
        sortOrder: 1,
      }),
      item('putty', 'Putty / filler applied and sanded', {
        category: 'Preparation',
        phase: 'Painting',
        sortOrder: 2,
      }),
      item('primer', 'Primer coats applied', {
        category: 'Coatings',
        phase: 'Painting',
        sortOrder: 3,
      }),
      item('finish-coats', 'Finish coats applied as specified', {
        category: 'Coatings',
        phase: 'Painting',
        sortOrder: 4,
      }),
      item('touch-ups', 'Touch-ups and edge cleaning completed', {
        category: 'Finishing',
        phase: 'Painting',
        sortOrder: 5,
      }),
      item('protection', 'Finished surfaces protected until handover', {
        category: 'Protection',
        phase: 'Painting',
        sortOrder: 6,
      }),
    ],
  },
  {
    slug: 'pre-handover',
    title: 'Pre-handover',
    description: 'Snagging, documentation and systems checks before possession.',
    phase: 'Pre-handover',
    category: 'handover',
    sortOrder: 100,
    seoTitle: 'Pre-Handover Construction Checklist | Varnarc',
    seoDescription:
      'Pre-handover snag and documentation checklist. Does not certify technical compliance.',
    items: [
      item('snag-list', 'Snag list prepared and shared', {
        category: 'Snagging',
        phase: 'Pre-handover',
        sortOrder: 1,
      }),
      item('mep-retest', 'MEP functional re-check completed', {
        category: 'MEP',
        phase: 'Pre-handover',
        sortOrder: 2,
        professionalReviewRequired: true,
      }),
      item('keys-access', 'Keys, access cards and remotes inventoried', {
        category: 'Access',
        phase: 'Pre-handover',
        sortOrder: 3,
      }),
      item('docs-pack', 'Drawings, warranties and manuals collected', {
        category: 'Documentation',
        phase: 'Pre-handover',
        sortOrder: 4,
      }),
      item('cleaning', 'Deep cleaning scheduled or completed', {
        category: 'Cleaning',
        phase: 'Pre-handover',
        sortOrder: 5,
      }),
      item('payment-status', 'Payment milestones status reviewed', {
        category: 'Commercial',
        phase: 'Pre-handover',
        sortOrder: 6,
      }),
    ],
  },
  {
    slug: 'house-handover',
    title: 'House handover',
    description: 'Final walkthrough, possession and post-handover contacts.',
    phase: 'House handover',
    category: 'handover',
    sortOrder: 110,
    seoTitle: 'House Handover Checklist | Varnarc',
    seoDescription:
      'House handover checklist for walkthrough, possession and contacts. Not a certificate of technical compliance.',
    items: [
      item('final-walkthrough', 'Final walkthrough completed with stakeholders', {
        category: 'Walkthrough',
        phase: 'House handover',
        sortOrder: 1,
      }),
      item('snags-closed', 'Critical snags closed or scheduled with owners', {
        category: 'Snagging',
        phase: 'House handover',
        sortOrder: 2,
      }),
      item('possession', 'Possession / keys handed over', {
        category: 'Possession',
        phase: 'House handover',
        sortOrder: 3,
      }),
      item('meter-readings', 'Utility meter readings recorded', {
        category: 'Utilities',
        phase: 'House handover',
        sortOrder: 4,
      }),
      item('contacts', 'Defect liability / service contacts shared', {
        category: 'Support',
        phase: 'House handover',
        sortOrder: 5,
      }),
      item('as-built', 'As-built / final drawings provided where available', {
        category: 'Documentation',
        phase: 'House handover',
        sortOrder: 6,
        professionalReviewRequired: true,
      }),
    ],
  },
];

export function getCanonicalChecklist(slug: string) {
  return CANONICAL_CONSTRUCTION_CHECKLISTS.find((c) => c.slug === slug) ?? null;
}

export function normalizeChecklistItems(
  raw: unknown,
  fallbackPhase?: string | null,
): ConstructionChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return {
          id: `item-${index + 1}`,
          title: entry,
          description: null,
          category: 'General',
          phase: fallbackPhase?.trim() || 'General',
          professionalReviewRequired: false,
          sortOrder: index + 1,
        } satisfies ConstructionChecklistItem;
      }
      const row = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      const title = String(row.title ?? row.label ?? `Item ${index + 1}`).trim();
      const id =
        typeof row.id === 'string' && row.id.trim()
          ? row.id.trim()
          : `item-${index + 1}-${title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .slice(0, 40)}`;
      return {
        id,
        title,
        description: row.description != null ? String(row.description) : null,
        category: String(row.category ?? 'General'),
        phase: String(row.phase ?? fallbackPhase ?? 'General'),
        professionalReviewRequired: Boolean(
          row.professionalReviewRequired ?? row.requiresProfessionalReview,
        ),
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : index + 1,
      } satisfies ConstructionChecklistItem;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function summarizeChecklistProgress(input: {
  items: ConstructionChecklistItem[];
  progress: Record<string, { completed?: boolean; notes?: string | null }>;
}) {
  const total = input.items.length;
  const completed = input.items.filter((i) => input.progress[i.id]?.completed).length;
  const withNotes = input.items.filter((i) => (input.progress[i.id]?.notes ?? '').trim()).length;
  const professionalPending = input.items.filter(
    (i) => i.professionalReviewRequired && !input.progress[i.id]?.completed,
  ).length;
  return {
    total,
    completed,
    remaining: Math.max(0, total - completed),
    withNotes,
    professionalPending,
    percentComplete: total > 0 ? Math.round((100 * completed) / total) : 0,
  };
}

export function getConstructionChecklistMeta() {
  return {
    version: CONSTRUCTION_CHECKLIST_SYSTEM_VERSION,
    qualification: CONSTRUCTION_CHECKLIST_QUALIFICATION,
    professionalReviewNote: CONSTRUCTION_CHECKLIST_PROFESSIONAL_REVIEW_NOTE,
    neverCertifiesCompliance: true,
    checklists: CANONICAL_CONSTRUCTION_CHECKLISTS.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      phase: c.phase,
      category: c.category,
      sortOrder: c.sortOrder,
      itemCount: c.items.length,
      href: `/construction/checklists/${c.slug}`,
    })),
  };
}

/** Admin create/update item shape — extends legacy label support. */
export const constructionChecklistAdminItemSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    title: z.string().min(1).max(200).optional(),
    label: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    category: z.string().max(80).optional().nullable(),
    phase: z.string().max(80).optional().nullable(),
    professionalReviewRequired: z.boolean().optional().default(false),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((v) => Boolean(v.title?.trim() || v.label?.trim()), {
    message: 'Each item needs a title (or legacy label).',
  });
