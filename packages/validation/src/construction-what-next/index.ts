/**
 * Centralized "What next?" recommendations for construction calculators.
 * Pure mapping — UI lives in the web app; do not hardcode CTAs per page.
 */

export type ConstructionWhatNextContext = {
  calculatorSlug: string;
  outputs?: unknown;
  unitSummary?: unknown;
  inputs?: Record<string, unknown> | null;
  normalizedInputs?: Record<string, unknown> | null;
  isAuthenticated: boolean;
  hasProjects: boolean;
  /** Max actions to return (default 5). */
  limit?: number;
};

export type ConstructionWhatNextAction = {
  id: string;
  label: string;
  href: string;
  /** Short why this action appears. */
  reason: string;
  /** Lower sorts first. */
  priority: number;
};

type ActionCandidate = ConstructionWhatNextAction & {
  when?: (ctx: ConstructionWhatNextContext) => boolean;
};

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function readVolumeM3(ctx: ConstructionWhatNextContext): number | null {
  const o = ctx.outputs as Record<string, unknown> | null;
  const u = ctx.unitSummary as Record<string, unknown> | null;
  const n = ctx.normalizedInputs;
  return (
    asNumber(u?.volumeM3) ??
    asNumber(o?.volumeM3) ??
    asNumber(o?.wetVolumeM3) ??
    asNumber(o?.concreteVolumeM3) ??
    asNumber(n?.volume) ??
    null
  );
}

function readAreaSqft(ctx: ConstructionWhatNextContext): number | null {
  const o = ctx.outputs as Record<string, unknown> | null;
  const n = ctx.normalizedInputs;
  const i = ctx.inputs;
  return (
    asNumber(o?.areaSqft) ??
    asNumber(o?.builtUpAreaSqft) ??
    asNumber(n?.builtUpArea) ??
    asNumber(n?.area) ??
    asNumber(i?.builtUpAreaSqft) ??
    asNumber(i?.area) ??
    null
  );
}

function projectActions(ctx: ConstructionWhatNextContext): ActionCandidate[] {
  if (ctx.hasProjects) {
    return [
      {
        id: 'open-projects',
        label: 'Open your projects',
        href: '/construction/projects',
        reason: 'Attach this estimate to an existing build.',
        priority: 40,
      },
      {
        id: 'generate-boq',
        label: 'Add to BOQ',
        href: `/construction/boq-generator${qs({ from: ctx.calculatorSlug })}`,
        reason: 'Turn quantities into a bill of quantities.',
        priority: 35,
      },
    ];
  }
  return [
    {
      id: 'create-project',
      label: 'Create project',
      href: '/construction/project/new',
      reason: ctx.isAuthenticated
        ? 'Save this work into a new project workspace.'
        : 'Sign in during setup to keep estimates together.',
      priority: 38,
    },
    {
      id: 'generate-boq',
      label: 'Add to BOQ',
      href: `/construction/boq-generator${qs({ from: ctx.calculatorSlug })}`,
      reason: 'Draft a BOQ from your quantities.',
      priority: 36,
    },
  ];
}

function baseSaveAction(ctx: ConstructionWhatNextContext): ActionCandidate {
  return {
    id: 'saved-calculations',
    label: 'View saved calculations',
    href: '/construction/saved-calculations',
    reason: 'Revisit and recalculate earlier runs.',
    priority: 90,
    when: (c) => c.isAuthenticated,
  };
}

