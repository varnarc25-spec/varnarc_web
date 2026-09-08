export const ADVANCED_CALC_FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  'false-ceiling-calculator': [
    {
      question: 'How many gypsum boards do I need?',
      answer:
        'The calculator divides net ceiling area by board size and adds a wastage allowance. Confirm board size with your supplier.',
    },
    {
      question: 'Does this design the hanging system?',
      answer:
        'No. Perimeter length is a planning allowance. Framing, hangers and load capacity must follow manufacturer details and site drawings.',
    },
  ],
  'staircase-calculator': [
    {
      question: 'Is this a structural staircase design?',
      answer:
        'No. It only estimates geometry (risers, treads, going) and a rectangular waist-volume envelope. A qualified structural engineer must verify dimensions, loads and reinforcement.',
    },
    {
      question: 'How are risers counted?',
      answer:
        'Risers are rounded from floor-to-floor height divided by the target riser. Actual riser equals height divided by that count. Treads for a straight flight are risers minus one.',
    },
  ],
  'water-tank-calculator': [
    {
      question: 'How is capacity calculated?',
      answer:
        'Rectangular tanks use L × W × H. Circular tanks use π × r² × H. Litres are usable cubic metres × 1000 after optional freeboard.',
    },
    {
      question: 'Does this size tank walls?',
      answer:
        'No. It reports geometric volume only, not wall thickness, steel or hydrostatic design.',
    },
  ],
  'roofing-calculator': [
    {
      question: 'How is pitched roof area estimated?',
      answer:
        'Plan length × width is divided by cos(pitch). Sheet count uses effective sheet area after overlap and wastage.',
    },
    {
      question: 'Does this design the roof structure?',
      answer: 'No. Purlins, wind loads and waterproofing details need a qualified designer.',
    },
  ],
  'wall-area-calculator': [
    {
      question: 'What is net wall area used for?',
      answer:
        'Net area (walls minus openings) is the surface for paint, tile or plaster. Use it as the area input in those calculators.',
    },
  ],
  'excavation-calculator': [
    {
      question: 'What is bulking?',
      answer:
        'Loose excavated soil occupies more volume than in-situ earth. The percentage is a planning allowance, not a geotechnical investigation.',
    },
    {
      question: 'Is this a foundation design?',
      answer:
        'No. It estimates pit volume only. Footings, shoring and soil bearing need engineering review.',
    },
  ],
};

export const ADVANCED_CALC_RELATED: Record<string, Array<{ href: string; label: string }>> = {
  'false-ceiling-calculator': [
    { href: '/construction/paint-calculator', label: 'Paint calculator' },
    { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
    { href: '/construction/renovation-cost-calculator', label: 'Renovation cost' },
  ],
  'staircase-calculator': [
    { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
    { href: '/construction/rcc-calculator', label: 'RCC calculator' },
    { href: '/construction/steel-calculator', label: 'Steel calculator' },
  ],
  'water-tank-calculator': [
    { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
    { href: '/construction/excavation-calculator', label: 'Excavation calculator' },
  ],
  'roofing-calculator': [
    { href: '/construction/tile-calculator', label: 'Tile calculator' },
    { href: '/construction/material-calculator', label: 'Material quantities' },
  ],
  'wall-area-calculator': [
    { href: '/construction/paint-calculator', label: 'Paint calculator' },
    { href: '/construction/tile-calculator', label: 'Tile calculator' },
    { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
  ],
  'excavation-calculator': [
    { href: '/construction/footing-calculator', label: 'Footing calculator' },
    { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  ],
};
