/**
 * Educational Material Selector — task-based guidance only.
 * Not structural design, not brand advice, not professional approval.
 */

export const MATERIAL_SELECTOR_VERSION = '2026.08.1';

export const MATERIAL_SELECTOR_QUALIFICATION =
  'Educational guidance only. Suggestions are material categories and specification themes to discuss with your engineer, architect or contractor. This tool does not approve designs, size members, certify products or recommend brands.';

export const MATERIAL_SELECTOR_TASKS = [
  {
    id: 'foundation',
    label: 'Foundation',
    summary: 'Footings, piles and substructure concrete context.',
  },
  {
    id: 'rcc',
    label: 'RCC',
    summary: 'Reinforced concrete members — slabs, beams, columns.',
  },
  {
    id: 'masonry',
    label: 'Masonry',
    summary: 'Brick, block and walling systems.',
  },
  {
    id: 'plaster',
    label: 'Plaster',
    summary: 'Interior and exterior wall finishes.',
  },
  {
    id: 'flooring',
    label: 'Flooring',
    summary: 'Floor finish systems by use and moisture.',
  },
  {
    id: 'painting',
    label: 'Painting',
    summary: 'Interior and exterior coating systems.',
  },
  {
    id: 'windows',
    label: 'Windows',
    summary: 'Frame and glazing system themes.',
  },
  {
    id: 'roofing',
    label: 'Roofing',
    summary: 'Roof coverings and waterproofing context.',
  },
] as const;

export type MaterialSelectorTaskId = (typeof MATERIAL_SELECTOR_TASKS)[number]['id'];

export type SelectorOption = {
  id: string;
  label: string;
  hint?: string;
};

export type SelectorQuestion = {
  id: string;
  prompt: string;
  help?: string;
  options: SelectorOption[];
};

export type SelectorSuggestion = {
  id: string;
  category: string;
  whyFits: string;
  advantages: string[];
  limitations: string[];
  specsToVerify: string[];
  relatedComparison?: { href: string; label: string };
  relatedCalculator?: { href: string; label: string };
  materialGuideHref?: string;
};

export type MaterialSelectorTask = {
  id: MaterialSelectorTaskId;
  label: string;
  summary: string;
  questions: SelectorQuestion[];
  /** Pure function: answers map questionId → optionId */
  recommend: (answers: Record<string, string>) => SelectorSuggestion[];
};

const cementQuestions: SelectorQuestion[] = [
  {
    id: 'application',
    prompt: 'Primary application',
    help: 'Where will the cement primarily be used?',
    options: [
      { id: 'structural_concrete', label: 'Structural concrete (RCC / PCC)' },
      { id: 'masonry_mortar', label: 'Masonry mortar' },
      { id: 'plaster', label: 'Plaster / render' },
      { id: 'screed', label: 'Floor screed / bedding' },
    ],
  },
  {
    id: 'environment',
    prompt: 'Environment',
    options: [
      { id: 'normal', label: 'Normal inland exposure' },
      { id: 'coastal', label: 'Coastal / saline influence' },
      { id: 'aggressive', label: 'Aggressive soils / chemicals (as noted by designer)' },
    ],
  },
  {
    id: 'exposure',
    prompt: 'Moisture / exposure',
    options: [
      { id: 'dry', label: 'Mostly dry / sheltered' },
      { id: 'wet', label: 'Frequently wet or exterior' },
      { id: 'submerged', label: 'Water-retaining / submerged (designer-led)' },
    ],
  },
  {
    id: 'characteristics',
    prompt: 'Desired characteristics',
    options: [
      { id: 'early_strength', label: 'Faster early strength (if specified)' },
      { id: 'general', label: 'General construction performance' },
      { id: 'finish', label: 'Smooth finish / plaster workability' },
    ],
  },
];