/** Per-calculator recommendation factories. */
const MAP: Record<string, (ctx: ConstructionWhatNextContext) => ActionCandidate[]> = {
  'concrete-calculator': (ctx) => {
    const vol = readVolumeM3(ctx);
    const volQ =
      vol != null
        ? { volume: Number(vol.toFixed(3)), useCase: 'concrete' }
        : { useCase: 'concrete' };
    return [
      {
        id: 'calc-cement',
        label: 'Calculate cement',
        href: `/construction/cement-calculator${qs(volQ)}`,
        reason: 'Convert concrete volume into cement bags.',
        priority: 10,
      },
      {
        id: 'calc-sand',
        label: 'Calculate sand',
        href: `/construction/sand-calculator${qs(vol != null ? { volume: Number(vol.toFixed(3)) } : {})}`,
        reason: 'Estimate sand for the same mix volume.',
        priority: 12,
      },
      {
        id: 'calc-aggregate',
        label: 'Calculate aggregate',
        href: `/construction/aggregate-calculator${qs(vol != null ? { volume: Number(vol.toFixed(3)) } : {})}`,
        reason: 'Estimate coarse aggregate for this pour.',
        priority: 14,
      },
      {
        id: 'estimate-concrete-cost',
        label: 'Estimate concrete cost',
        href: `/construction/cost-calculator${qs({ propertyType: 'independent_house' })}`,
        reason: 'Roll material quantities into a build cost view.',
        priority: 20,
      },
      ...projectActions(ctx),
    ];
  },

  'cement-calculator': (ctx) => [
    {
      id: 'calc-sand',
      label: 'Calculate sand',
      href: '/construction/sand-calculator',
      reason: 'Balance cement with sand for mortar or concrete.',
      priority: 10,
    },
    {
      id: 'calc-aggregate',
      label: 'Calculate aggregate',
      href: '/construction/aggregate-calculator',
      reason: 'Complete the concrete mix with aggregate.',
      priority: 12,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete volume',
      href: '/construction/concrete-calculator',
      reason: 'Start from volume if you are sizing a pour.',
      priority: 16,
    },
    {
      id: 'estimate-cost',
      label: 'Estimate construction cost',
      href: '/construction/cost-calculator',
      reason: 'See how cement fits into overall build cost.',
      priority: 22,
    },
    ...projectActions(ctx),
  ],

  'sand-calculator': (ctx) => [
    {
      id: 'calc-cement',
      label: 'Calculate cement',
      href: '/construction/cement-calculator',
      reason: 'Pair sand with cement for mortar or concrete.',
      priority: 10,
    },
    {
      id: 'calc-aggregate',
      label: 'Calculate aggregate',
      href: '/construction/aggregate-calculator',
      reason: 'Finish the concrete mix quantities.',
      priority: 12,
    },
    {
      id: 'calc-plaster',
      label: 'Calculate plaster',
      href: '/construction/plaster-calculator',
      reason: 'If sand is for plastering, size coats next.',
      priority: 18,
    },
    ...projectActions(ctx),
  ],

  'aggregate-calculator': (ctx) => [
    {
      id: 'calc-cement',
      label: 'Calculate cement',
      href: '/construction/cement-calculator?useCase=concrete',
      reason: 'Cement for the same concrete mix.',
      priority: 10,
    },
    {
      id: 'calc-sand',
      label: 'Calculate sand',
      href: '/construction/sand-calculator',
      reason: 'Fine aggregate companion quantity.',
      priority: 12,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete volume',
      href: '/construction/concrete-calculator',
      reason: 'Confirm wet volume before ordering.',
      priority: 16,
    },
    ...projectActions(ctx),
  ],

  'steel-calculator': (ctx) => [
    {
      id: 'calc-bbs',
      label: 'Bar bending schedule',
      href: '/construction/bbs-calculator',
      reason: 'Break steel into cutting and bending lengths.',
      priority: 10,
    },
    {
      id: 'calc-rcc',
      label: 'RCC calculator',
      href: '/construction/rcc-calculator',
      reason: 'Relate steel to concrete members.',
      priority: 14,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete',
      href: '/construction/concrete-calculator',
      reason: 'Match steel with concrete volume.',
      priority: 18,
    },
    ...projectActions(ctx),
  ],

  'tile-calculator': (ctx) => [
    {
      id: 'compare-flooring',
      label: 'Compare flooring',
      href: '/construction/compare/vitrified-vs-ceramic-tiles',
      reason: 'Weigh tile types before you buy.',
      priority: 10,
    },
    {
      id: 'calc-flooring',
      label: 'Flooring calculator',
      href: '/construction/flooring-calculator',
      reason: 'Broader flooring quantity and cost view.',
      priority: 14,
    },
    {
      id: 'calc-paint',
      label: 'Calculate paint',
      href: '/construction/paint-calculator',
      reason: 'Finish rooms after flooring is set.',
      priority: 22,
    },
    ...projectActions(ctx),
  ],

  'flooring-calculator': (ctx) => [
    {
      id: 'calc-tile',
      label: 'Tile calculator',
      href: '/construction/tile-calculator',
      reason: 'Detail tile pieces and wastage.',
      priority: 10,
    },
    {
      id: 'compare-flooring',
      label: 'Compare flooring options',
      href: '/construction/compare',
      reason: 'Browse flooring comparisons.',
      priority: 12,
    },
    ...projectActions(ctx),
  ],

  'cost-calculator': (ctx) => {
    const area = readAreaSqft(ctx);
    return [
      {
        id: 'calc-materials',
        label: 'Calculate materials',
        href: `/construction/cement-calculator${qs(area != null ? { area: Math.round(area), areaUnit: 'sqft' } : {})}`,
        reason: 'Drill into cement and related quantities.',
        priority: 10,
      },
      {
        id: 'generate-boq',
        label: 'Generate BOQ',
        href: `/construction/boq-generator${qs({ from: 'cost-calculator' })}`,
        reason: 'Itemise the estimate into a BOQ.',
        priority: 12,
      },
      ctx.hasProjects
        ? {
            id: 'open-projects',
            label: 'Add to project',
            href: '/construction/projects',
            reason: 'Attach this cost run to a project.',
            priority: 14,
          }
        : {
            id: 'create-project',
            label: 'Create project',
            href: '/construction/project/new',
            reason: 'Keep cost scenarios under one project.',
            priority: 14,
          },
      {
        id: 'compare-scenario',
        label: 'Compare scenario',
        href: '/construction/scenario-compare',
        reason: 'Test quality or size changes side by side.',
        priority: 16,
      },
      {
        id: 'cost-optimize',
        label: 'Optimize cost',
        href: '/construction/cost-optimization',
        reason: 'Find levers to bring the total down.',
        priority: 20,
      },
      {
        id: 'affordability',
        label: 'Check affordability',
        href: '/construction/affordability-calculator',
        reason: 'See if the estimate fits your budget.',
        priority: 24,
      },
    ];
  },

  'renovation-cost-calculator': (ctx) => [
    {
      id: 'compare-scenario',
      label: 'Compare scenario',
      href: '/construction/scenario-compare',
      reason: 'Contrast renovation options.',
      priority: 12,
    },
    {
      id: 'calc-paint',
      label: 'Calculate paint',
      href: '/construction/paint-calculator',
      reason: 'Common renovation finish quantity.',
      priority: 16,
    },
    {
      id: 'calc-tile',
      label: 'Calculate tiles',
      href: '/construction/tile-calculator',
      reason: 'Size flooring or wall tiles.',
      priority: 18,
    },
    ...projectActions(ctx),
  ],

  'paint-calculator': (ctx) => [
    {
      id: 'calc-plaster',
      label: 'Calculate plaster',
      href: '/construction/plaster-calculator',
      reason: 'Surface prep before painting.',
      priority: 14,
    },
    {
      id: 'calc-tile',
      label: 'Calculate tiles',
      href: '/construction/tile-calculator',
      reason: 'Coordinate finishes in the same rooms.',
      priority: 18,
    },
    ...projectActions(ctx),
  ],

  'brick-calculator': (ctx) => [
    {
      id: 'calc-aac',
      label: 'Compare AAC blocks',
      href: '/construction/aac-block-calculator',
      reason: 'See if AAC changes quantity and cost.',
      priority: 12,
    },
    {
      id: 'calc-cement',
      label: 'Calculate mortar cement',
      href: '/construction/cement-calculator?useCase=masonry',
      reason: 'Cement for masonry mortar.',
      priority: 14,
    },
    {
      id: 'calc-plaster',
      label: 'Calculate plaster',
      href: '/construction/plaster-calculator',
      reason: 'Finish walls after masonry.',
      priority: 18,
    },
    ...projectActions(ctx),
  ],

  'aac-block-calculator': (ctx) => [
    {
      id: 'calc-brick',
      label: 'Compare brick quantity',
      href: '/construction/brick-calculator',
      reason: 'Side-by-side masonry option.',
      priority: 12,
    },
    {
      id: 'calc-cement',
      label: 'Calculate cement',
      href: '/construction/cement-calculator?useCase=masonry',
      reason: 'Mortar cement for AAC walls.',
      priority: 14,
    },
    ...projectActions(ctx),
  ],

  'plaster-calculator': (ctx) => [
    {
      id: 'calc-cement',
      label: 'Calculate cement',
      href: '/construction/cement-calculator?useCase=plaster',
      reason: 'Cement bags for plaster coats.',
      priority: 10,
    },
    {
      id: 'calc-sand',
      label: 'Calculate sand',
      href: '/construction/sand-calculator',
      reason: 'Sand for plaster mix.',
      priority: 12,
    },
    {
      id: 'calc-paint',
      label: 'Calculate paint',
      href: '/construction/paint-calculator',
      reason: 'Paint after plaster cures.',
      priority: 16,
    },
    ...projectActions(ctx),
  ],

  'rcc-calculator': (ctx) => [
    {
      id: 'calc-steel',
      label: 'Calculate steel',
      href: '/construction/steel-calculator',
      reason: 'Reinforcement weight for RCC.',
      priority: 10,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete',
      href: '/construction/concrete-calculator',
      reason: 'Concrete volume for members.',
      priority: 12,
    },
    {
      id: 'calc-bbs',
      label: 'Bar bending schedule',
      href: '/construction/bbs-calculator',
      reason: 'Cutting lengths from reinforcement.',
      priority: 14,
    },
    ...projectActions(ctx),
  ],

  'bbs-calculator': (ctx) => [
    {
      id: 'calc-steel',
      label: 'Calculate steel weight',
      href: '/construction/steel-calculator',
      reason: 'Total steel tonnage from bars.',
      priority: 10,
    },
    {
      id: 'calc-rcc',
      label: 'RCC calculator',
      href: '/construction/rcc-calculator',
      reason: 'Member-level RCC quantities.',
      priority: 14,
    },
    ...projectActions(ctx),
  ],

  'slab-calculator': (ctx) => [
    {
      id: 'calc-steel',
      label: 'Calculate steel',
      href: '/construction/steel-calculator',
      reason: 'Slab reinforcement weight.',
      priority: 10,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete',
      href: '/construction/concrete-calculator',
      reason: 'Slab concrete volume.',
      priority: 12,
    },
    ...projectActions(ctx),
  ],

  'beam-calculator': (ctx) => [
    {
      id: 'calc-steel',
      label: 'Calculate steel',
      href: '/construction/steel-calculator',
      reason: 'Beam reinforcement.',
      priority: 10,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete',
      href: '/construction/concrete-calculator',
      reason: 'Beam concrete volume.',
      priority: 12,
    },
    ...projectActions(ctx),
  ],

  'column-calculator': (ctx) => [
    {
      id: 'calc-steel',
      label: 'Calculate steel',
      href: '/construction/steel-calculator',
      reason: 'Column reinforcement.',
      priority: 10,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete',
      href: '/construction/concrete-calculator',
      reason: 'Column concrete volume.',
      priority: 12,
    },
    ...projectActions(ctx),
  ],

  'footing-calculator': (ctx) => [
    {
      id: 'calc-steel',
      label: 'Calculate steel',
      href: '/construction/steel-calculator',
      reason: 'Footing reinforcement.',
      priority: 10,
    },
    {
      id: 'calc-concrete',
      label: 'Calculate concrete',
      href: '/construction/concrete-calculator',
      reason: 'Footing concrete volume.',
      priority: 12,
    },
    ...projectActions(ctx),
  ],

  'boq-generator': (ctx) => [
    ctx.hasProjects
      ? {
          id: 'open-projects',
          label: 'Open project',
          href: '/construction/projects',
          reason: 'Review BOQs on your project dashboard.',
          priority: 10,
        }
      : {
          id: 'create-project',
          label: 'Create project',
          href: '/construction/project/new',
          reason: 'Store this BOQ under a project.',
          priority: 10,
        },
    {
      id: 'estimate-cost',
      label: 'Estimate construction cost',
      href: '/construction/cost-calculator',
      reason: 'Cross-check BOQ totals with a cost model.',
      priority: 16,
    },
    {
      id: 'budget-tracker',
      label: 'Budget tracker',
      href: '/construction/budget-tracker',
      reason: 'Track spend against the BOQ.',
      priority: 20,
      when: (c) => c.hasProjects,
    },
  ],

  'scenario-compare': (ctx) => [
    {
      id: 'cost-optimize',
      label: 'Optimize cost',
      href: '/construction/cost-optimization',
      reason: 'Act on the cheaper scenario.',
      priority: 12,
    },
    {
      id: 'generate-boq',
      label: 'Generate BOQ',
      href: '/construction/boq-generator',
      reason: 'Detail the preferred scenario.',
      priority: 16,
    },
    ...projectActions(ctx),
  ],

  'affordability-calculator': (ctx) => [
    {
      id: 'estimate-cost',
      label: 'Refine construction cost',
      href: '/construction/cost-calculator',
      reason: 'Tighten the build estimate behind affordability.',
      priority: 10,
    },
    {
      id: 'compare-scenario',
      label: 'Compare scenario',
      href: '/construction/scenario-compare',
      reason: 'Test a lower-cost build option.',
      priority: 14,
    },
    ...projectActions(ctx),
  ],

  'cost-optimization': (ctx) => [
    {
      id: 'compare-scenario',
      label: 'Compare scenario',
      href: '/construction/scenario-compare',
      reason: 'Validate savings side by side.',
      priority: 10,
    },
    {
      id: 'estimate-cost',
      label: 'Full cost calculator',
      href: '/construction/cost-calculator',
      reason: 'Re-run with optimized assumptions.',
      priority: 14,
    },
    ...projectActions(ctx),
  ],
};

