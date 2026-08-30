/** Varnarc BOQ Generator — categories, generation, totals. */

export const BOQ_CALC_VERSION = '2026.08.1';

export const BOQ_QUALIFICATION =
  'This is an indicative planning BOQ generated for quantity organization. It is not a professional tender BOQ, contractor quote, or substitute for a quantity surveyor / engineer schedule.';

export const BOQ_CATEGORIES = [
  'Preliminaries',
  'Excavation',
  'Foundation',
  'PCC',
  'RCC',
  'Reinforcement',
  'Formwork',
  'Masonry',
  'Plaster',
  'Flooring',
  'Painting',
  'Waterproofing',
  'Electrical',
  'Plumbing',
  'Sanitary',
  'Doors/windows',
  'Carpentry',
  'External works',
  'Other',
] as const;

export type BoqCategory = (typeof BOQ_CATEGORIES)[number];

export const BOQ_CATEGORY_SET = new Set<string>(BOQ_CATEGORIES);

/** Indicative unit rates (INR) for planning — editable in the UI. */
export const BOQ_DEFAULT_RATES_INR: Partial<Record<string, number>> = {
  'Site establishment (LS)': 25000,
  'Excavation in ordinary soil': 450,
  'PCC 1:4:8 under foundations': 4200,
  'RCC M20 structural concrete': 6200,
  'TMT reinforcement steel': 72,
  'Formwork for RCC': 650,
  'Brick masonry in CM 1:6': 850,
  'Internal plaster 12 mm': 280,
  'Flooring (vitrified / ceramic)': 95,
  'Interior painting (2 coats)': 22,
  'Terrace waterproofing': 180,
  'Electrical rough-in (LS)': 45000,
  'Plumbing rough-in (LS)': 38000,
  'Sanitary fittings (provisional)': 55000,
  'Doors & windows (provisional)': 85000,
  'Carpentry / joinery (provisional)': 40000,
  'External works / compound (LS)': 60000,
};
