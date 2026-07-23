export const popularSearches = [
  'Home Loan EMI',
  'Construction Cost',
  'Honda Jazz Service Cost',
  'Paint Calculator',
  'Solar Calculator',
];

export const quickTools = [
  { name: 'EMI Calculator', href: '/calculators/emi', color: '#0b1f3a', icon: 'calculator' },
  { name: 'SIP Calculator', href: '/calculators/sip', color: '#f97316', icon: 'trending' },
  { name: 'Income Tax Calculator', href: '/calculators/income-tax', color: '#ea580c', icon: 'percent' },
  { name: 'GST Calculator', href: '/calculators/gst', color: '#f5a623', icon: 'receipt' },
  { name: 'Construction Cost Calculator', href: '/calculators/construction-cost', color: '#122b4a', icon: 'building' },
  { name: 'Paint Calculator', href: '/calculators/paint', color: '#fb923c', icon: 'paint' },
  { name: 'Solar Savings Calculator', href: '/calculators/solar', color: '#f59e0b', icon: 'sun' },
  { name: 'Car Loan Calculator', href: '/calculators/car-loan', color: '#0b1f3a', icon: 'car' },
  { name: 'Retirement Calculator', href: '/calculators/retirement', color: '#c2410c', icon: 'piggy' },
  { name: 'Fuel Cost Calculator', href: '/calculators/fuel', color: '#f97316', icon: 'fuel' },
] as const;

export const aiToolsTiles = [
  { name: 'Resume Builder', href: '/ai-tools', color: '#0b1f3a', icon: 'book' },
  { name: 'Invoice Generator', href: '/ai-tools', color: '#f97316', icon: 'receipt' },
  { name: 'PDF Converter', href: '/ai-tools', color: '#ea580c', icon: 'box' },
  { name: 'QR Code Generator', href: '/ai-tools', color: '#f5a623', icon: 'grid' },
  { name: 'Budget Planner', href: '/ai-tools', color: '#122b4a', icon: 'wallet' },
  { name: 'Expense Tracker', href: '/ai-tools', color: '#fb923c', icon: 'trending' },
  { name: 'Home Planner', href: '/ai-tools', color: '#0b1f3a', icon: 'home' },
  { name: 'EMI vs SIP Planner', href: '/ai-tools', color: '#f97316', icon: 'percent' },
  { name: 'Email Assistant', href: '/ai-tools', color: '#ea580c', icon: 'pen' },
  { name: 'Content Assistant', href: '/ai-tools', color: '#f5a623', icon: 'users' },
] as const;

export const categories = [
  {
    title: 'Finance',
    href: '/finance',
    accent: '#0b1f3a',
    accentSoft: '#e8eef5',
    icon: 'wallet',
    links: [
      { label: 'Loans', href: '/finance' },
      { label: 'Credit Cards', href: '/finance' },
      { label: 'Insurance', href: '/finance' },
      { label: 'Mutual Funds', href: '/finance' },
      { label: 'Income Tax', href: '/finance' },
      { label: 'NPS & Retirement', href: '/finance' },
    ],
    image:
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Coins and savings jar',
  },
  {
    title: 'Home & Construction',
    href: '/construction',
    accent: '#f97316',
    accentSoft: '#fff4eb',
    icon: 'building',
    links: [
      { label: 'Construction Guide', href: '/construction' },
      { label: 'Interior Design', href: '/construction' },
      { label: 'Paints & Walls', href: '/construction' },
      { label: 'Flooring', href: '/construction' },
      { label: 'Roofing', href: '/construction' },
      { label: 'Plumbing & Electrical', href: '/construction' },
    ],
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Modern living room interior',
  },
  {
    title: 'Automobiles',
    href: '/automobile',
    accent: '#ea580c',
    accentSoft: '#ffedd5',
    icon: 'car',
    links: [
      { label: 'Car Reviews', href: '/reviews' },
      { label: 'Maintenance Cost', href: '/automobile' },
      { label: 'Accessories', href: '/automobile' },
      { label: 'Tyres & Batteries', href: '/automobile' },
      { label: 'Insurance', href: '/automobile' },
      { label: 'Buying Guide', href: '/automobile' },
    ],
    image:
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Red car on the road',
  },
  {
    title: 'Solar & Energy',
    href: '/solar',
    accent: '#f5a623',
    accentSoft: '#fef3c7',
    icon: 'sun',
    links: [
      { label: 'Solar Calculator', href: '/calculators/solar' },
      { label: 'Solar Panels', href: '/ai-tools' },
      { label: 'Inverters', href: '/ai-tools' },
      { label: 'Battery Solutions', href: '/ai-tools' },
      { label: 'Government Subsidy', href: '/ai-tools' },
      { label: 'Energy Saving Tips', href: '/ai-tools' },
    ],
    image:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Solar panels on rooftop',
  },
] as const;