function cementSuggestions(answers: Record<string, string>): SelectorSuggestion[] {
  const app = answers.application;
  const char = answers.characteristics;
  const env = answers.environment;
  const out: SelectorSuggestion[] = [];

  if (app === 'structural_concrete' || !app) {
    out.push({
      id: 'cement-structural',
      category: 'Cement for structural concrete (grade as specified)',
      whyFits:
        'Structural concrete needs cement type and grade matching the mix design or structural notes — not a generic bag preference.',
      advantages: [
        'Clear grade marking supports batch consistency',
        'Works within designed mixes when curing is controlled',
      ],
      limitations: [
        'Bag type alone does not guarantee strength without correct mix, water and curing',
        'Coastal or aggressive exposure may require special cements or cover — designer decides',
      ],
      specsToVerify: [
        'Exact cement type and grade on drawings / mix design',
        'Bag size and freshness',
        'Whether site mix or RMC governs supply',
      ],
      relatedComparison: {
        href: '/construction/compare/opc-vs-ppc',
        label: 'OPC vs PPC comparison',
      },
      relatedCalculator: {
        href: '/construction/cement-calculator',
        label: 'Cement calculator',
      },
      materialGuideHref: '/construction/materials/cement',
    });
  }

  if (char === 'early_strength') {
    out.push({
      id: 'cement-early',
      category: 'OPC (where early strength is specified)',
      whyFits:
        'When the specification calls for early strength characteristics, OPC grades are commonly referenced — only if the engineer permits.',
      advantages: ['Often associated with faster early strength for a given grade'],
      limitations: [
        'Not automatically “better” for all works',
        'Must not replace a PPC/blended call-out without approval',
      ],
      specsToVerify: ['Grade (e.g. 43/53) on bag and invoice', 'Specification allowance'],
      relatedComparison: {
        href: '/construction/compare/opc-vs-ppc',
        label: 'OPC vs PPC comparison',
      },
      relatedCalculator: {
        href: '/construction/cement-calculator',
        label: 'Cement calculator',
      },
      materialGuideHref: '/construction/materials/cement',
    });
  }

  if (char === 'general' || char === 'finish' || app === 'masonry_mortar' || app === 'plaster') {
    out.push({
      id: 'cement-general',
      category: 'PPC / blended cement (when specification allows)',
      whyFits:
        'For many general masonry, plaster and permitted concrete works, blended cements are widely used when allowed by the project notes.',
      advantages: ['Common for general building works', 'Often suited to masonry and plaster'],
      limitations: [
        'Must match structural/mix specification',
        'Not a free substitute for every OPC requirement',
      ],
      specsToVerify: [
        'Specification allowance for PPC/blended',
        'Consistent brand/type across a pour',
      ],
      relatedComparison: {
        href: '/construction/compare/opc-vs-ppc',
        label: 'OPC vs PPC comparison',
      },
      relatedCalculator: {
        href: '/construction/cement-calculator',
        label: 'Cement calculator',
      },
      materialGuideHref: '/construction/materials/cement',
    });
  }

  if (env === 'coastal' || env === 'aggressive' || answers.exposure === 'submerged') {
    out.push({
      id: 'cement-exposure',
      category: 'Exposure-driven cement / mix (designer-specified)',
      whyFits:
        'Aggressive or marine exposure often needs cover, cement type or admixtures defined by the design — not a DIY bag swap.',
      advantages: ['Aligns durability strategy with exposure class'],
      limitations: [
        'This selector cannot choose specialty cement without design input',
        'Unsupported brand picks are avoided on purpose',
      ],
      specsToVerify: [
        'Exposure class on drawings',
        'Any sulphate-resistant / special cement notes',
        'Cover to reinforcement',
      ],
      relatedCalculator: {
        href: '/construction/concrete-calculator',
        label: 'Concrete volume calculator',
      },
      materialGuideHref: '/construction/materials/cement',
    });
  }

  if (app === 'screed') {
    out.push({
      id: 'cement-screed',
      category: 'Cement–sand screed materials',
      whyFits: 'Floor screeds typically use cement with suitable sand and controlled thickness.',
      advantages: ['Familiar site practice for bedding floors'],
      limitations: ['Thickness and curing affect finish floors above'],
      specsToVerify: ['Screed mix ratio', 'Thickness', 'Sand grading'],
      relatedCalculator: {
        href: '/construction/cement-calculator',
        label: 'Cement calculator',
      },
      materialGuideHref: '/construction/materials/sand',
    });
  }

  return dedupeSuggestions(out);
}

