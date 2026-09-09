/**
 * Hub "Next best actions" — four deeper-tool cards, ranked from planning progress.
 * Does not invent completed work; skips funnel CTAs that are already done.
 */

export type ConstructionHubNextActionId =
  'materials' | 'boq' | 'prices' | 'suppliers' | 'compare' | 'professionals' | 'save' | 'manage';

export type ConstructionHubNextAction = {
  id: ConstructionHubNextActionId;
  title: string;
  description: string;
  href: string;
  icon: ConstructionHubNextActionId;
};

export type ConstructionHubNextActionsInput = {
  hasEstimate: boolean;
  hasMaterials: boolean;
  hasBoq: boolean;
  hasSavedProject: boolean;
  isAuthenticated: boolean;
  projectId?: string | null;
};

const COMPARE: ConstructionHubNextAction = {
  id: 'compare',
  title: 'Compare materials',
  description: 'OPC vs PPC, TMT brands and more',
  href: '/construction/compare',
  icon: 'compare',
};

const PRICES: ConstructionHubNextAction = {
  id: 'prices',
  title: 'Check prices near you',
  description: 'Get latest indicative material prices by city',
  href: '/construction/prices',
  icon: 'prices',
};

const PROFESSIONALS: ConstructionHubNextAction = {
  id: 'professionals',
  title: 'Find professionals',
  description: 'Builders, contractors, architects and designers',
  href: '/construction/professionals',
  icon: 'professionals',
};

const SUPPLIERS: ConstructionHubNextAction = {
  id: 'suppliers',
  title: 'Get supplier quotes',
  description: 'Find dealers and compare indicative supply options',
  href: '/construction/suppliers',
  icon: 'suppliers',
};

const MATERIALS: ConstructionHubNextAction = {
  id: 'materials',
  title: 'Calculate material quantities',
  description: 'Turn your cost estimate into cement, steel and more',
  href: '/construction/material-calculator',
  icon: 'materials',
};

const BOQ: ConstructionHubNextAction = {
  id: 'boq',
  title: 'Generate BOQ',
  description: 'Itemise quantities for quotes and tracking',
  href: '/construction/boq',
  icon: 'boq',
};

function withProject(href: string, projectId?: string | null): string {
  if (!projectId) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}projectId=${encodeURIComponent(projectId)}`;
}

function saveOrManage(input: ConstructionHubNextActionsInput): ConstructionHubNextAction {
  if (input.hasSavedProject && input.projectId) {
    return {
      id: 'manage',
      title: 'Manage project',
      description: 'Keep estimates, materials and BOQ',
      href: `/construction/project/${input.projectId}`,
      icon: 'manage',
    };
  }
  if (!input.isAuthenticated) {
    return {
      id: 'save',
      title: 'Save project',
      description: 'Keep estimates, materials and BOQ',
      href: `/auth/login?returnTo=${encodeURIComponent('/construction/project/new')}`,
      icon: 'save',
    };
  }
  return {
    id: 'save',
    title: 'Save project',
    description: 'Keep estimates, materials and BOQ',
    href: '/construction/project/new',
    icon: 'save',
  };
}

/**
 * Returns exactly four actions. Funnel CTAs appear only when the previous step exists
 * and the next artifact does not.
 */
export function resolveConstructionHubNextActions(
  input: ConstructionHubNextActionsInput,
): ConstructionHubNextAction[] {
  const ranked: ConstructionHubNextAction[] = [];
  const seen = new Set<string>();

  const push = (action: ConstructionHubNextAction) => {
    if (seen.has(action.id)) return;
    seen.add(action.id);
    ranked.push(action);
  };

  if (input.hasEstimate && !input.hasMaterials) {
    push({ ...MATERIALS, href: withProject(MATERIALS.href, input.projectId) });
  }
  if (input.hasMaterials && !input.hasBoq) {
    push({ ...BOQ, href: withProject(BOQ.href, input.projectId) });
  }

  if (input.hasBoq) {
    push(PRICES);
    push(SUPPLIERS);
  } else {
    push(COMPARE);
    push(PRICES);
  }

  if (ranked.length < 3) push(PROFESSIONALS);
  push(saveOrManage(input));
  if (ranked.length < 4) push(PROFESSIONALS);
  if (ranked.length < 4) push(COMPARE);

  return ranked.slice(0, 4);
}
