import type { PrismaClient } from '@prisma/client';
import {
  reassignArticleCategories,
  resolveArticleCategorySlug,
  seedCategoryTree,
} from './seed-category-tree';
import { seedCalculatorArticles } from './seed-calculator-articles';

const PRODUCT_TEMPLATE_ID = '00000000-0000-4000-8000-000000000102';

type ArticleSeed = {
  slug: string;
  title: string;
  categorySlug: string;
  excerpt: string;
  isFeatured?: boolean;
};

function articleBody(title: string, category: string): string {
  return `## Overview

${title} — a practical guide for Indian readers researching ${category} decisions in 2026.

## What you will learn

- How to evaluate options before you commit
- Common mistakes to avoid
- Cost, quality, and long-term value trade-offs
- Official sources and when to verify with a professional

## Key considerations

Start with your budget, location, and timeline. Compare at least two or three options, read recent price or rate updates, and use Varnarc calculators to sanity-check numbers before you sign paperwork.

## Bottom line

Use this article as a starting point. Cross-check figures with current market data, lender or dealer quotes, and local regulations.`;
}

const ARTICLE_TOPICS: ArticleSeed[] = [
  {
    slug: 'home-loan-emi',
    title: 'How to Calculate Home Loan EMI in 2026?',
    categorySlug: 'finance',
    excerpt: 'Step-by-step guide to estimating home loan EMI, interest, and total repayment.',
    isFeatured: true,
  },
  {
    slug: 'construction-cost-guide',
    title: 'Complete Guide to House Construction Cost in India',
    categorySlug: 'home-construction',
    excerpt: 'Understand per-sq-ft costs, material splits, and regional price differences.',
    isFeatured: true,
  },
  {
    slug: 'paint-brands',
    title: 'Best Paint Brands for Home Interiors Compared',
    categorySlug: 'home-construction',
    excerpt: 'Asian Paints, Berger, Nerolac, and more — how to choose interior paint.',
    isFeatured: true,
  },
  {
    slug: 'honda-jazz-maintenance',
    title: 'Honda Jazz Maintenance Cost in India',
    categorySlug: 'automobiles',
    excerpt: 'Service intervals, spare parts, and annual running costs for Jazz owners.',
    isFeatured: true,
  },
  {
    slug: 'how-much-paint-you-need',
    title: 'How Much Paint Do You Need for a Room?',
    categorySlug: 'home-construction',
    excerpt: 'Estimate litres of paint for walls and ceilings by room size.',
    isFeatured: true,
  },
  { slug: 'how-to-buy-first-house', title: 'How to Buy Your First House in India', categorySlug: 'finance', excerpt: 'From savings to registration — a first-time buyer checklist.' },
  { slug: 'best-home-loan-india', title: 'Best Home Loan Options in India (2026)', categorySlug: 'finance', excerpt: 'Compare banks, NBFCs, floating vs fixed rates, and eligibility.' },
  { slug: 'how-to-save-income-tax', title: 'How to Save Income Tax Legally in India', categorySlug: 'finance', excerpt: 'Section 80C, 80D, HRA, and NPS deductions explained simply.' },
  { slug: 'what-is-nps', title: 'What Is NPS and Should You Invest?', categorySlug: 'finance', excerpt: 'National Pension System basics, tax benefits, and withdrawal rules.' },
  { slug: 'sip-basics-guide', title: 'SIP Basics for Beginners', categorySlug: 'finance', excerpt: 'Start a mutual fund SIP with the right amount and horizon.' },
  { slug: 'personal-loan-vs-credit-card', title: 'Personal Loan vs Credit Card EMI', categorySlug: 'finance', excerpt: 'Which borrowing option costs less for short-term needs.' },
  { slug: 'cibil-score-improve', title: 'How to Improve Your CIBIL Score', categorySlug: 'finance', excerpt: 'Practical steps to build credit before applying for loans.' },
  { slug: 'home-loan-prepayment', title: 'Home Loan Prepayment: Is It Worth It?', categorySlug: 'finance', excerpt: 'When partial prepayment saves interest and when it does not.' },
  { slug: 'car-loan-vs-full-payment', title: 'Car Loan vs Full Payment', categorySlug: 'finance', excerpt: 'Opportunity cost, EMI burden, and dealer offers compared.' },
  { slug: 'term-insurance-guide', title: 'Term Life Insurance Buying Guide', categorySlug: 'finance', excerpt: 'Cover amount, riders, and claim settlement ratios.' },
  { slug: 'health-insurance-family', title: 'Health Insurance for Families in India', categorySlug: 'finance', excerpt: 'Floater vs individual plans, room rent limits, and super top-up.' },
  { slug: 'mutual-fund-taxation', title: 'Mutual Fund Taxation in India', categorySlug: 'finance', excerpt: 'LTCG, STCG, and indexation for equity and debt funds.' },
  { slug: 'ppf-vs-fd', title: 'PPF vs Fixed Deposit: Which Is Better?', categorySlug: 'finance', excerpt: 'Returns, liquidity, and tax treatment compared.' },
  { slug: 'credit-card-rewards', title: 'How to Maximize Credit Card Rewards', categorySlug: 'finance', excerpt: 'Cashback, miles, and lounge access without overspending.' },
  { slug: 'gold-loan-vs-personal-loan', title: 'Gold Loan vs Personal Loan', categorySlug: 'finance', excerpt: 'Speed, interest rates, and risk for emergency borrowing.' },
  { slug: 'education-loan-guide', title: 'Education Loan Guide for Indian Students', categorySlug: 'finance', excerpt: 'Collateral, moratorium, and tax benefits under Section 80E.' },
  { slug: 'retirement-corpus-india', title: 'How Much Retirement Corpus Do You Need?', categorySlug: 'finance', excerpt: 'Inflation-adjusted targets for urban and tier-2 lifestyles.' },
  { slug: 'gst-for-small-business', title: 'GST Basics for Small Business Owners', categorySlug: 'finance', excerpt: 'Registration thresholds, returns, and input tax credit.' },
  { slug: 'income-tax-new-vs-old', title: 'New vs Old Tax Regime: Which to Choose?', categorySlug: 'finance', excerpt: 'Run the numbers before filing ITR for FY 2025–26.' },
  { slug: 'nps-tier-1-tier-2', title: 'NPS Tier 1 vs Tier 2 Explained', categorySlug: 'finance', excerpt: 'Liquidity, tax benefits, and asset allocation choices.' },
  { slug: 'construction-cost-bangalore', title: 'Construction Cost in Bangalore for 2026', categorySlug: 'home-construction', excerpt: 'Per-sq-ft ranges for basic, standard, and premium builds.' },
  { slug: 'construction-cost-mumbai', title: 'House Construction Cost in Mumbai', categorySlug: 'home-construction', excerpt: 'Material and labour rates in the Mumbai metropolitan region.' },
  { slug: 'vastu-for-home-plan', title: 'Vastu Tips for Home Floor Plans', categorySlug: 'home-construction', excerpt: 'Room placement ideas that work with modern layouts.' },
  { slug: 'flooring-options-india', title: 'Flooring Options: Tiles vs Marble vs Wood', categorySlug: 'home-construction', excerpt: 'Cost, maintenance, and climate suitability.' },
  { slug: 'roofing-materials-guide', title: 'Roofing Materials Guide for Indian Homes', categorySlug: 'home-construction', excerpt: 'RCC, metal sheets, clay tiles, and waterproofing layers.' },
  { slug: 'plumbing-cost-house', title: 'Plumbing Cost for New House Construction', categorySlug: 'home-construction', excerpt: 'Fixtures, piping, and labour estimates per bathroom.' },
  { slug: 'electrical-wiring-cost', title: 'Electrical Wiring Cost per Sq Ft', categorySlug: 'home-construction', excerpt: 'Conduits, MCBs, points, and inverter readiness.' },
  { slug: 'interior-design-budget', title: 'Interior Design on a Budget', categorySlug: 'home-construction', excerpt: 'Prioritize kitchens, wardrobes, and lighting for maximum impact.' },
  { slug: 'cement-types-india', title: 'OPC vs PPC Cement: Which to Use?', categorySlug: 'home-construction', excerpt: 'Strength grades, setting time, and application areas.' },
  { slug: 'tmt-steel-buying-guide', title: 'TMT Steel Buying Guide', categorySlug: 'home-construction', excerpt: 'Fe 500 vs Fe 550D, brands, and weight verification.' },
  { slug: 'brick-vs-blocks', title: 'Red Bricks vs AAC Blocks', categorySlug: 'home-construction', excerpt: 'Thermal performance, cost, and build speed compared.' },
  { slug: 'waterproofing-terrace', title: 'Terrace Waterproofing Methods', categorySlug: 'home-construction', excerpt: 'Membranes, coatings, and slope correction basics.' },
  { slug: 'modular-kitchen-cost', title: 'Modular Kitchen Cost in India', categorySlug: 'home-construction', excerpt: 'Layouts, materials, appliances, and installation.' },
  { slug: 'bathroom-renovation-cost', title: 'Bathroom Renovation Cost Estimate', categorySlug: 'home-construction', excerpt: 'Tiles, fittings, plumbing changes, and labour.' },
  { slug: 'wpc-vs-plywood', title: 'WPC vs Plywood for Wardrobes', categorySlug: 'home-construction', excerpt: 'Moisture resistance, finish options, and price bands.' },
  { slug: 'solar-panel-cost-india', title: 'Solar Panel Installation Cost in India', categorySlug: 'solar-energy', excerpt: 'System size, subsidy, and payback period overview.' },
  { slug: 'on-grid-vs-off-grid-solar', title: 'On-Grid vs Off-Grid Solar Systems', categorySlug: 'solar-energy', excerpt: 'Net metering, batteries, and backup trade-offs.' },
  { slug: 'solar-subsidy-india', title: 'Rooftop Solar Subsidy Scheme Explained', categorySlug: 'solar-energy', excerpt: 'Central and state incentives for residential installs.' },
  { slug: 'inverter-battery-guide', title: 'Home Inverter and Battery Buying Guide', categorySlug: 'solar-energy', excerpt: 'VA rating, tubular vs lithium, and backup hours.' },
  { slug: 'mono-vs-poly-panels', title: 'Monocrystalline vs Polycrystalline Panels', categorySlug: 'solar-energy', excerpt: 'Efficiency, space, and cost for rooftop installs.' },
  { slug: 'honda-jazz-vs-baleno', title: 'Honda Jazz vs Maruti Baleno', categorySlug: 'automobiles', excerpt: 'Space, mileage, service costs, and resale compared.' },
  { slug: 'best-hatchback-under-10-lakh', title: 'Best Hatchbacks Under ₹10 Lakh', categorySlug: 'automobiles', excerpt: 'Swift, i20, Polo, and Jazz — value picks for 2026.' },
  { slug: 'suv-buying-guide-india', title: 'Compact SUV Buying Guide India', categorySlug: 'automobiles', excerpt: 'Ground clearance, safety, and diesel vs petrol.' },
  { slug: 'car-insurance-claim-process', title: 'Car Insurance Claim Process in India', categorySlug: 'automobiles', excerpt: 'Cashless garages, IDV, and zero-depreciation add-ons.' },
  { slug: 'ev-charging-home', title: 'Home EV Charging Setup Guide', categorySlug: 'automobiles', excerpt: 'AC chargers, load capacity, and installation cost.' },
  { slug: 'tyre-rotation-maintenance', title: 'Tyre Rotation and Alignment Guide', categorySlug: 'automobiles', excerpt: 'Extend tyre life and improve fuel efficiency.' },
  { slug: 'used-car-inspection-checklist', title: 'Used Car Inspection Checklist', categorySlug: 'automobiles', excerpt: 'Engine, body, documents, and test-drive tips.' },
  { slug: 'car-accessories-must-have', title: 'Must-Have Car Accessories for Indian Roads', categorySlug: 'automobiles', excerpt: 'Dash cams, seat covers, and safety essentials.' },
  { slug: 'diesel-vs-petrol-suv', title: 'Diesel vs Petrol SUV: Running Costs', categorySlug: 'automobiles', excerpt: 'Mileage, maintenance, and resale in city driving.' },
  { slug: 'car-loan-interest-rates', title: 'Car Loan Interest Rates Compared', categorySlug: 'automobiles', excerpt: 'Bank vs NBFC offers and processing fee traps.' },
  { slug: 'hybrid-cars-india', title: 'Strong Hybrid Cars in India Explained', categorySlug: 'automobiles', excerpt: 'Fuel savings, battery warranty, and tax benefits.' },
  { slug: 'rc-transfer-process', title: 'Vehicle RC Transfer Process', categorySlug: 'automobiles', excerpt: 'Documents, RTO fees, and online Parivahan steps.' },
  { slug: 'emi-calculator-how-to-use', title: 'How to Use an EMI Calculator Effectively', categorySlug: 'tools', excerpt: 'Principal, tenure, and rate scenarios to model before borrowing.' },
  { slug: 'gst-calculator-business', title: 'GST Calculator for Small Invoices', categorySlug: 'tools', excerpt: 'CGST, SGST, and IGST splits for goods and services.' },
  { slug: 'paint-calculator-room', title: 'Paint Calculator: Room-by-Room Guide', categorySlug: 'tools', excerpt: 'Doors, windows, and coat count adjustments.' },
  { slug: 'tile-calculator-bathroom', title: 'Tile Calculator for Bathrooms and Kitchens', categorySlug: 'tools', excerpt: 'Wastage percentage and skirting tile estimates.' },
  { slug: 'budget-planner-monthly', title: 'Monthly Budget Planner for Indian Households', categorySlug: 'tools', excerpt: '50-30-20 rule adapted for rent, EMIs, and savings.' },
];