export const articles = [
  {
    title: 'How to Calculate Home Loan EMI in 2026?',
    category: 'Finance',
    date: '12 Mar 2026',
    href: '/articles/home-loan-emi',
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Complete Guide to House Construction Cost in India',
    category: 'Home',
    date: '08 Mar 2026',
    href: '/articles/construction-cost-guide',
    image:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Best Paint Brands for Home Interiors Compared',
    category: 'Home',
    date: '02 Mar 2026',
    href: '/articles/paint-brands',
    image:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Honda Jazz Maintenance Cost in India',
    category: 'Auto',
    date: '28 Feb 2026',
    href: '/articles/honda-jazz-maintenance',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'How Much Paint Do You Need?',
    category: 'Home',
    date: '19 Feb 2026',
    href: '/articles/how-much-paint-you-need',
    image:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
  },
] as const;

export const comparisons = [
  {
    title: 'Asian Paints vs Berger Paints',
    factors: 12,
    href: '/compare/asian-paints-vs-berger',
    leftImage:
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
    rightImage:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'SBI Home Loan vs HDFC Home Loan',
    factors: 18,
    href: '/compare/sbi-vs-hdfc-home-loan',
    leftImage:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
    rightImage:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Honda Jazz vs Maruti Baleno',
    factors: 24,
    href: '/compare/honda-jazz-vs-baleno',
    leftImage:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80',
    rightImage:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Mono vs Poly Solar Panels',
    factors: 10,
    href: '/compare/mono-vs-poly-solar',
    leftImage:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    rightImage:
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80',
  },
] as const;

export const reviews = [
  {
    title: 'Best Air Compressors for Home Use in India',
    score: 4.6,
    href: '/reviews/air-compressors',
    image:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Top Inverters for Home & Office 2026',
    score: 4.4,
    href: '/reviews/inverters',
    image:
      'https://images.unsplash.com/photo-1621905251189-08b45d6a8099?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Best Interior Paints Worth Buying',
    score: 4.7,
    href: '/reviews/interior-paints',
    image:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Top Compact SUVs Under 15 Lakh',
    score: 4.5,
    href: '/reviews/compact-suvs',
    image:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400&q=80',
  },
] as const;

export const professionals = [
  { name: 'Builders', href: '/directory', icon: 'building' },
  { name: 'Interior Designers', href: '/directory', icon: 'sofa' },
  { name: 'Architects', href: '/directory', icon: 'pen' },
  { name: 'Electricians', href: '/directory', icon: 'zap' },
  { name: 'Plumbers', href: '/directory', icon: 'droplet' },
  { name: 'Painters', href: '/directory', icon: 'paint' },
  { name: 'Civil Engineers', href: '/directory', icon: 'hardhat' },
  { name: 'Solar Installers', href: '/directory', icon: 'sun' },
] as const;

export const navItems = [
  { label: 'Home', href: '/', icon: true },
  { label: 'Finance', href: '/finance', dropdown: true },
  { label: 'Home & Construction', href: '/construction', dropdown: true },
  { label: 'Automobile', href: '/automobile', dropdown: true },
  { label: 'Solar', href: '/solar' },
  { label: 'Calculators', href: '/calculators' },
  { label: 'AI Tools', href: '/ai-tools' },
  { label: 'Compare', href: '/compare' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Blog', href: '/articles' },
  { label: 'Tags', href: '/tags' },
  { label: 'Directory', href: '/directory' },
] as const;

export const heroBg =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80';