function dedupeSuggestions(items: SelectorSuggestion[]): SelectorSuggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export const MATERIAL_SELECTOR_DEFINITIONS: MaterialSelectorTask[] = [
  {
    id: 'foundation',
    label: 'Foundation',
    summary: 'Footings, piles and substructure concrete context.',
    questions: [
      {
        id: 'foundation_type',
        prompt: 'Foundation context',
        options: [
          { id: 'isolated', label: 'Isolated / combined footings' },
          { id: 'raft', label: 'Raft / mat' },
          { id: 'pile', label: 'Pile / pile cap (as designed)' },
          { id: 'pcc_bed', label: 'PCC bed / lean concrete only' },
        ],
      },
      {
        id: 'soil_note',
        prompt: 'Ground conditions (as known)',
        options: [
          { id: 'normal', label: 'Typical firm ground (assumed)' },
          { id: 'weak', label: 'Soft / filled ground (engineer involved)' },
          { id: 'aggressive', label: 'Aggressive soil / groundwater noted' },
        ],
      },
      {
        id: 'materials_focus',
        prompt: 'What do you want guidance on?',
        options: [
          { id: 'concrete', label: 'Concrete materials' },
          { id: 'steel', label: 'Reinforcement steel' },
          { id: 'both', label: 'Concrete + steel themes' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      if (a.materials_focus !== 'steel') {
        out.push({
          id: 'found-concrete',
          category: 'Foundation concrete (grade & cover as designed)',
          whyFits:
            'Foundation concrete grade, cover and placement method come from structural design — planning tools only estimate volume and materials.',
          advantages: ['Volume planning helps procurement timing'],
          limitations: [
            'Calculator outputs are not footing sizes',
            'Soil bearing and reinforcement are engineer decisions',
          ],
          specsToVerify: [
            'Concrete grade on drawings',
            'Cover and max aggregate size',
            'Whether lean PCC bed is specified',
          ],
          relatedCalculator: {
            href: '/construction/footing-calculator',
            label: 'Footing volume calculator',
          },
          materialGuideHref: '/construction/materials/concrete',
        });
        out.push({
          id: 'found-cement',
          category: 'Cement matching the foundation mix',
          whyFits: 'Cement type/grade must follow the mix or structural note for foundations.',
          advantages: ['Consistent batches across pours'],
          limitations: ['Do not substitute types to chase price'],
          specsToVerify: ['Cement type/grade', 'Freshness'],
          relatedComparison: {
            href: '/construction/compare/opc-vs-ppc',
            label: 'OPC vs PPC',
          },
          relatedCalculator: {
            href: '/construction/cement-calculator',
            label: 'Cement calculator',
          },
          materialGuideHref: '/construction/materials/cement',
        });
      }
      if (a.materials_focus === 'steel' || a.materials_focus === 'both') {
        out.push({
          id: 'found-steel',
          category: 'TMT reinforcement (diameters from BBS / drawings)',
          whyFits: 'Foundation steel is schedule-driven — weight tools do not invent bar sizes.',
          advantages: ['Weight planning from known diameters/lengths'],
          limitations: ['Not a substitute for structural detailing'],
          specsToVerify: ['Bar grade (e.g. Fe500)', 'Diameters and laps from drawings'],
          relatedCalculator: {
            href: '/construction/steel-calculator',
            label: 'Steel weight calculator',
          },
          materialGuideHref: '/construction/materials/steel',
        });
      }
      if (a.soil_note === 'aggressive') {
        out.push({
          id: 'found-exposure',
          category: 'Durability package (cover, cement, admixtures as designed)',
          whyFits:
            'Aggressive ground often changes cover and materials — only the design specifies this.',
          advantages: ['Keeps durability decisions with the engineer'],
          limitations: ['No DIY specialty cement recommendation here'],
          specsToVerify: ['Exposure notes', 'Cover', 'Any special cement call-outs'],
          relatedCalculator: {
            href: '/construction/concrete-calculator',
            label: 'Concrete calculator',
          },
        });
      }
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'rcc',
    label: 'RCC',
    summary: 'Reinforced concrete members — slabs, beams, columns.',
    questions: [
      {
        id: 'member',
        prompt: 'Member focus',
        options: [
          { id: 'slab', label: 'Slab' },
          { id: 'beam', label: 'Beam' },
          { id: 'column', label: 'Column' },
          { id: 'general', label: 'General RCC planning' },
        ],
      },
      {
        id: 'need',
        prompt: 'What do you need to plan?',
        options: [
          { id: 'concrete_vol', label: 'Concrete volume / materials' },
          { id: 'steel_wt', label: 'Steel weight from known bars' },
          { id: 'both', label: 'Both themes' },
        ],
      },
      {
        id: 'mix_note',
        prompt: 'Mix information available?',
        options: [
          { id: 'grade_known', label: 'Grade / mix noted on drawings' },
          { id: 'unknown', label: 'Not sure yet — need educational defaults only' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      const calcByMember: Record<string, { href: string; label: string }> = {
        slab: { href: '/construction/slab-calculator', label: 'Slab calculator' },
        beam: { href: '/construction/beam-calculator', label: 'Beam calculator' },
        column: { href: '/construction/column-calculator', label: 'Column calculator' },
        general: { href: '/construction/rcc-calculator', label: 'RCC calculator' },
      };
      const memberCalc = calcByMember[a.member ?? 'general'] ?? calcByMember.general;

      if (a.need !== 'steel_wt') {
        out.push({
          id: 'rcc-concrete',
          category: 'RCC concrete materials (cement, sand, aggregate)',
          whyFits:
            'Quantity tools estimate volume and indicative materials; member sizes and grades remain design outputs.',
          advantages: ['Helps order planning for known dimensions'],
          limitations: [
            'Not structural design',
            'Preliminary steel ratios (if shown) are not BBS substitutes',
          ],
          specsToVerify: [
            a.mix_note === 'grade_known'
              ? 'Confirm grade matches drawings'
              : 'Obtain grade from engineer before ordering',
            'Max aggregate size vs cover',
            'Slump / placement method',
          ],
          relatedCalculator: memberCalc,
          materialGuideHref: '/construction/materials/concrete',
        });
      }
      if (a.need === 'steel_wt' || a.need === 'both') {
        out.push({
          id: 'rcc-steel',
          category: 'TMT bars from schedule / drawings',
          whyFits: 'Steel weight follows diameter and length — enter known bar data only.',
          advantages: ['Transparent d²/162 weight math'],
          limitations: ['Does not invent reinforcement from architectural sizes'],
          specsToVerify: ['Diameters, spacing, laps from structural drawings', 'Bar grade'],
          relatedCalculator: {
            href: '/construction/steel-calculator',
            label: 'Steel calculator',
          },
          materialGuideHref: '/construction/materials/steel',
        });
        out.push({
          id: 'rcc-bbs',
          category: 'Bar bending schedule organisation',
          whyFits: 'When you already have marks and cutting lengths, a BBS tool organises totals.',
          advantages: ['Diameter and member totals from user entries'],
          limitations: ['Not automatic design from spans/loads'],
          specsToVerify: ['Cutting lengths and shape codes from detailer/engineer'],
          relatedCalculator: {
            href: '/construction/bar-bending-schedule',
            label: 'BBS organiser',
          },
        });
      }
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'masonry',
    label: 'Masonry',
    summary: 'Brick, block and walling systems.',
    questions: [
      {
        id: 'wall_role',
        prompt: 'Wall role',
        options: [
          { id: 'infill', label: 'RCC frame infill / partition' },
          { id: 'loadbearing', label: 'Load-bearing masonry (as designed)' },
          { id: 'boundary', label: 'Boundary / compound wall' },
        ],
      },
      {
        id: 'priority',
        prompt: 'Priority',
        options: [
          { id: 'weight', label: 'Lower wall weight' },
          { id: 'familiar', label: 'Familiar local masonry labour' },
          { id: 'speed', label: 'Faster laying with trained crew' },
          { id: 'cost', label: 'Compare full wall-system cost' },
        ],
      },
      {
        id: 'finish',
        prompt: 'Finish expectation',
        options: [
          { id: 'plastered', label: 'Cement plastered' },
          { id: 'thin_finish', label: 'Thin-bed / system finish' },
          { id: 'unsure', label: 'Not decided' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      const leanAac =
        a.priority === 'weight' || a.priority === 'speed' || a.finish === 'thin_finish';
      const leanBrick = a.priority === 'familiar' || a.wall_role === 'loadbearing';

      if (leanAac || a.priority === 'cost') {
        out.push({
          id: 'mas-aac',
          category: 'AAC blocks (where structurally allowed)',
          whyFits:
            'AAC suits many RCC infills when approved — larger units and lower density, with thin-bed practice.',
          advantages: ['Lower density vs clay brick', 'Potential speed with trained crews'],
          limitations: [
            'Needs compatible adhesive and fixings',
            'Not a free substitute on load-bearing designs without approval',
          ],
          specsToVerify: [
            'Structural allowance for AAC',
            'Block size and density grade',
            'Adhesive system',
          ],
          relatedComparison: {
            href: '/construction/compare/aac-vs-brick',
            label: 'AAC vs brick comparison',
          },
          relatedCalculator: {
            href: '/construction/aac-block-calculator',
            label: 'AAC calculator',
          },
          materialGuideHref: '/construction/materials/aac-blocks',
        });
      }
      if (leanBrick || a.priority === 'cost' || !leanAac) {
        out.push({
          id: 'mas-brick',
          category: 'Clay / red brick masonry',
          whyFits:
            'Clay brick remains common where kiln supply and mason skills are strong, and where design expects brick.',
          advantages: ['Wide labour familiarity', 'Local availability in many regions'],
          limitations: ['Higher wall weight', 'Quality varies by kiln'],
          specsToVerify: ['Brick class and size', 'Mortar mix', 'Bond and joint thickness'],
          relatedComparison: {
            href: '/construction/compare/aac-vs-brick',
            label: 'AAC vs brick comparison',
          },
          relatedCalculator: {
            href: '/construction/brick-calculator',
            label: 'Brick calculator',
          },
          materialGuideHref: '/construction/materials/brick',
        });
      }
      out.push({
        id: 'mas-mortar',
        category: 'Cement–sand mortar materials',
        whyFits:
          'Masonry joints need cement and suitable sand — quantities follow wall area and joint practice.',
        advantages: ['Standard site materials'],
        limitations: ['Mortar strength depends on mix and curing'],
        specsToVerify: ['Mix ratio', 'Sand silt content'],
        relatedComparison: {
          href: '/construction/compare/m-sand-vs-river-sand',
          label: 'M-sand vs river sand',
        },
        relatedCalculator: {
          href: '/construction/cement-calculator',
          label: 'Cement calculator',
        },
        materialGuideHref: '/construction/materials/cement',
      });
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'plaster',
    label: 'Plaster',
    summary: 'Interior and exterior wall finishes.',
    questions: [
      {
        id: 'location',
        prompt: 'Location',
        options: [
          { id: 'interior', label: 'Interior dry areas' },
          { id: 'exterior', label: 'Exterior walls' },
          { id: 'wet_adjacent', label: 'Wet-adjacent interiors (bath vicinity)' },
        ],
      },
      {
        id: 'goal',
        prompt: 'Finish goal',
        options: [
          { id: 'fast_smooth', label: 'Faster smooth interior finish' },
          { id: 'durable_exterior', label: 'Weather-facing durable render' },
          { id: 'standard', label: 'Standard cement plaster' },
        ],
      },
      {
        id: 'substrate',
        prompt: 'Substrate',
        options: [
          { id: 'brick', label: 'Brick / block masonry' },
          { id: 'aac', label: 'AAC (system finish preferred)' },
          { id: 'concrete', label: 'Concrete surface' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      if (a.location === 'interior' && a.goal === 'fast_smooth') {
        out.push({
          id: 'pls-gypsum',
          category: 'Gypsum plaster systems (dry interiors)',
          whyFits:
            'Gypsum systems are often considered for dry interior finishes when substrate and thickness follow the manufacturer data sheet.',
          advantages: ['Potential speed and smoothness', 'Less water curing than cement plaster'],
          limitations: [
            'Not for standard exterior use',
            'Moisture exposure can damage gypsum finishes',
          ],
          specsToVerify: ['Approved substrates', 'Max thickness', 'Wet-area exclusions'],
          relatedComparison: {
            href: '/construction/compare/gypsum-vs-cement-plaster',
            label: 'Gypsum vs cement plaster',
          },
          relatedCalculator: {
            href: '/construction/plaster-calculator',
            label: 'Plaster calculator',
          },
          materialGuideHref: '/construction/materials/plaster',
        });
      }
      out.push({
        id: 'pls-cement',
        category: 'Cement–sand plaster',
        whyFits:
          a.location === 'exterior' || a.goal === 'durable_exterior'
            ? 'Exterior and many general interiors still rely on cementitious plaster as specified.'
            : 'Cement plaster remains a common default for masonry interiors and exteriors.',
        advantages: ['Familiar practice', 'Exterior suitability when detailed'],
        limitations: ['Needs curing time', 'May need putty for premium paint'],
        specsToVerify: ['Mix and thickness', 'Number of coats', 'Curing plan'],
        relatedComparison: {
          href: '/construction/compare/gypsum-vs-cement-plaster',
          label: 'Gypsum vs cement plaster',
        },
        relatedCalculator: {
          href: '/construction/plaster-calculator',
          label: 'Plaster calculator',
        },
        materialGuideHref: '/construction/materials/plaster',
      });
      if (a.substrate === 'aac') {
        out.push({
          id: 'pls-aac-finish',
          category: 'AAC-compatible finish / plaster system',
          whyFits:
            'AAC often needs manufacturer-compatible thin finishes rather than improvised thick cement coats.',
          advantages: ['Reduces finish failures from incompatible systems'],
          limitations: ['Follow maker thickness and prep rules'],
          specsToVerify: ['AAC maker finish recommendations', 'Bonding/prep'],
          relatedCalculator: {
            href: '/construction/aac-block-calculator',
            label: 'AAC calculator',
          },
          materialGuideHref: '/construction/materials/aac-blocks',
        });
      }
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'flooring',
    label: 'Flooring',
    summary: 'Floor finish systems by use and moisture.',
    questions: [
      {
        id: 'room',
        prompt: 'Area type',
        options: [
          { id: 'dry_living', label: 'Dry living / bedroom' },
          { id: 'wet', label: 'Wet area (bath / utility)' },
          { id: 'kitchen', label: 'Kitchen' },
          { id: 'outdoor', label: 'Semi-outdoor / balcony (as designed)' },
        ],
      },
      {
        id: 'traffic',
        prompt: 'Traffic / wear',
        options: [
          { id: 'light', label: 'Light residential' },
          { id: 'heavy', label: 'Higher wear expected' },
        ],
      },
      {
        id: 'preference',
        prompt: 'Finish preference',
        options: [
          { id: 'tile', label: 'Tiles' },
          { id: 'stone', label: 'Natural stone' },
          { id: 'wood', label: 'Wood / laminate' },
          { id: 'resilient', label: 'Vinyl / resilient' },
          { id: 'unsure', label: 'Compare categories first' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      if (
        a.preference === 'tile' ||
        a.preference === 'unsure' ||
        a.room === 'wet' ||
        a.room === 'kitchen'
      ) {
        out.push({
          id: 'flr-tile',
          category:
            a.traffic === 'heavy' || a.room === 'wet'
              ? 'Floor-rated tiles (check abrasion & absorption)'
              : 'Ceramic / vitrified tile categories',
          whyFits:
            'Tiles are common for wet and dry floors when ratings match use — compare body types carefully.',
          advantages: ['Wide availability', 'Wet-area options when rated'],
          limitations: ['Installed cost includes adhesive, grout, waterproofing'],
          specsToVerify: [
            'Water absorption class',
            'PEI / abrasion for floors',
            'Slip resistance in wet zones',
          ],
          relatedComparison: {
            href: '/construction/compare/vitrified-vs-ceramic-tiles',
            label: 'Vitrified vs ceramic',
          },
          relatedCalculator: {
            href: '/construction/tile-calculator',
            label: 'Tile calculator',
          },
          materialGuideHref: '/construction/materials/tiles',
        });
      }
      if (a.room === 'wet') {
        out.push({
          id: 'flr-wp',
          category: 'Wet-area waterproofing system (under tile)',
          whyFits:
            'Wet floors need a waterproofing system — decorative tile alone is not waterproofing.',
          advantages: ['Protects structure when detailed correctly'],
          limitations: ['Failures usually start at drains and junctions'],
          specsToVerify: ['System type', 'Upstands', 'Flood test requirements'],
          materialGuideHref: '/construction/materials/waterproofing',
          relatedCalculator: {
            href: '/construction/tile-calculator',
            label: 'Tile calculator',
          },
        });
      }
      if (a.preference === 'wood' || a.preference === 'resilient') {
        out.push({
          id: 'flr-sensitive',
          category:
            a.preference === 'wood' ? 'Wood / laminate systems' : 'Vinyl / resilient flooring',
          whyFits: 'Moisture-sensitive finishes need dry substrates and correct underlays.',
          advantages: ['Comfort and install speed (product-dependent)'],
          limitations: ['Often unsuitable for wet rooms unless specifically rated'],
          specsToVerify: ['Moisture limits', 'Wear layer / AC rating', 'Warranty exclusions'],
          relatedCalculator: {
            href: '/construction/flooring-calculator',
            label: 'Flooring calculator',
          },
          materialGuideHref: '/construction/materials/flooring',
        });
      }
      if (a.preference === 'stone') {
        out.push({
          id: 'flr-stone',
          category: 'Natural stone flooring',
          whyFits:
            'Stone needs thickness, finish and sealing choices matched to traffic and staining risk.',
          advantages: ['Durable when correctly selected and installed'],
          limitations: ['Fabrication wastage and polishing add cost'],
          specsToVerify: ['Thickness', 'Finish (honed/polished)', 'Sealer needs'],
          relatedCalculator: {
            href: '/construction/flooring-calculator',
            label: 'Flooring calculator',
          },
          materialGuideHref: '/construction/materials/flooring',
        });
      }
      if (a.preference === 'unsure') {
        out.push({
          id: 'flr-overview',
          category: 'Flooring category shortlist',
          whyFits:
            'Start from use (wet/dry) and traffic, then shortlist finish families before brands.',
          advantages: ['Avoids brand-first decisions'],
          limitations: ['Still needs samples on your substrate'],
          specsToVerify: ['Room moisture', 'Subfloor flatness'],
          relatedCalculator: {
            href: '/construction/flooring-calculator',
            label: 'Flooring calculator',
          },
          materialGuideHref: '/construction/materials/flooring',
        });
      }
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'painting',
    label: 'Painting',
    summary: 'Interior and exterior coating systems.',
    questions: [
      {
        id: 'side',
        prompt: 'Surface',
        options: [
          { id: 'interior', label: 'Interior walls / ceilings' },
          { id: 'exterior', label: 'Exterior façade' },
          { id: 'metal_wood', label: 'Metal / wood elements' },
        ],
      },
      {
        id: 'condition',
        prompt: 'Substrate condition',
        options: [
          { id: 'new_plaster', label: 'New plaster / putty ready' },
          { id: 'repaint', label: 'Repaint over existing' },
          { id: 'damp', label: 'Known damp issues (fix first)' },
        ],
      },
      {
        id: 'performance',
        prompt: 'Performance priority',
        options: [
          { id: 'washable', label: 'Washability / scrub' },
          { id: 'weather', label: 'Weather resistance' },
          { id: 'basic', label: 'Basic coverage' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      if (a.side === 'interior') {
        out.push({
          id: 'pnt-int',
          category: 'Interior emulsion system (primer + finish coats)',
          whyFits:
            'Interior walls usually need a system — primer, putty as required, then finish coats.',
          advantages: ['Coverage planning with editable m²/L'],
          limitations: ['Brand claims are not verified here'],
          specsToVerify: ['Coverage on data sheet', 'Number of coats', 'Sheen level'],
          relatedCalculator: {
            href: '/construction/paint-calculator',
            label: 'Paint calculator',
          },
          materialGuideHref: '/construction/materials/paint',
        });
      }
      if (a.side === 'exterior' || a.performance === 'weather') {
        out.push({
          id: 'pnt-ext',
          category: 'Exterior weather-coat / façade emulsion category',
          whyFits:
            'Exterior coatings need UV and weather resistance — not the same as interior emulsions.',
          advantages: ['Category match to exposure'],
          limitations: ['Not a substitute for terrace waterproofing'],
          specsToVerify: ['Exterior product line', 'Primer compatibility', 'Recoat windows'],
          relatedCalculator: {
            href: '/construction/paint-calculator',
            label: 'Paint calculator',
          },
          materialGuideHref: '/construction/materials/paint',
        });
      }
      if (a.side === 'metal_wood') {
        out.push({
          id: 'pnt-specialty',
          category: 'Enamel / specialty coatings for metal or wood',
          whyFits: 'Metal and wood need product families rated for those substrates.',
          advantages: ['Correct category reduces early failure'],
          limitations: ['Prep (rust/sanding) dominates performance'],
          specsToVerify: ['Substrate primer', 'Interior vs exterior rating'],
          relatedCalculator: {
            href: '/construction/paint-calculator',
            label: 'Paint calculator',
          },
          materialGuideHref: '/construction/materials/paint',
        });
      }
      if (a.condition === 'damp') {
        out.push({
          id: 'pnt-damp',
          category: 'Moisture diagnosis before coating',
          whyFits:
            'Painting over active damp typically fails — fix sources and consider waterproofing first.',
          advantages: ['Avoids wasted paint cycles'],
          limitations: ['This tool does not diagnose leaks'],
          specsToVerify: [
            'Leak source fixed',
            'Dry substrate',
            'Any elastomeric/WP notes from designer',
          ],
          materialGuideHref: '/construction/materials/waterproofing',
        });
      }
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'windows',
    label: 'Windows',
    summary: 'Frame and glazing system themes.',
    questions: [
      {
        id: 'priority',
        prompt: 'Priority',
        options: [
          { id: 'thermal', label: 'Thermal / acoustic comfort' },
          { id: 'slim', label: 'Slim frames / large openings' },
          { id: 'budget', label: 'Budget-conscious basic openings' },
          { id: 'low_maint', label: 'Low frame paint maintenance' },
        ],
      },
      {
        id: 'exposure',
        prompt: 'Exposure',
        options: [
          { id: 'inland', label: 'Inland' },
          { id: 'coastal', label: 'Coastal' },
          { id: 'high_wind', label: 'High wind / upper floors (as designed)' },
        ],
      },
      {
        id: 'glass',
        prompt: 'Glass expectation',
        options: [
          { id: 'single', label: 'Single glazing (basic)' },
          { id: 'igu', label: 'Insulated glass interest' },
          { id: 'unsure', label: 'Not sure' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      if (a.priority === 'thermal' || a.priority === 'low_maint' || a.glass === 'igu') {
        out.push({
          id: 'win-upvc',
          category: 'uPVC window systems (profile + glass + hardware)',
          whyFits:
            'uPVC multi-chamber systems are often considered when comfort and low frame painting matter — evaluate full system quotes.',
          advantages: ['Insulation potential with suitable glass', 'Low exterior paint on frames'],
          limitations: [
            'Performance depends on profile, glass and install',
            'Service networks vary',
          ],
          specsToVerify: ['Profile series / reinforcement', 'Glass build-up', 'Install warranty'],
          relatedComparison: {
            href: '/construction/compare/upvc-vs-aluminium-windows',
            label: 'uPVC vs aluminium',
          },
        });
      }
      if (a.priority === 'slim' || a.priority === 'budget') {
        out.push({
          id: 'win-alum',
          category: 'Aluminium window systems',
          whyFits:
            'Aluminium suits large/slim openings; thermal-break systems matter when comfort is a goal.',
          advantages: ['Strength and slim aesthetics', 'Flexible fabrication'],
          limitations: [
            'Without thermal break, heat transfer is higher',
            'Coating quality varies — especially coastal',
          ],
          specsToVerify: [
            'Thermal break or not',
            a.exposure === 'coastal'
              ? 'Coating/corrosion protection for coastal use'
              : 'Powder coat spec',
            'Hardware rating',
          ],
          relatedComparison: {
            href: '/construction/compare/upvc-vs-aluminium-windows',
            label: 'uPVC vs aluminium',
          },
        });
      }
      out.push({
        id: 'win-system',
        category: 'Whole-window specification (not frame-only)',
        whyFits: 'Frame material buzzwords understate glass, mesh, seals and anchoring.',
        advantages: ['Encourages apples-to-apples quotes'],
        limitations: ['No brand shortlist is provided by design'],
        specsToVerify: ['Opening sizes', 'Wind design notes', 'Sill waterproofing detail'],
        relatedComparison: {
          href: '/construction/compare/upvc-vs-aluminium-windows',
          label: 'uPVC vs aluminium',
        },
      });
      return dedupeSuggestions(out);
    },
  },
  {
    id: 'roofing',
    label: 'Roofing',
    summary: 'Roof coverings and waterproofing context.',
    questions: [
      {
        id: 'roof_form',
        prompt: 'Roof form',
        options: [
          { id: 'flat', label: 'Flat terrace / podium' },
          { id: 'pitched', label: 'Pitched roof' },
          { id: 'metal', label: 'Metal sheet interest' },
        ],
      },
      {
        id: 'use',
        prompt: 'Terrace use',
        options: [
          { id: 'waterproof_only', label: 'Weatherproofing primary' },
          { id: 'traffic', label: 'Occasional foot traffic' },
          { id: 'landscape', label: 'Planters / heavy finishes (designer-led)' },
        ],
      },
      {
        id: 'climate',
        prompt: 'Climate stress',
        options: [
          { id: 'rain', label: 'Heavy rain focus' },
          { id: 'heat', label: 'Heat / UV focus' },
          { id: 'both', label: 'Rain + heat' },
        ],
      },
    ],
    recommend: (a) => {
      const out: SelectorSuggestion[] = [];
      if (a.roof_form === 'flat' || a.use !== undefined) {
        out.push({
          id: 'roof-wp',
          category: 'Terrace waterproofing system',
          whyFits:
            'Flat roofs need a waterproofing system with detailing at drains and upstands — not paint alone.',
          advantages: ['System approach reduces leak risk when installed correctly'],
          limitations: [
            'Product chemistry varies — follow data sheets',
            'No brand endorsement here',
          ],
          specsToVerify: [
            'System type (cementitious / liquid / sheet)',
            'Traffic rating if walked on',
            'Drain and parapet details',
          ],
          materialGuideHref: '/construction/materials/waterproofing',
          relatedCalculator: {
            href: '/construction/cost-calculator',
            label: 'Cost calculator',
          },
        });
      }
      if (a.roof_form === 'pitched' || a.roof_form === 'metal') {
        out.push({
          id: 'roof-cover',
          category: 'Pitched roof covering category (tile / sheet as designed)',
          whyFits: 'Covering choice follows structure, pitch, wind and waterproofing underlays.',
          advantages: ['Matches form to covering family'],
          limitations: ['Structural capacity for covering weight is engineer-led'],
          specsToVerify: ['Covering type on drawings', 'Underlay / insulation', 'Fixing schedule'],
          relatedCalculator: {
            href: '/construction/cost-calculator',
            label: 'Cost calculator',
          },
        });
      }
      if (a.climate === 'heat' || a.climate === 'both') {
        out.push({
          id: 'roof-heat',
          category: 'Heat-reflective / insulation strategy (as specified)',
          whyFits:
            'Heat comfort may need insulation or reflective finishes defined for the assembly.',
          advantages: ['Separates waterproofing from thermal strategy'],
          limitations: ['Not a substitute for structural waterproofing'],
          specsToVerify: ['U-value or insulation notes', 'Compatibility with WP layer'],
          materialGuideHref: '/construction/materials/waterproofing',
        });
      }
      return dedupeSuggestions(out);
    },
  },
];

/** Cement-focused question pack reused when user opens selector with ?focus=cement */
export const CEMENT_FOCUS_QUESTIONS = cementQuestions;
export const recommendForCementFocus = cementSuggestions;

export function getSelectorTask(id: string): MaterialSelectorTask | undefined {
  return MATERIAL_SELECTOR_DEFINITIONS.find((t) => t.id === id);
}

export function runSelector(taskId: string, answers: Record<string, string>): SelectorSuggestion[] {
  if (taskId === 'cement-focus') {
    return cementSuggestions(answers);
  }
  const task = getSelectorTask(taskId);
  if (!task) return [];
  return task.recommend(answers);
}