// Expand to 100 articles with numbered variants across core topics
const EXTRA_TOPIC_STEMS = [
  { stem: 'home-loan-tips', title: 'Home Loan Tips', categorySlug: 'home-loans' },
  { stem: 'tax-saving', title: 'Tax Saving Ideas', categorySlug: 'tax-planning' },
  { stem: 'construction-material', title: 'Construction Material Guide', categorySlug: 'home-construction' },
  { stem: 'interior-tip', title: 'Interior Design Tip', categorySlug: 'home-construction' },
  { stem: 'car-maintenance', title: 'Car Maintenance Tip', categorySlug: 'automobiles' },
  { stem: 'solar-tip', title: 'Solar Energy Tip', categorySlug: 'solar-energy' },
  { stem: 'calculator-guide', title: 'Calculator How-To', categorySlug: 'calculator-guides' },
] as const;

for (let i = 0; ARTICLE_TOPICS.length < 100; i++) {
  const base = EXTRA_TOPIC_STEMS[i % EXTRA_TOPIC_STEMS.length]!;
  const n = Math.floor(i / EXTRA_TOPIC_STEMS.length) + 1;
  ARTICLE_TOPICS.push({
    slug: `${base.stem}-${n}`,
    title: `${base.title} #${n}`,
    categorySlug: base.categorySlug,
    excerpt: `Practical ${base.title.toLowerCase()} for Indian readers — part ${n} of our expanded library.`,
  });
}