const DEFAULT_ACTIONS = (ctx: ConstructionWhatNextContext): ActionCandidate[] => [
  {
    id: 'estimate-cost',
    label: 'Estimate construction cost',
    href: '/construction/cost-calculator',
    reason: 'See how this fits an overall build budget.',
    priority: 20,
  },
  ...projectActions(ctx),
  {
    id: 'browse-calculators',
    label: 'Browse calculators',
    href: '/construction',
    reason: 'Explore other construction tools.',
    priority: 80,
  },
];

/**
 * Returns ranked next-step actions for a calculator result.
 */
export function getConstructionWhatNext(
  ctx: ConstructionWhatNextContext,
): ConstructionWhatNextAction[] {
  const limit = Math.min(Math.max(ctx.limit ?? 5, 1), 8);
  const factory = MAP[ctx.calculatorSlug] ?? DEFAULT_ACTIONS;
  const candidates = [...factory(ctx), baseSaveAction(ctx)];

  const seen = new Set<string>();
  const ranked: ConstructionWhatNextAction[] = [];

  for (const action of candidates.sort((a, b) => a.priority - b.priority)) {
    if (action.when && !action.when(ctx)) continue;
    if (seen.has(action.id)) continue;
    seen.add(action.id);
    ranked.push({
      id: action.id,
      label: action.label,
      href: action.href,
      reason: action.reason,
      priority: action.priority,
    });
    if (ranked.length >= limit) break;
  }

  return ranked;
}

export function listWhatNextCalculatorSlugs(): string[] {
  return Object.keys(MAP);
}
