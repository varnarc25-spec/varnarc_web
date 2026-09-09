/**
 * Semantic comparison groups for construction materials.
 * Only substitutable materials in the same group may be recommended side-by-side.
 */

export const MATERIAL_COMPARISON_GROUPS = [
  'cement',
  'walling',
  'sand',
  'steel',
  'flooring',
  'ceiling',
  'windows',
  'boards',
  'paint',
  'plaster',
] as const;

export type MaterialComparisonGroup = (typeof MATERIAL_COMPARISON_GROUPS)[number];

export type MaterialComparisonInput = {
  name?: string | null;
  slug?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  brandName?: string | null;
};

const CATEGORY_SLUG_TO_GROUP: Record<string, MaterialComparisonGroup> = {
  cement: 'cement',
  cements: 'cement',
  steel: 'steel',
  tmt: 'steel',
  rebar: 'steel',
  brick: 'walling',
  bricks: 'walling',
  block: 'walling',
  blocks: 'walling',
  masonry: 'walling',
  walling: 'walling',
  aac: 'walling',
  sand: 'sand',
  aggregate: 'sand',
  tile: 'flooring',
  tiles: 'flooring',
  flooring: 'flooring',
  floor: 'flooring',
  granite: 'flooring',
  marble: 'flooring',
  paint: 'paint',
  paints: 'paint',
  plywood: 'boards',
  board: 'boards',
  boards: 'boards',
  window: 'windows',
  windows: 'windows',
  ceiling: 'ceiling',
  plaster: 'plaster',
  plastering: 'plaster',
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haystack(input: MaterialComparisonInput): string {
  return normalize(
    [input.name, input.slug, input.categoryName, input.categorySlug, input.brandName]
      .filter(Boolean)
      .join(' '),
  );
}

function fromCategory(input: MaterialComparisonInput): MaterialComparisonGroup | null {
  const slug = normalize(input.categorySlug ?? '');
  const name = normalize(input.categoryName ?? '');
  return CATEGORY_SLUG_TO_GROUP[slug] ?? CATEGORY_SLUG_TO_GROUP[name] ?? null;
}

/**
 * Classify a material into a substitutable comparison group.
 * Returns null when the item is not in a known comparable family.
 */
export function resolveMaterialComparisonGroup(
  input: MaterialComparisonInput,
): MaterialComparisonGroup | null {
  const text = haystack(input);
  if (!text) return null;

  // Specific finishes before generic "cement" / "gypsum".
  if (
    /cement plaster|gypsum plaster|wall plaster|lime plaster/.test(text) &&
    !/false ceiling|gypsum board|gypboard/.test(text)
  ) {
    return 'plaster';
  }
  if (
    /\bpop\b|plaster of paris|gypsum board|gypboard|pvc ceiling|pvc panel|false ceiling|gypsum ceiling/.test(
      text,
    )
  ) {
    return 'ceiling';
  }
  if (/\bgypsum\b/.test(text) && !/plaster/.test(text)) return 'ceiling';

  if (
    /\bupvc\b|u pvc|aluminium window|aluminum window|aluminium sliding|aluminum sliding/.test(text)
  ) {
    return 'windows';
  }

  if (/\bplywood\b|\bmdf\b|\bwpc\b|particle board|blockboard|block board/.test(text)) {
    return 'boards';
  }

  if (
    /asian paints|berger|nerolac|dulux|distemper|emulsion|enamel paint|\bpaint\b|\bpaints\b/.test(
      text,
    ) &&
    !/paint brush|paint roller/.test(text)
  ) {
    return 'paint';
  }

  if (
    /vitrified|ceramic tile|floor tile|granite|kota stone|\bmarble\b|flooring tile|porcelain tile/.test(
      text,
    )
  ) {
    return 'flooring';
  }

  if (
    /\btmt\b|fe ?500d?|fe ?550|tiscon|neosteel|\brebar\b|thermo mechanically|reinforcement (bar|steel)|tmt bar/.test(
      text,
    )
  ) {
    return 'steel';
  }

  if (/m sand|msand|manufactured sand|river sand|pit sand|fine aggregate/.test(text)) {
    return 'sand';
  }

  if (
    /\baac\b|aac block|red brick|clay brick|fly ash brick|flyash brick|solid block|concrete block|hollow block/.test(
      text,
    )
  ) {
    return 'walling';
  }

  if (/\bopc\b|\bppc\b|portland|opc 43|opc 53|\bcement\b/.test(text) && !/plaster/.test(text)) {
    return 'cement';
  }

  return fromCategory(input);
}

export function areMaterialsComparable(
  left: MaterialComparisonInput,
  right: MaterialComparisonInput,
): boolean {
  const a = resolveMaterialComparisonGroup(left);
  const b = resolveMaterialComparisonGroup(right);
  return Boolean(a && b && a === b);
}

export function areComparableMaterialSet(items: MaterialComparisonInput[]): boolean {
  if (items.length < 2) return false;
  const groups = items.map((item) => resolveMaterialComparisonGroup(item));
  const first = groups[0];
  if (!first) return false;
  return groups.every((g) => g === first);
}

export type ComparableCatalogItem = MaterialComparisonInput & { id: string };

/**
 * First like-for-like pair in catalog order. Never pairs across groups.
 */
export function recommendComparableCatalogPair<T extends ComparableCatalogItem>(
  items: T[],
): [T, T] | null {
  for (let i = 0; i < items.length; i += 1) {
    const left = items[i];
    if (!left) continue;
    const group = resolveMaterialComparisonGroup(left);
    if (!group) continue;
    const right = items.slice(i + 1).find((item) => resolveMaterialComparisonGroup(item) === group);
    if (right) return [left, right];
  }
  return null;
}

export function filterComparableCandidates<T extends MaterialComparisonInput>(
  selected: T,
  candidates: T[],
): T[] {
  const group = resolveMaterialComparisonGroup(selected);
  if (!group) return [];
  return candidates.filter((item) => resolveMaterialComparisonGroup(item) === group);
}