const COMPARISON_SEEDS = [
  {
    slug: 'asian-paints-vs-berger',
    title: 'Asian Paints vs Berger Paints',
    left: 'Asian Paints Premium Emulsion',
    right: 'Berger Breathe Easy',
    comparisonType: 'product',
  },
  {
    slug: 'sbi-vs-hdfc-home-loan',
    title: 'SBI Home Loan vs HDFC Home Loan',
    left: 'SBI Home Loan',
    right: 'HDFC Home Loan',
    comparisonType: 'product',
  },
  {
    slug: 'honda-jazz-vs-baleno',
    title: 'Honda Jazz vs Maruti Baleno',
    left: 'Honda Jazz',
    right: 'Maruti Baleno',
    comparisonType: 'vehicle',
  },
  {
    slug: 'mono-vs-poly-solar',
    title: 'Mono vs Poly Solar Panels',
    left: 'Monocrystalline Panel',
    right: 'Polycrystalline Panel',
    comparisonType: 'product',
  },
  { slug: 'hdfc-vs-icici-personal-loan', title: 'HDFC vs ICICI Personal Loan', left: 'HDFC Personal Loan', right: 'ICICI Personal Loan', comparisonType: 'product' },
  { slug: 'ultratech-vs-ambuja-cement', title: 'UltraTech vs Ambuja Cement', left: 'UltraTech OPC 53', right: 'Ambuja Cement', comparisonType: 'product' },
  { slug: 'creta-vs-seltos', title: 'Hyundai Creta vs Kia Seltos', left: 'Hyundai Creta', right: 'Kia Seltos', comparisonType: 'vehicle' },
  { slug: 'term-vs-endowment-insurance', title: 'Term vs Endowment Insurance', left: 'Term Life Plan', right: 'Endowment Plan', comparisonType: 'product' },
  { slug: 'flooring-tiles-vs-vitrified', title: 'Ceramic vs Vitrified Tiles', left: 'Ceramic Tiles', right: 'Vitrified Tiles', comparisonType: 'product' },
  { slug: 'inverter-lithium-vs-tubular', title: 'Lithium vs Tubular Inverter Battery', left: 'Lithium Battery', right: 'Tubular Battery', comparisonType: 'product' },
  { slug: 'sip-vs-lumpsum', title: 'SIP vs Lumpsum Investing', left: 'Monthly SIP', right: 'One-Time Lumpsum', comparisonType: 'product' },
  { slug: 'petrol-vs-cng-car', title: 'Petrol vs CNG Car Ownership', left: 'Petrol Hatchback', right: 'Factory CNG Hatchback', comparisonType: 'vehicle' },
  { slug: 'plywood-vs-mdf', title: 'Plywood vs MDF for Furniture', left: 'Commercial Plywood', right: 'MDF Board', comparisonType: 'product' },
  { slug: 'split-vs-window-ac', title: 'Split AC vs Window AC', left: '1.5T Split AC', right: '1.5T Window AC', comparisonType: 'product' },
  { slug: 'ro-vs-uv-water-purifier', title: 'RO vs UV Water Purifier', left: 'RO Purifier', right: 'UV Purifier', comparisonType: 'product' },
  { slug: 'hybrid-vs-petrol-sedan', title: 'Hybrid vs Petrol Sedan', left: 'Strong Hybrid Sedan', right: 'Petrol Sedan', comparisonType: 'vehicle' },
  { slug: 'granite-vs-quartz-countertop', title: 'Granite vs Quartz Countertop', left: 'Granite Slab', right: 'Engineered Quartz', comparisonType: 'product' },
  { slug: 'fixed-vs-floating-home-loan', title: 'Fixed vs Floating Home Loan', left: 'Fixed Rate Loan', right: 'Floating Rate Loan', comparisonType: 'product' },
  { slug: 'ev-vs-petrol-city-commute', title: 'EV vs Petrol for City Commute', left: 'Electric Hatchback', right: 'Petrol Hatchback', comparisonType: 'vehicle' },
  { slug: 'asian-paints-vs-nerolac', title: 'Asian Paints vs Nerolac', left: 'Asian Paints', right: 'Nerolac Paints', comparisonType: 'product' },
] as const;

const REVIEW_SEEDS = [
  { slug: 'air-compressors', title: 'Best Air Compressors for Home Use in India', score: 4.6, category: 'tools' },
  { slug: 'inverters', title: 'Top Inverters for Home & Office 2026', score: 4.4, category: 'solar-energy' },
  { slug: 'interior-paints', title: 'Best Interior Paints Worth Buying', score: 4.7, category: 'home-construction' },
  { slug: 'compact-suvs', title: 'Top Compact SUVs Under ₹15 Lakh', score: 4.5, category: 'automobiles' },
  { slug: 'water-purifiers', title: 'Best Water Purifiers for Indian Homes', score: 4.5, category: 'home-construction' },
  { slug: 'paint-sprayers', title: 'Best Paint Sprayers for DIY Projects', score: 4.3, category: 'tools' },
  { slug: 'solar-panels-home', title: 'Best Solar Panels for Rooftop Install', score: 4.6, category: 'solar-energy' },
  { slug: 'cctv-cameras', title: 'Best CCTV Cameras for Home Security', score: 4.2, category: 'tools' },
  { slug: 'car-tyres', title: 'Best Car Tyres for Indian Roads', score: 4.4, category: 'automobiles' },
  { slug: 'credit-cards-cashback', title: 'Best Cashback Credit Cards 2026', score: 4.3, category: 'finance' },
  { slug: 'term-insurance-plans', title: 'Best Term Insurance Plans Compared', score: 4.5, category: 'finance' },
  { slug: 'kitchen-chimneys', title: 'Best Kitchen Chimneys Under ₹15,000', score: 4.1, category: 'home-construction' },
  { slug: 'power-tools-drills', title: 'Best Cordless Drills for Home Use', score: 4.4, category: 'tools' },
  { slug: 'dash-cams', title: 'Best Dash Cams for Cars in India', score: 4.3, category: 'automobiles' },
  { slug: 'geysers', title: 'Best Geysers for Hard Water Areas', score: 4.2, category: 'home-construction' },
  { slug: 'mutual-funds-beginners', title: 'Best Mutual Funds for Beginners', score: 4.4, category: 'finance' },
  { slug: 'robot-vacuums', title: 'Best Robot Vacuums for Indian Homes', score: 4.0, category: 'tools' },
  { slug: 'car-seat-covers', title: 'Best Car Seat Covers Compared', score: 4.1, category: 'automobiles' },
  { slug: 'solar-inverters', title: 'Best Solar Inverters for On-Grid Systems', score: 4.5, category: 'solar-energy' },
  { slug: 'home-loan-banks', title: 'Best Banks for Home Loans in 2026', score: 4.4, category: 'finance' },
] as const;

export async function seedContent(prisma: PrismaClient) {
  const editor = await prisma.user.upsert({
    where: { email: 'editorial@varnarc.com' },
    update: {
      username: 'varnarc-editorial',
      displayName: 'Varnarc Editorial Team',
      bio: 'Practical guides on finance, home construction, automobiles, solar energy, and everyday tools for Indian readers.',
      profileVisibility: 'PUBLIC',
      status: 'ACTIVE',
      website: 'https://varnarc.com/about',
    },
    create: {
      auth0UserId: 'seed|varnarc-editorial',
      email: 'editorial@varnarc.com',
      username: 'varnarc-editorial',
      displayName: 'Varnarc Editorial Team',
      firstName: 'Varnarc',
      lastName: 'Editorial',
      bio: 'Practical guides on finance, home construction, automobiles, solar energy, and everyday tools for Indian readers.',
      profileVisibility: 'PUBLIC',
      status: 'ACTIVE',
      emailVerified: true,
      website: 'https://varnarc.com/about',
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { slug: 'editor' },
    update: { name: 'Editor', description: 'Content editor' },
    create: { slug: 'editor', name: 'Editor', description: 'Content editor' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: editor.id, roleId: editorRole.id } },
    update: {},
    create: { userId: editor.id, roleId: editorRole.id },
  });

  const categoryIds = await seedCategoryTree(prisma);

  for (const article of ARTICLE_TOPICS) {
    const resolvedSlug = resolveArticleCategorySlug(article.slug, article.categorySlug);
    const categoryId = categoryIds[resolvedSlug] ?? categoryIds[article.categorySlug];
    if (!categoryId) continue;
    const content = articleBody(article.title, article.categorySlug.replace('-', ' '));
    const readingTime = Math.max(3, Math.ceil(content.split(/\s+/).length / 200));
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content,
        categoryId,
        authorId: editor.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        isFeatured: article.isFeatured ?? false,
        readingTimeMinutes: readingTime,
        deletedAt: null,
      },
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content,
        categoryId,
        authorId: editor.id,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        isFeatured: article.isFeatured ?? false,
        readingTimeMinutes: readingTime,
      },
    });
  }

  await prisma.comparisonTemplate.upsert({
    where: { id: PRODUCT_TEMPLATE_ID },
    update: {
      name: 'Product comparison',
      entityType: 'product',
      description: 'Generic product side-by-side attributes',
      attributes: [
        { key: 'price', label: 'Price / cost', valueType: 'text', sortOrder: 0 },
        { key: 'quality', label: 'Quality', valueType: 'rating', sortOrder: 1 },
        { key: 'value', label: 'Value for money', valueType: 'rating', sortOrder: 2 },
        { key: 'availability', label: 'Availability', valueType: 'text', sortOrder: 3 },
      ],
    },
    create: {
      id: PRODUCT_TEMPLATE_ID,
      name: 'Product comparison',
      entityType: 'product',
      description: 'Generic product side-by-side attributes',
      attributes: [
        { key: 'price', label: 'Price / cost', valueType: 'text', sortOrder: 0 },
        { key: 'quality', label: 'Quality', valueType: 'rating', sortOrder: 1 },
        { key: 'value', label: 'Value for money', valueType: 'rating', sortOrder: 2 },
        { key: 'availability', label: 'Availability', valueType: 'text', sortOrder: 3 },
      ],
    },
  });

  for (const comp of COMPARISON_SEEDS) {
    const leftSlug = `${comp.slug}-left`;
    const rightSlug = `${comp.slug}-right`;
    const leftProduct = await prisma.product.upsert({
      where: { slug: leftSlug },
      update: { name: comp.left, category: comp.comparisonType },
      create: { name: comp.left, slug: leftSlug, category: comp.comparisonType },
    });
    const rightProduct = await prisma.product.upsert({
      where: { slug: rightSlug },
      update: { name: comp.right, category: comp.comparisonType },
      create: { name: comp.right, slug: rightSlug, category: comp.comparisonType },
    });

    const comparison = await prisma.comparison.upsert({
      where: { slug: comp.slug },
      update: {
        title: comp.title,
        description: `Side-by-side comparison: ${comp.left} vs ${comp.right}.`,
        comparisonType: comp.comparisonType,
        entityType: comp.comparisonType,
        templateId: PRODUCT_TEMPLATE_ID,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        deletedAt: null,
      },
      create: {
        title: comp.title,
        slug: comp.slug,
        description: `Side-by-side comparison: ${comp.left} vs ${comp.right}.`,
        comparisonType: comp.comparisonType,
        entityType: comp.comparisonType,
        templateId: PRODUCT_TEMPLATE_ID,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await prisma.comparisonItem.deleteMany({ where: { comparisonId: comparison.id } });
    await prisma.comparisonAttribute.deleteMany({ where: { comparisonId: comparison.id } });

    const leftItem = await prisma.comparisonItem.create({
      data: {
        comparisonId: comparison.id,
        productId: leftProduct.id,
        entityType: comp.comparisonType,
        label: comp.left,
        sortOrder: 0,
      },
    });
    const rightItem = await prisma.comparisonItem.create({
      data: {
        comparisonId: comparison.id,
        productId: rightProduct.id,
        entityType: comp.comparisonType,
        label: comp.right,
        sortOrder: 1,
      },
    });

    const attrs = [
      { key: 'price', label: 'Price / cost', left: 'Mid-range', right: 'Competitive', valueType: 'text' },
      { key: 'quality', label: 'Quality', left: 4.2, right: 4.0, valueType: 'rating' },
      { key: 'value', label: 'Value for money', left: 4.1, right: 4.3, valueType: 'rating' },
      { key: 'availability', label: 'Availability', left: 'Nationwide', right: 'Metro + online', valueType: 'text' },
    ];

    for (const [idx, attr] of attrs.entries()) {
      const row = await prisma.comparisonAttribute.create({
        data: {
          comparisonId: comparison.id,
          key: attr.key,
          label: attr.label,
          valueType: attr.valueType,
          values: [attr.left, attr.right],
          sortOrder: idx,
        },
      });
      await prisma.comparisonValue.createMany({
        data: [
          { comparisonItemId: leftItem.id, comparisonAttributeId: row.id, value: attr.left },
          { comparisonItemId: rightItem.id, comparisonAttributeId: row.id, value: attr.right },
        ],
      });
    }
  }

  for (const review of REVIEW_SEEDS) {
    const product = await prisma.product.upsert({
      where: { slug: `${review.slug}-product` },
      update: { name: review.title, category: review.category },
      create: { name: review.title, slug: `${review.slug}-product`, category: review.category },
    });

    const row = await prisma.review.upsert({
      where: { slug: review.slug },
      update: {
        title: review.title,
        summary: `Editorial roundup and buying advice for ${review.title.toLowerCase()}.`,
        body: `## Overview\n\n${review.title} — our editorial team tested and compared popular options available in India.\n\n## What we looked for\n\nBuild quality, value, warranty, and real-world usability for Indian conditions.\n\n## Verdict\n\nSee scores and pros/cons below before you buy.`,
        verdict: 'Solid options exist across budgets — match features to your actual use case.',
        recommendation: 'editors_choice',
        reviewType: 'editorial',
        entityType: 'product',
        overallScore: review.score,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        productId: product.id,
        authorId: editor.id,
        deletedAt: null,
      },
      create: {
        title: review.title,
        slug: review.slug,
        summary: `Editorial roundup and buying advice for ${review.title.toLowerCase()}.`,
        body: `## Overview\n\n${review.title} — our editorial team tested and compared popular options available in India.\n\n## What we looked for\n\nBuild quality, value, warranty, and real-world usability for Indian conditions.\n\n## Verdict\n\nSee scores and pros/cons below before you buy.`,
        verdict: 'Solid options exist across budgets — match features to your actual use case.',
        recommendation: 'editors_choice',
        reviewType: 'editorial',
        entityType: 'product',
        overallScore: review.score,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        productId: product.id,
        authorId: editor.id,
      },
    });

    await prisma.reviewScore.deleteMany({ where: { reviewId: row.id } });
    await prisma.reviewPro.deleteMany({ where: { reviewId: row.id } });
    await prisma.reviewCon.deleteMany({ where: { reviewId: row.id } });

    await prisma.reviewScore.createMany({
      data: [
        { reviewId: row.id, label: 'Value', score: review.score },
        { reviewId: row.id, label: 'Quality', score: Math.min(5, review.score + 0.1) },
        { reviewId: row.id, label: 'Support', score: Math.max(3.5, review.score - 0.2) },
      ],
    });
    await prisma.reviewPro.createMany({
      data: [
        { reviewId: row.id, text: 'Good availability in major cities' },
        { reviewId: row.id, text: 'Competitive pricing for the segment' },
      ],
    });
    await prisma.reviewCon.createMany({
      data: [
        { reviewId: row.id, text: 'Premium variants can be expensive' },
        { reviewId: row.id, text: 'Check warranty terms before purchase' },
      ],
    });
  }

  const legalPages = [
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: `We respect your privacy. This policy explains what we collect, why we collect it, and how you can control your data on Varnarc.

## Information we collect

- Account details when you sign in (name, email)
- Usage data such as pages visited and calculator inputs you choose to save
- Newsletter email if you subscribe
- Contact form messages you send us

## How we use information

- Operate calculators, guides, and personalization features
- Improve content and product experience
- Send newsletters only if you opt in
- Respond to support requests

## Cookies and analytics

We may use cookies and privacy-friendly analytics to understand traffic and improve performance. You can control cookies in your browser settings.

## Data sharing

We do not sell personal data. We use trusted processors (hosting, email, analytics) under contractual safeguards.

## Your rights

You may request access, correction, or deletion of personal data by contacting us via the Contact page.

## Updates

We may update this policy. Material changes will be reflected on this page with a revised date.`,
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      content: `By using Varnarc you agree to these terms.

## Use of the platform

Varnarc provides calculators, articles, comparisons, and directory listings for general information. You must not misuse the site, attempt unauthorized access, or scrape content at scale without permission.

## Not financial or professional advice

Calculator results and articles are estimates and educational content only. They are not legal, tax, medical, engineering, or investment advice. Verify all figures with qualified professionals and official sources before making decisions.

## Accounts

You are responsible for activity under your account. Keep credentials secure and notify us of suspected compromise.

## Intellectual property

Varnarc content, branding, and software are protected. You may share links and quote short excerpts with attribution. Do not republish full articles or tools as your own product.

## Third-party links

We link to external sites and may show affiliate or sponsored placements. We are not responsible for third-party content or offers.

## Limitation of liability

To the fullest extent permitted by law, Varnarc is not liable for indirect or consequential damages arising from use of the platform.

## Contact

Questions about these terms: use the Contact page.`,
    },
    {
      slug: 'disclaimer',
      title: 'Disclaimer',
      content: `## General disclaimer

Varnarc publishes calculators, guides, reviews, and comparisons to help users research finance, construction, automobiles, and related topics. All content is provided **as is** for general information.

## No warranty

We strive for accuracy but do not guarantee completeness, timeliness, or fitness for a particular purpose. Rates, prices, regulations, and product specifications change frequently.

## Professional advice

Always consult licensed professionals — bankers, CAs, architects, engineers, insurers, or mechanics — before committing to loans, construction, purchases, or investments.

## Affiliate and advertising

Some pages include affiliate links or sponsored placements. This may influence placement but not our commitment to explain trade-offs clearly.

## User responsibility

You are solely responsible for decisions made using information on this site.`,
    },
  ];

  for (const page of legalPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content: page.content,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        deletedAt: null,
      },
      create: {
        title: page.title,
        slug: page.slug,
        content: page.content,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  await reassignArticleCategories(prisma, categoryIds);
  await seedCalculatorArticles(prisma, editor.id);

  return { editorId: editor.id };
}
