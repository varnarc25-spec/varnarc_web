import { BusinessStatus, PrismaClient, UserStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ROLE_DEFINITIONS, PERMISSIONS } from '@varnarc/auth';
import { seedContent } from './seed-content';
import { enrichExistingCalculators, seedExtendedCalculators } from './seed-calculators';
import { seedAiOps } from './seed-ai';
import { seedHomepage } from './seed-homepage';
import { seedNewsletter } from './seed-newsletter';
import { seedPremiumPlans } from './seed-premium';
import { seedExpandedComparisons } from './seed-comparisons-expanded';

const prisma = new PrismaClient();

async function seedMenu(
  slug: string,
  name: string,
  location: string,
  items: Array<{ label: string; href: string }>,
) {
  await prisma.menu.updateMany({
    where: { location, slug: { not: slug }, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  const menu = await prisma.menu.upsert({
    where: { slug },
    update: { name, location, deletedAt: null },
    create: { slug, name, location },
  });

  await prisma.menuItem.updateMany({
    where: { menuId: menu.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  for (const [index, item] of items.entries()) {
    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        label: item.label,
        href: item.href,
        sortOrder: index,
      },
    });
  }
}

async function main() {
  for (const [slug, def] of Object.entries(ROLE_DEFINITIONS)) {
    await prisma.role.upsert({
      where: { slug },
      update: { name: def.name, description: def.description },
      create: { slug, name: def.name, description: def.description },
    });
  }

  const permissionMeta: Record<string, { name: string; module: string }> = {
    [PERMISSIONS.ARTICLE_CREATE]: { name: 'Create articles', module: 'content' },
    [PERMISSIONS.ARTICLE_EDIT]: { name: 'Edit articles', module: 'content' },
    [PERMISSIONS.ARTICLE_PUBLISH]: { name: 'Publish articles', module: 'content' },
    [PERMISSIONS.ARTICLE_REVIEW]: { name: 'Review articles', module: 'content' },
    [PERMISSIONS.ARTICLE_DELETE]: { name: 'Delete articles', module: 'content' },
    [PERMISSIONS.PAGE_VIEW]: { name: 'View pages', module: 'pages' },
    [PERMISSIONS.PAGE_CREATE]: { name: 'Create pages', module: 'pages' },
    [PERMISSIONS.PAGE_EDIT]: { name: 'Edit pages', module: 'pages' },
    [PERMISSIONS.PAGE_PUBLISH]: { name: 'Publish pages', module: 'pages' },
    [PERMISSIONS.PAGE_REVIEW]: { name: 'Review pages', module: 'pages' },
    [PERMISSIONS.PAGE_DELETE]: { name: 'Delete pages', module: 'pages' },
    [PERMISSIONS.MEDIA_VIEW]: { name: 'View media', module: 'media' },
    [PERMISSIONS.MEDIA_UPLOAD]: { name: 'Upload media', module: 'media' },
    [PERMISSIONS.MEDIA_EDIT]: { name: 'Edit media', module: 'media' },
    [PERMISSIONS.MEDIA_DELETE]: { name: 'Delete media', module: 'media' },
    [PERMISSIONS.MEDIA_READ]: { name: 'Read media', module: 'media' },
    [PERMISSIONS.USER_VIEW]: { name: 'View users', module: 'users' },
    [PERMISSIONS.USER_CREATE]: { name: 'Create users', module: 'users' },
    [PERMISSIONS.USER_UPDATE]: { name: 'Update users', module: 'users' },
    [PERMISSIONS.USER_DELETE]: { name: 'Delete users', module: 'users' },
    [PERMISSIONS.ROLE_VIEW]: { name: 'View roles', module: 'roles' },
    [PERMISSIONS.ROLE_MANAGE]: { name: 'Manage roles', module: 'roles' },
    [PERMISSIONS.ADVERTISEMENT_VIEW]: { name: 'View advertisements', module: 'ads' },
    [PERMISSIONS.ADVERTISEMENT_CREATE]: { name: 'Create advertisements', module: 'ads' },
    [PERMISSIONS.ADVERTISEMENT_EDIT]: { name: 'Edit advertisements', module: 'ads' },
    [PERMISSIONS.ADVERTISEMENT_PUBLISH]: { name: 'Publish advertisements', module: 'ads' },
    [PERMISSIONS.ADVERTISEMENT_DELETE]: { name: 'Delete advertisements', module: 'ads' },
    [PERMISSIONS.ADVERTISEMENT_MANAGE]: { name: 'Manage advertisements', module: 'ads' },
    [PERMISSIONS.HOMEPAGE_MANAGE]: { name: 'Manage homepage', module: 'homepage' },
    [PERMISSIONS.THEME_VIEW]: { name: 'View themes', module: 'theme' },
    [PERMISSIONS.THEME_EDIT]: { name: 'Edit themes', module: 'theme' },
    [PERMISSIONS.THEME_PUBLISH]: { name: 'Publish themes', module: 'theme' },
    [PERMISSIONS.THEME_MANAGE]: { name: 'Manage themes', module: 'theme' },
    [PERMISSIONS.CALCULATOR_VIEW]: { name: 'View calculators', module: 'calculators' },
    [PERMISSIONS.CALCULATOR_CREATE]: { name: 'Create calculators', module: 'calculators' },
    [PERMISSIONS.CALCULATOR_EDIT]: { name: 'Edit calculators', module: 'calculators' },
    [PERMISSIONS.CALCULATOR_PUBLISH]: { name: 'Publish calculators', module: 'calculators' },
    [PERMISSIONS.CALCULATOR_DELETE]: { name: 'Delete calculators', module: 'calculators' },
    [PERMISSIONS.FINANCE_VIEW]: { name: 'View finance', module: 'finance' },
    [PERMISSIONS.FINANCE_CREATE]: { name: 'Create finance products', module: 'finance' },
    [PERMISSIONS.FINANCE_EDIT]: { name: 'Edit finance products', module: 'finance' },
    [PERMISSIONS.FINANCE_PUBLISH]: { name: 'Publish finance products', module: 'finance' },
    [PERMISSIONS.FINANCE_DELETE]: { name: 'Delete finance products', module: 'finance' },
    [PERMISSIONS.CONSTRUCTION_VIEW]: { name: 'View construction', module: 'construction' },
    [PERMISSIONS.CONSTRUCTION_CREATE]: { name: 'Create construction content', module: 'construction' },
    [PERMISSIONS.CONSTRUCTION_EDIT]: { name: 'Edit construction content', module: 'construction' },
    [PERMISSIONS.CONSTRUCTION_PUBLISH]: { name: 'Publish construction content', module: 'construction' },
    [PERMISSIONS.CONSTRUCTION_DELETE]: { name: 'Delete construction content', module: 'construction' },
    [PERMISSIONS.AUTOMOBILE_VIEW]: { name: 'View automobile', module: 'automobile' },
    [PERMISSIONS.AUTOMOBILE_CREATE]: { name: 'Create automobile content', module: 'automobile' },
    [PERMISSIONS.AUTOMOBILE_EDIT]: { name: 'Edit automobile content', module: 'automobile' },
    [PERMISSIONS.AUTOMOBILE_PUBLISH]: { name: 'Publish automobile content', module: 'automobile' },
    [PERMISSIONS.AUTOMOBILE_DELETE]: { name: 'Delete automobile content', module: 'automobile' },
    [PERMISSIONS.REVIEW_VIEW]: { name: 'View reviews', module: 'reviews' },
    [PERMISSIONS.REVIEW_CREATE]: { name: 'Create reviews', module: 'reviews' },
    [PERMISSIONS.REVIEW_EDIT]: { name: 'Edit reviews', module: 'reviews' },
    [PERMISSIONS.REVIEW_PUBLISH]: { name: 'Publish reviews', module: 'reviews' },
    [PERMISSIONS.REVIEW_DELETE]: { name: 'Delete reviews', module: 'reviews' },
    [PERMISSIONS.REVIEW_MODERATE]: { name: 'Moderate user reviews', module: 'reviews' },
    [PERMISSIONS.COMPARISON_VIEW]: { name: 'View comparisons', module: 'comparisons' },
    [PERMISSIONS.COMPARISON_CREATE]: { name: 'Create comparisons', module: 'comparisons' },
    [PERMISSIONS.COMPARISON_EDIT]: { name: 'Edit comparisons', module: 'comparisons' },
    [PERMISSIONS.COMPARISON_PUBLISH]: { name: 'Publish comparisons', module: 'comparisons' },
    [PERMISSIONS.COMPARISON_DELETE]: { name: 'Delete comparisons', module: 'comparisons' },
    [PERMISSIONS.DIRECTORY_VIEW]: { name: 'View directory', module: 'directory' },
    [PERMISSIONS.DIRECTORY_CREATE]: { name: 'Create directory listings', module: 'directory' },
    [PERMISSIONS.DIRECTORY_EDIT]: { name: 'Edit directory listings', module: 'directory' },
    [PERMISSIONS.DIRECTORY_PUBLISH]: { name: 'Publish directory listings', module: 'directory' },
    [PERMISSIONS.DIRECTORY_DELETE]: { name: 'Delete directory listings', module: 'directory' },
    [PERMISSIONS.DIRECTORY_VERIFY]: { name: 'Verify directory listings', module: 'directory' },
    [PERMISSIONS.AI_TOOLS_VIEW]: { name: 'View AI tools', module: 'ai-tools' },
    [PERMISSIONS.AI_TOOLS_CREATE]: { name: 'Create AI tools', module: 'ai-tools' },
    [PERMISSIONS.AI_TOOLS_EDIT]: { name: 'Edit AI tools', module: 'ai-tools' },
    [PERMISSIONS.AI_TOOLS_PUBLISH]: { name: 'Publish AI tools', module: 'ai-tools' },
    [PERMISSIONS.AI_TOOLS_DELETE]: { name: 'Delete AI tools', module: 'ai-tools' },
    [PERMISSIONS.AI_OPS_VIEW]: { name: 'View AI operations', module: 'ai-ops' },
    [PERMISSIONS.AI_OPS_MANAGE]: { name: 'Manage AI operations', module: 'ai-ops' },
    [PERMISSIONS.SEARCH_VIEW]: { name: 'View search index', module: 'search' },
    [PERMISSIONS.SEARCH_REINDEX]: { name: 'Reindex search', module: 'search' },
    [PERMISSIONS.SEARCH_ANALYTICS]: { name: 'View search analytics', module: 'search' },
    [PERMISSIONS.ANALYTICS_VIEW]: { name: 'View analytics', module: 'analytics' },
    [PERMISSIONS.ANALYTICS_EXPORT]: { name: 'Export analytics', module: 'analytics' },
    [PERMISSIONS.ANALYTICS_ADMIN]: { name: 'Administer analytics', module: 'analytics' },
    [PERMISSIONS.SEO_VIEW]: { name: 'View SEO', module: 'seo' },
    [PERMISSIONS.SEO_EDIT]: { name: 'Edit SEO metadata', module: 'seo' },
    [PERMISSIONS.SEO_AUDIT]: { name: 'Run SEO audits', module: 'seo' },
    [PERMISSIONS.SEO_REDIRECTS]: { name: 'Manage SEO redirects', module: 'seo' },
    [PERMISSIONS.NOTIFICATIONS_VIEW]: { name: 'View notifications', module: 'notifications' },
    [PERMISSIONS.NOTIFICATIONS_MANAGE]: { name: 'Manage notifications', module: 'notifications' },
    [PERMISSIONS.AUDIT_VIEW]: { name: 'View audit logs', module: 'audit' },
    [PERMISSIONS.SECURITY_VIEW]: { name: 'View security center', module: 'security' },
    [PERMISSIONS.SECURITY_MANAGE]: { name: 'Manage security operations', module: 'security' },
    [PERMISSIONS.SETTINGS_MANAGE]: { name: 'Manage settings', module: 'settings' },
    [PERMISSIONS.API_VIEW]: { name: 'View API console', module: 'api' },
    [PERMISSIONS.API_MANAGE]: { name: 'Manage API keys and webhooks', module: 'api' },
    [PERMISSIONS.PREMIUM_VIEW]: { name: 'View premium billing', module: 'premium' },
    [PERMISSIONS.PREMIUM_MANAGE]: { name: 'Manage premium plans and subscriptions', module: 'premium' },
    [PERMISSIONS.MENU_MANAGE]: { name: 'Manage menus', module: 'menus' },
    [PERMISSIONS.REPORTS_EXPORT]: { name: 'Export reports', module: 'reports' },
  };

  for (const [slug, meta] of Object.entries(permissionMeta)) {
    await prisma.permission.upsert({
      where: { slug },
      update: { name: meta.name, module: meta.module },
      create: { slug, name: meta.name, module: meta.module },
    });
  }

  for (const [slug, def] of Object.entries(ROLE_DEFINITIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { slug } });
    for (const permissionSlug of def.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { slug: permissionSlug },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  await prisma.language.upsert({
    where: { code: 'en' },
    update: { name: 'English', isDefault: true, isActive: true },
    create: { code: 'en', name: 'English', isDefault: true, isActive: true },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'premium.enabled' },
    update: { name: 'Premium features', enabled: false },
    create: {
      key: 'premium.enabled',
      name: 'Premium features',
      description: 'Gate premium plans and billing UI',
      enabled: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'search.ai.enabled' },
    update: { name: 'AI search', enabled: true },
    create: {
      key: 'search.ai.enabled',
      name: 'AI search',
      description: 'Natural-language search on the public search page',
      enabled: true,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'comments.auto-moderation.enabled' },
    update: { name: 'Comment auto-moderation', enabled: true },
    create: {
      key: 'comments.auto-moderation.enabled',
      name: 'Comment auto-moderation',
      description: 'Route suspicious comments to REVIEW status',
      enabled: true,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'settings.general' },
    update: {},
    create: {
      key: 'settings.general',
      group: 'general',
      value: {
        siteName: 'Varnarc',
        siteTagline: 'Smart Tools & Expert Guides',
        timezone: 'UTC',
        locale: 'en',
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'settings.maintenance' },
    update: {},
    create: {
      key: 'settings.maintenance',
      group: 'maintenance',
      value: {
        enabled: false,
        readOnly: false,
        message: 'We are performing scheduled maintenance. Please check back soon.',
        allowedIps: [],
        bypassRoles: ['admin', 'super_admin'],
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'settings.security' },
    update: {},
    create: {
      key: 'settings.security',
      group: 'security',
      value: {
        rateLimitPerMinute: 120,
        cspEnabled: false,
        cspReportOnly: true,
        apiKeyRequired: false,
        passwordMinLength: 8,
        corsOrigins: [],
        allowedOrigins: [],
      },
    },
  });

  await prisma.theme.upsert({
    where: { slug: 'default' },
    update: {
      name: 'Default',
      description: 'Default Varnarc brand theme',
      isDefault: true,
      isSystem: true,
      marketplaceListed: true,
      branding: {
        siteName: 'Varnarc',
        siteTagline: 'Smart Tools & Expert Guides',
      },
      colors: {
        light: {
          primary: '#0b1f3a',
          secondary: '#64748b',
          accent: '#f97316',
          background: '#f7f8fb',
          surface: '#ffffff',
          border: '#e2e8f0',
          textPrimary: '#0b1f3a',
          textSecondary: '#475569',
          footer: '#071428',
        },
        dark: {
          primary: '#60a5fa',
          accent: '#f97316',
          background: '#0f1720',
          surface: '#16202b',
          border: '#2a394a',
          textPrimary: '#e8eef5',
          textSecondary: '#9aa8ba',
          footer: '#020617',
        },
      },
      fonts: {
        body: 'DM Sans',
        heading: 'Fraunces',
        baseSize: '16px',
        googleFonts: ['DM Sans', 'Fraunces'],
      },
      tokens: {
        layout: {
          containerWidth: '80%',
          cardRadius: '0.5rem',
          headerStyle: 'solid',
          footerStyle: 'columns',
        },
        navigation: { stickyHeader: true, breadcrumbs: true, mobileNav: 'drawer' },
        footer: {
          layout: 'columns',
          columns: 4,
          copyright: '© Varnarc. All rights reserved.',
          newsletterEnabled: true,
        },
      },
    },
    create: {
      slug: 'default',
      name: 'Default',
      description: 'Default Varnarc brand theme',
      isDefault: true,
      isSystem: true,
      marketplaceListed: true,
      branding: {
        siteName: 'Varnarc',
        siteTagline: 'Smart Tools & Expert Guides',
      },
      colors: {
        light: {
          primary: '#0b1f3a',
          secondary: '#64748b',
          accent: '#f97316',
          background: '#f7f8fb',
          surface: '#ffffff',
          border: '#e2e8f0',
          textPrimary: '#0b1f3a',
          textSecondary: '#475569',
          footer: '#071428',
        },
        dark: {
          primary: '#60a5fa',
          accent: '#f97316',
          background: '#0f1720',
          surface: '#16202b',
          border: '#2a394a',
          textPrimary: '#e8eef5',
          textSecondary: '#9aa8ba',
          footer: '#020617',
        },
      },
      fonts: {
        body: 'DM Sans',
        heading: 'Fraunces',
        baseSize: '16px',
        googleFonts: ['DM Sans', 'Fraunces'],
      },
      tokens: {
        layout: {
          containerWidth: '80%',
          cardRadius: '0.5rem',
          headerStyle: 'solid',
          footerStyle: 'columns',
        },
        navigation: { stickyHeader: true, breadcrumbs: true, mobileNav: 'drawer' },
        footer: {
          layout: 'columns',
          columns: 4,
          copyright: '© Varnarc. All rights reserved.',
          newsletterEnabled: true,
        },
      },
    },
  });

  for (const preset of [
    { slug: 'light', name: 'Light', description: 'Bright light preset' },
    { slug: 'dark', name: 'Dark', description: 'Dark mode focused preset' },
    { slug: 'modern', name: 'Modern', description: 'Modern accent-forward preset' },
    { slug: 'corporate', name: 'Corporate', description: 'Conservative corporate palette' },
    { slug: 'minimal', name: 'Minimal', description: 'Minimal grayscale palette' },
  ] as const) {
    await prisma.theme.upsert({
      where: { slug: preset.slug },
      update: { name: preset.name, description: preset.description },
      create: {
        slug: preset.slug,
        name: preset.name,
        description: preset.description,
        isDefault: false,
        tokens: { layout: { cardRadius: '0.5rem' } },
        colors: {
          light: {
            primary: preset.slug === 'corporate' ? '#1e3a5f' : '#0b1f3a',
            accent: preset.slug === 'modern' ? '#f97316' : '#64748b',
            background: '#ffffff',
            surface: '#ffffff',
            textPrimary: '#0f172a',
            textSecondary: '#64748b',
            border: '#e2e8f0',
          },
          dark: {
            primary: '#93c5fd',
            accent: '#fb923c',
            background: '#0b1220',
            surface: '#111827',
            textPrimary: '#f8fafc',
            textSecondary: '#94a3b8',
            border: '#1f2937',
          },
        },
        fonts: { body: 'DM Sans', heading: 'Fraunces' },
        branding: { siteName: 'Varnarc', siteTagline: preset.description },
      },
    });
  }
  const defaultPlacements = [
    { slug: 'header', name: 'Header', location: 'global' },
    { slug: 'footer', name: 'Footer', location: 'global' },
    { slug: 'sidebar', name: 'Sidebar', location: 'global' },
    { slug: 'sticky-sidebar', name: 'Sticky Sidebar', location: 'global' },
    { slug: 'floating-banner', name: 'Floating Banner', location: 'global' },
    { slug: 'hero-banner', name: 'Hero Banner', location: 'homepage' },
    { slug: 'after-hero', name: 'After Hero', location: 'homepage' },
    { slug: 'content-top', name: 'Content Top', location: 'content' },
    { slug: 'article-sidebar', name: 'Article Sidebar', location: 'articles' },
    { slug: 'article-end', name: 'End of Article', location: 'articles' },
    { slug: 'calculator-bottom', name: 'Below Calculator Results', location: 'calculators' },
    { slug: 'calculator-sidebar', name: 'Calculator Sidebar', location: 'calculators' },
    { slug: 'search-banner', name: 'Search Results Banner', location: 'search' },
    { slug: '404-cta', name: '404 Promotional CTA', location: 'errors' },
  ];

  for (const placement of defaultPlacements) {
    await prisma.adPlacement.upsert({
      where: { slug: placement.slug },
      update: {
        name: placement.name,
        location: placement.location,
        deletedAt: null,
      },
      create: placement,
    });
  }

  const calcCategories = [
    { slug: 'finance', name: 'Finance', sortOrder: 1, description: 'Loans, investments, and tax tools' },
    { slug: 'construction', name: 'Construction', sortOrder: 2, description: 'Building material estimators' },
    { slug: 'automobile', name: 'Automobile', sortOrder: 3, description: 'Vehicle cost and loan tools' },
    { slug: 'general', name: 'General', sortOrder: 4, description: 'Everyday utility calculators' },
  ];

  for (const cat of calcCategories) {
    await prisma.calculatorCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder, deletedAt: null },
      create: cat,
    });
  }

  const finance = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'finance' } });
  const construction = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'construction' } });
  const automobile = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'automobile' } });
  const general = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'general' } });

  type FieldSeed = {
    key: string;
    label: string;
    fieldType: string;
    sortOrder: number;
    required?: boolean;
    defaultValue?: string;
    validation?: object;
  };

  async function upsertCalculator(input: {
    slug: string;
    name: string;
    description: string;
    categoryId: string;
    formula: object;
    resultTemplate: object;
    settings?: object;
    seoTitle?: string;
    seoDescription?: string;
    fields: FieldSeed[];
  }) {
    const formula = JSON.stringify(input.formula);
    const row = await prisma.calculator.upsert({
      where: { slug: input.slug },
      update: {
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        formula,
        resultTemplate: input.resultTemplate,
        settings: input.settings ?? undefined,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        deletedAt: null,
      },
      create: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        formula,
        resultTemplate: input.resultTemplate,
        settings: input.settings ?? undefined,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await prisma.calculatorField.deleteMany({
      where: { calculatorId: row.id },
    });
    for (const f of input.fields) {
      await prisma.calculatorField.create({
        data: {
          calculatorId: row.id,
          key: f.key,
          label: f.label,
          fieldType: f.fieldType,
          sortOrder: f.sortOrder,
          required: f.required ?? true,
          defaultValue: f.defaultValue ?? null,
          validation: (f.validation as never) ?? undefined,
        },
      });
    }
    return row;
  }

  // Slugs match homepage / finance / construction / automobile links
  await upsertCalculator({
    slug: 'emi',
    name: 'EMI Calculator',
    description: 'Estimate monthly EMI, total payment, and interest for a loan.',
    categoryId: finance.id,
    seoTitle: 'EMI Calculator | Varnarc',
    seoDescription: 'Calculate loan EMI instantly.',
    formula: {
      outputs: {
        principal: 'principal',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'emi', label: 'Monthly EMI', format: 'currency' },
        { key: 'totalPayment', label: 'Total Payment', format: 'currency' },
        { key: 'totalInterest', label: 'Total Interest', format: 'currency' },
      ],
      table: {
        title: 'Payment summary',
        rows: [
          { label: 'Monthly EMI', key: 'emi', format: 'currency' },
          { label: 'Total payment', key: 'totalPayment', format: 'currency' },
          { label: 'Total interest', key: 'totalInterest', format: 'currency' },
        ],
      },
      chart: {
        title: 'Principal vs interest',
        keys: ['principal', 'totalInterest'],
        labels: { principal: 'Principal', totalInterest: 'Interest' },
      },
      breakdown: {
        title: 'Breakdown',
        items: [
          { label: 'EMI', key: 'emi', format: 'currency' },
          { label: 'Interest', key: 'totalInterest', format: 'currency' },
        ],
      },
      recommendations: true,
    },
    settings: {
      mode: 'wizard',
      steps: [
        { title: 'Loan amount', fields: ['principal'] },
        { title: 'Rate & tenure', fields: ['annualRate', 'tenureMonths'] },
      ],
      faq: [
        { q: 'What is EMI?', a: 'Equated Monthly Installment is the fixed payment you make each month.' },
        { q: 'Does this include fees?', a: 'This estimate excludes processing fees and insurance.' },
      ],
    },
    fields: [
      { key: 'principal', label: 'Loan amount', fieldType: 'currency', sortOrder: 0, defaultValue: '500000' },
      { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '8.5' },
      {
        key: 'tenureMonths',
        label: 'Tenure (months)',
        fieldType: 'slider',
        sortOrder: 2,
        defaultValue: '60',
        validation: { min: 6, max: 360, step: 6 },
      },
    ],
  });

  await upsertCalculator({
    slug: 'loan',
    name: 'Loan Calculator',
    description: 'Calculate EMI, total interest, and repayment for any loan type.',
    categoryId: finance.id,
    seoTitle: 'Loan Calculator | Varnarc',
    seoDescription: 'Estimate monthly EMI and total interest for home, personal, car, or education loans.',
    formula: {
      outputs: {
        principal: 'principal',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'emi', label: 'Monthly EMI', format: 'currency' },
        { key: 'totalPayment', label: 'Total payment', format: 'currency' },
        { key: 'totalInterest', label: 'Total interest', format: 'currency' },
      ],
      table: {
        title: 'Repayment summary',
        rows: [
          { label: 'Monthly EMI', key: 'emi', format: 'currency' },
          { label: 'Total payment', key: 'totalPayment', format: 'currency' },
          { label: 'Total interest', key: 'totalInterest', format: 'currency' },
        ],
      },
      chart: {
        title: 'Principal vs interest',
        type: 'donut',
        keys: ['principal', 'totalInterest'],
        labels: { principal: 'Principal', totalInterest: 'Interest' },
      },
    },
    settings: {
      relatedArticles: {
        topicField: 'loanType',
        topicCategorySlugs: {
          home: 'home-loans',
          personal: 'personal-loans',
          car: 'car-loans',
          education: 'education-loans',
        },
      },
      faq: [
        { q: 'Which loans does this cover?', a: 'Use it for home, personal, car, or education loans — adjust rate and tenure to match your offer.' },
        { q: 'Are fees included?', a: 'Processing fees, insurance, and GST are excluded from this estimate.' },
      ],
    },
    fields: [
      {
        key: 'loanType',
        label: 'Loan type',
        fieldType: 'select',
        sortOrder: 0,
        defaultValue: 'home',
        validation: { options: ['home', 'personal', 'car', 'education'] },
      },
      { key: 'principal', label: 'Loan amount', fieldType: 'currency', sortOrder: 1, defaultValue: '2500000' },
      { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 2, defaultValue: '8.75' },
      {
        key: 'tenureMonths',
        label: 'Tenure (months)',
        fieldType: 'slider',
        sortOrder: 3,
        defaultValue: '240',
        validation: { min: 6, max: 360, step: 6 },
      },
    ],
  });

  await upsertCalculator({
    slug: 'sip',
    name: 'SIP Calculator',
    description: 'Project mutual fund wealth from a monthly SIP.',
    categoryId: finance.id,
    seoTitle: 'SIP Calculator | Varnarc',
    seoDescription: 'Estimate SIP returns and maturity amount.',
    formula: {
      outputs: {
        monthlyRate: 'expectedReturn / 12 / 100',
        months: 'years * 12',
        invested: 'monthlyInvestment * months',
        maturity: 'monthlyInvestment * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
        gains: 'maturity - invested',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maturity', label: 'Maturity value', format: 'currency' },
        { key: 'invested', label: 'Total invested', format: 'currency' },
        { key: 'gains', label: 'Estimated gains', format: 'currency' },
      ],
      table: {
        title: 'SIP summary',
        rows: [
          { label: 'Maturity value', key: 'maturity', format: 'currency' },
          { label: 'Total invested', key: 'invested', format: 'currency' },
          { label: 'Estimated gains', key: 'gains', format: 'currency' },
        ],
      },
      chart: {
        title: 'Invested vs gains',
        keys: ['invested', 'gains'],
        labels: { invested: 'Invested', gains: 'Gains' },
      },
      breakdown: {
        title: 'Breakdown',
        items: [
          { label: 'Maturity', key: 'maturity', format: 'currency' },
          { label: 'Gains', key: 'gains', format: 'currency' },
        ],
      },
      recommendations: true,
    },
    settings: {
      faq: [
        { q: 'What is SIP?', a: 'A Systematic Investment Plan invests a fixed amount every month into a mutual fund.' },
        { q: 'Is the return guaranteed?', a: 'No. Expected return is an assumption for estimation only.' },
      ],
    },
    fields: [
      { key: 'monthlyInvestment', label: 'Monthly investment', fieldType: 'currency', sortOrder: 0, defaultValue: '5000' },
      { key: 'expectedReturn', label: 'Expected return (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '12' },
      {
        key: 'years',
        label: 'Investment period (years)',
        fieldType: 'slider',
        sortOrder: 2,
        defaultValue: '10',
        validation: { min: 1, max: 40, step: 1 },
      },
    ],
  });

  await upsertCalculator({
    slug: 'income-tax',
    name: 'Income Tax Calculator',
    description: 'Quick tax estimate using a simplified new-regime style slab.',
    categoryId: finance.id,
    formula: {
      type: 'rules',
      rules: [
        { when: 'income <= 300000', outputs: { tax: '0', taxable: 'income' } },
        {
          when: 'income <= 700000',
          outputs: { tax: '(income - 300000) * 0.05', taxable: 'income' },
        },
        {
          when: 'income <= 1000000',
          outputs: { tax: '20000 + (income - 700000) * 0.10', taxable: 'income' },
        },
        {
          when: 'income <= 1200000',
          outputs: { tax: '50000 + (income - 1000000) * 0.15', taxable: 'income' },
        },
        {
          when: 'income <= 1500000',
          outputs: { tax: '80000 + (income - 1200000) * 0.20', taxable: 'income' },
        },
      ],
      outputs: { tax: '140000 + (income - 1500000) * 0.30', taxable: 'income' },
    },
    resultTemplate: {
      cards: [
        { key: 'tax', label: 'Estimated tax', format: 'currency' },
        { key: 'taxable', label: 'Taxable income', format: 'currency' },
      ],
    },
    fields: [
      { key: 'income', label: 'Annual taxable income', fieldType: 'currency', sortOrder: 0, defaultValue: '900000' },
    ],
  });

  await upsertCalculator({
    slug: 'gst',
    name: 'GST Calculator',
    description: 'Add or remove GST from an amount.',
    categoryId: finance.id,
    formula: {
      outputs: {
        gstAmount: 'amount * gstRate / 100',
        totalInclusive: 'amount + gstAmount',
        amountExclusive: 'amount / (1 + gstRate / 100)',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'gstAmount', label: 'GST amount', format: 'currency' },
        { key: 'totalInclusive', label: 'Total (inclusive)', format: 'currency' },
        { key: 'amountExclusive', label: 'Base (if amount includes GST)', format: 'currency' },
      ],
    },
    fields: [
      { key: 'amount', label: 'Amount', fieldType: 'currency', sortOrder: 0, defaultValue: '1000' },
      { key: 'gstRate', label: 'GST rate (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '18' },
    ],
  });

  await upsertCalculator({
    slug: 'retirement',
    name: 'Retirement Calculator',
    description: 'Estimate corpus needed and projected savings.',
    categoryId: finance.id,
    formula: {
      outputs: {
        yearsToRetire: 'max(retirementAge - currentAge, 1)',
        months: 'yearsToRetire * 12',
        monthlyRate: 'expectedReturn / 12 / 100',
        corpusNeeded: 'monthlyExpense * 12 * 25',
        projectedCorpus:
          'currentSavings * pow(1 + expectedReturn / 100, yearsToRetire) + monthlySip * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
        shortfall: 'max(corpusNeeded - projectedCorpus, 0)',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'corpusNeeded', label: 'Corpus needed', format: 'currency' },
        { key: 'projectedCorpus', label: 'Projected corpus', format: 'currency' },
        { key: 'shortfall', label: 'Shortfall', format: 'currency' },
      ],
    },
    fields: [
      { key: 'currentAge', label: 'Current age', fieldType: 'number', sortOrder: 0, defaultValue: '30' },
      { key: 'retirementAge', label: 'Retirement age', fieldType: 'number', sortOrder: 1, defaultValue: '60' },
      { key: 'monthlyExpense', label: 'Monthly expense today', fieldType: 'currency', sortOrder: 2, defaultValue: '50000' },
      { key: 'currentSavings', label: 'Current savings', fieldType: 'currency', sortOrder: 3, defaultValue: '500000' },
      { key: 'monthlySip', label: 'Monthly SIP', fieldType: 'currency', sortOrder: 4, defaultValue: '10000' },
      { key: 'expectedReturn', label: 'Expected return (% p.a.)', fieldType: 'percentage', sortOrder: 5, defaultValue: '10' },
    ],
  });

  await upsertCalculator({
    slug: 'paint',
    name: 'Paint Calculator',
    description: 'Estimate paint required for a room.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * width',
        litres: 'area / coveragePerLitre * coats',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Area (sq units)', format: 'number' },
        { key: 'litres', label: 'Paint needed (L)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length', fieldType: 'number', sortOrder: 0, defaultValue: '12' },
      { key: 'width', label: 'Width', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'coats', label: 'Coats', fieldType: 'number', sortOrder: 2, defaultValue: '2' },
      { key: 'coveragePerLitre', label: 'Coverage per litre', fieldType: 'number', sortOrder: 3, defaultValue: '10' },
    ],
  });

  await upsertCalculator({
    slug: 'construction-cost',
    name: 'Construction Cost Calculator',
    description: 'Estimate build cost from area and rate per sq ft.',
    categoryId: construction.id,
    formula: {
      outputs: {
        baseCost: 'area * costPerSqft',
        contingency: 'baseCost * contingencyPercent / 100',
        totalCost: 'baseCost + contingency',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'baseCost', label: 'Base cost', format: 'currency' },
        { key: 'contingency', label: 'Contingency', format: 'currency' },
        { key: 'totalCost', label: 'Total estimate', format: 'currency' },
      ],
    },
    fields: [
      { key: 'area', label: 'Built-up area (sq ft)', fieldType: 'number', sortOrder: 0, defaultValue: '1200' },
      { key: 'costPerSqft', label: 'Cost per sq ft', fieldType: 'currency', sortOrder: 1, defaultValue: '1800' },
      { key: 'contingencyPercent', label: 'Contingency (%)', fieldType: 'percentage', sortOrder: 2, defaultValue: '10' },
    ],
  });

  await upsertCalculator({
    slug: 'cement',
    name: 'Cement Calculator',
    description: 'Estimate cement bags required for concrete or plaster work.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volume: 'length * width * thickness / 12',
        bags: 'volume * bagsPerCubicFt',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volume', label: 'Volume (cu ft)', format: 'number' },
        { key: 'bags', label: 'Cement bags', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '10' },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'thickness', label: 'Thickness (in)', fieldType: 'number', sortOrder: 2, defaultValue: '4' },
      { key: 'bagsPerCubicFt', label: 'Bags per cu ft', fieldType: 'number', sortOrder: 3, defaultValue: '1.25' },
    ],
  });

  await upsertCalculator({
    slug: 'concrete',
    name: 'Concrete Calculator',
    description: 'Estimate concrete volume for slabs, footings, and columns.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volumeCuFt: 'length * width * depth / 12',
        volumeCuM: 'volumeCuFt / 35.3147',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volumeCuFt', label: 'Volume (cu ft)', format: 'number' },
        { key: 'volumeCuM', label: 'Volume (cu m)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '20' },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'depth', label: 'Depth (in)', fieldType: 'number', sortOrder: 2, defaultValue: '6' },
    ],
  });

  await upsertCalculator({
    slug: 'sand',
    name: 'Sand Calculator',
    description: 'Estimate sand quantity for concrete or plaster mixes.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volume: 'length * width * thickness / 12',
        sandCuFt: 'volume * sandRatio',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volume', label: 'Mix volume (cu ft)', format: 'number' },
        { key: 'sandCuFt', label: 'Sand needed (cu ft)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '10' },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'thickness', label: 'Thickness (in)', fieldType: 'number', sortOrder: 2, defaultValue: '4' },
      { key: 'sandRatio', label: 'Sand share of mix', fieldType: 'number', sortOrder: 3, defaultValue: '0.4' },
    ],
  });

  await upsertCalculator({
    slug: 'aggregate',
    name: 'Aggregate Calculator',
    description: 'Estimate coarse aggregate for RCC concrete mixes.',
    categoryId: construction.id,
    formula: {
      outputs: {
        volume: 'length * width * depth / 12',
        aggregateCuFt: 'volume * aggregateRatio',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'volume', label: 'Concrete volume (cu ft)', format: 'number' },
        { key: 'aggregateCuFt', label: 'Aggregate (cu ft)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '20' },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'depth', label: 'Depth (in)', fieldType: 'number', sortOrder: 2, defaultValue: '6' },
      { key: 'aggregateRatio', label: 'Aggregate share of mix', fieldType: 'number', sortOrder: 3, defaultValue: '0.55' },
    ],
  });

  await upsertCalculator({
    slug: 'plaster',
    name: 'Plaster Calculator',
    description: 'Estimate plaster area and material for walls and ceilings.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * height',
        plasterCuFt: 'area * thickness / 12',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Surface area (sq ft)', format: 'number' },
        { key: 'plasterCuFt', label: 'Plaster volume (cu ft)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Wall length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '40' },
      { key: 'height', label: 'Wall height (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'thickness', label: 'Plaster thickness (in)', fieldType: 'number', sortOrder: 2, defaultValue: '0.5' },
    ],
  });

  await upsertCalculator({
    slug: 'brick',
    name: 'Brick Calculator',
    description: 'Estimate brick count for wall construction.',
    categoryId: construction.id,
    formula: {
      outputs: {
        wallArea: 'length * height',
        bricks: 'wallArea * bricksPerSqft',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'wallArea', label: 'Wall area (sq ft)', format: 'number' },
        { key: 'bricks', label: 'Bricks required', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Wall length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '30' },
      { key: 'height', label: 'Wall height (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'bricksPerSqft', label: 'Bricks per sq ft', fieldType: 'number', sortOrder: 2, defaultValue: '8' },
    ],
  });

  await upsertCalculator({
    slug: 'steel',
    name: 'Steel Calculator',
    description: 'Estimate TMT steel weight for RCC beams and columns.',
    categoryId: construction.id,
    formula: {
      outputs: {
        totalLength: 'bars * barLength',
        weightKg: 'totalLength * weightPerMeter',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'totalLength', label: 'Total bar length (m)', format: 'number' },
        { key: 'weightKg', label: 'Steel weight (kg)', format: 'number' },
      ],
    },
    fields: [
      { key: 'bars', label: 'Number of bars', fieldType: 'number', sortOrder: 0, defaultValue: '20' },
      { key: 'barLength', label: 'Bar length (m)', fieldType: 'number', sortOrder: 1, defaultValue: '12' },
      { key: 'weightPerMeter', label: 'Weight per meter (kg)', fieldType: 'number', sortOrder: 2, defaultValue: '0.89' },
    ],
  });

  await upsertCalculator({
    slug: 'tile',
    name: 'Tile Calculator',
    description: 'Estimate floor or wall tiles including wastage.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * width',
        tilesWithWastage: 'area * (1 + wastagePercent / 100) / tileArea',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Area (sq ft)', format: 'number' },
        { key: 'tilesWithWastage', label: 'Tiles (with wastage)', format: 'number' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '12' },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '10' },
      { key: 'tileArea', label: 'Tile area (sq ft)', fieldType: 'number', sortOrder: 2, defaultValue: '1.77' },
      { key: 'wastagePercent', label: 'Wastage (%)', fieldType: 'percentage', sortOrder: 3, defaultValue: '8' },
    ],
  });

  await upsertCalculator({
    slug: 'flooring',
    name: 'Flooring Calculator',
    description: 'Estimate flooring material and cost for a room.',
    categoryId: construction.id,
    formula: {
      outputs: {
        area: 'length * width',
        materialUnits: 'area * (1 + wastagePercent / 100)',
        totalCost: 'materialUnits * costPerUnit',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'area', label: 'Floor area (sq ft)', format: 'number' },
        { key: 'materialUnits', label: 'Material units', format: 'number' },
        { key: 'totalCost', label: 'Estimated cost', format: 'currency' },
      ],
    },
    fields: [
      { key: 'length', label: 'Length (ft)', fieldType: 'number', sortOrder: 0, defaultValue: '14' },
      { key: 'width', label: 'Width (ft)', fieldType: 'number', sortOrder: 1, defaultValue: '12' },
      { key: 'wastagePercent', label: 'Wastage (%)', fieldType: 'percentage', sortOrder: 2, defaultValue: '10' },
      { key: 'costPerUnit', label: 'Cost per sq ft', fieldType: 'currency', sortOrder: 3, defaultValue: '85' },
    ],
  });

  await upsertCalculator({
    slug: 'solar',
    name: 'Solar Savings Calculator',
    description: 'Estimate annual savings from rooftop solar.',
    categoryId: general.id,
    formula: {
      outputs: {
        annualBill: 'monthlyBill * 12',
        annualSavings: 'annualBill * savingsPercent / 100',
        paybackYears: 'systemCost / max(annualSavings, 1)',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'annualSavings', label: 'Annual savings', format: 'currency' },
        { key: 'paybackYears', label: 'Payback (years)', format: 'number' },
      ],
    },
    fields: [
      { key: 'monthlyBill', label: 'Monthly electricity bill', fieldType: 'currency', sortOrder: 0, defaultValue: '3000' },
      { key: 'savingsPercent', label: 'Bill offset (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '70' },
      { key: 'systemCost', label: 'System cost', fieldType: 'currency', sortOrder: 2, defaultValue: '250000' },
    ],
  });

  await upsertCalculator({
    slug: 'car-loan',
    name: 'Car Loan Calculator',
    description: 'Plan EMI for your next car purchase.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        principal: 'onRoadPrice - downPayment',
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
        totalPayment: 'emi * tenureMonths',
        totalInterest: 'totalPayment - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'emi', label: 'Monthly EMI', format: 'currency' },
        { key: 'totalInterest', label: 'Total interest', format: 'currency' },
        { key: 'totalPayment', label: 'Total payment', format: 'currency' },
      ],
    },
    fields: [
      { key: 'onRoadPrice', label: 'On-road price', fieldType: 'currency', sortOrder: 0, defaultValue: '1000000' },
      { key: 'downPayment', label: 'Down payment', fieldType: 'currency', sortOrder: 1, defaultValue: '200000' },
      { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 2, defaultValue: '9.5' },
      { key: 'tenureMonths', label: 'Tenure (months)', fieldType: 'number', sortOrder: 3, defaultValue: '60' },
    ],
  });

  await upsertCalculator({
    slug: 'fuel',
    name: 'Fuel Cost Calculator',
    description: 'Estimate trip fuel cost from distance and mileage.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        fuelNeeded: 'distance / mileage',
        tripCost: 'fuelNeeded * fuelPrice',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'fuelNeeded', label: 'Fuel needed (L)', format: 'number' },
        { key: 'tripCost', label: 'Trip cost', format: 'currency' },
      ],
    },
    fields: [
      { key: 'distance', label: 'Distance (km)', fieldType: 'number', sortOrder: 0, defaultValue: '100' },
      { key: 'mileage', label: 'Mileage (km/L)', fieldType: 'number', sortOrder: 1, defaultValue: '15' },
      { key: 'fuelPrice', label: 'Fuel price / L', fieldType: 'currency', sortOrder: 2, defaultValue: '105' },
    ],
  });

  await upsertCalculator({
    slug: 'mileage',
    name: 'Mileage Calculator',
    description: 'Calculate real-world fuel efficiency from trip distance and fuel used.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        mileage: 'distance / fuelUsed',
        costPerKm: 'fuelPrice / mileage',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'mileage', label: 'Mileage (km/L)', format: 'number' },
        { key: 'costPerKm', label: 'Cost per km', format: 'currency' },
      ],
    },
    fields: [
      { key: 'distance', label: 'Distance (km)', fieldType: 'number', sortOrder: 0, defaultValue: '300' },
      { key: 'fuelUsed', label: 'Fuel used (L)', fieldType: 'number', sortOrder: 1, defaultValue: '18' },
      { key: 'fuelPrice', label: 'Fuel price / L', fieldType: 'currency', sortOrder: 2, defaultValue: '105' },
    ],
  });

  await upsertCalculator({
    slug: 'car-insurance',
    name: 'Car Insurance Estimator',
    description: 'Estimate annual comprehensive car insurance premium.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        basePremium: 'idv * premiumRate / 100',
        ncbDiscount: 'basePremium * ncbPercent / 100',
        estimatedPremium: 'basePremium - ncbDiscount',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'basePremium', label: 'Base premium', format: 'currency' },
        { key: 'ncbDiscount', label: 'NCB discount', format: 'currency' },
        { key: 'estimatedPremium', label: 'Estimated premium', format: 'currency' },
      ],
    },
    fields: [
      { key: 'idv', label: 'Insured Declared Value', fieldType: 'currency', sortOrder: 0, defaultValue: '700000' },
      { key: 'premiumRate', label: 'Premium rate (%)', fieldType: 'percentage', sortOrder: 1, defaultValue: '2.5' },
      { key: 'ncbPercent', label: 'NCB (%)', fieldType: 'percentage', sortOrder: 2, defaultValue: '20' },
    ],
  });

  await upsertCalculator({
    slug: 'depreciation',
    name: 'Depreciation Calculator',
    description: 'Estimate vehicle resale value after years of ownership.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        remainingValue: 'purchasePrice * pow(1 - depreciationRate / 100, years)',
        totalDepreciation: 'purchasePrice - remainingValue',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'remainingValue', label: 'Estimated value', format: 'currency' },
        { key: 'totalDepreciation', label: 'Total depreciation', format: 'currency' },
      ],
    },
    fields: [
      { key: 'purchasePrice', label: 'Purchase price', fieldType: 'currency', sortOrder: 0, defaultValue: '1000000' },
      { key: 'years', label: 'Years owned', fieldType: 'number', sortOrder: 1, defaultValue: '3' },
      { key: 'depreciationRate', label: 'Depreciation (% / year)', fieldType: 'percentage', sortOrder: 2, defaultValue: '15' },
    ],
  });

  await upsertCalculator({
    slug: 'maintenance-cost',
    name: 'Maintenance Cost Estimator',
    description: 'Estimate annual service and maintenance spend.',
    categoryId: automobile.id,
    formula: {
      outputs: {
        annualService: 'servicesPerYear * costPerService',
        annualConsumables: 'tyresAndOil',
        totalAnnual: 'annualService + annualConsumables',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'annualService', label: 'Service cost / year', format: 'currency' },
        { key: 'annualConsumables', label: 'Consumables / year', format: 'currency' },
        { key: 'totalAnnual', label: 'Total / year', format: 'currency' },
      ],
    },
    fields: [
      { key: 'servicesPerYear', label: 'Services per year', fieldType: 'number', sortOrder: 0, defaultValue: '2' },
      { key: 'costPerService', label: 'Cost per service', fieldType: 'currency', sortOrder: 1, defaultValue: '4500' },
      { key: 'tyresAndOil', label: 'Tyres / oil / misc / year', fieldType: 'currency', sortOrder: 2, defaultValue: '8000' },
    ],
  });

  await upsertCalculator({
    slug: 'loan-eligibility',
    name: 'Loan Eligibility Calculator',
    description: 'Estimate maximum loan amount based on income and existing EMIs.',
    categoryId: finance.id,
    seoTitle: 'Loan Eligibility Calculator | Varnarc',
    seoDescription: 'Check how much loan you may qualify for.',
    formula: {
      outputs: {
        maxEmi: 'monthlyIncome * 0.5 - existingEmi',
        eligibleAmount: 'maxEmi * ((pow(1 + monthlyRate, tenureMonths) - 1) / (monthlyRate * pow(1 + monthlyRate, tenureMonths)))',
        monthlyRate: 'annualRate / 12 / 100',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maxEmi', label: 'Max affordable EMI', format: 'currency' },
        { key: 'eligibleAmount', label: 'Eligible loan amount', format: 'currency' },
      ],
    },
    fields: [
      { key: 'monthlyIncome', label: 'Monthly net income', fieldType: 'currency', sortOrder: 0, defaultValue: '80000' },
      { key: 'existingEmi', label: 'Existing EMIs', fieldType: 'currency', sortOrder: 1, defaultValue: '0' },
      { key: 'annualRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 2, defaultValue: '9' },
      { key: 'tenureMonths', label: 'Tenure (months)', fieldType: 'number', sortOrder: 3, defaultValue: '240' },
    ],
  });

  await upsertCalculator({
    slug: 'nps',
    name: 'NPS Calculator',
    description: 'Project NPS corpus at retirement with monthly contributions.',
    categoryId: finance.id,
    formula: {
      outputs: {
        months: 'years * 12',
        invested: 'monthlyContribution * months',
        corpus: 'monthlyContribution * ((pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)',
        monthlyRate: 'expectedReturn / 12 / 100',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'corpus', label: 'Projected corpus', format: 'currency' },
        { key: 'invested', label: 'Total contributed', format: 'currency' },
      ],
    },
    fields: [
      { key: 'monthlyContribution', label: 'Monthly contribution', fieldType: 'currency', sortOrder: 0, defaultValue: '5000' },
      { key: 'years', label: 'Years to retirement', fieldType: 'number', sortOrder: 1, defaultValue: '25' },
      { key: 'expectedReturn', label: 'Expected return (% p.a.)', fieldType: 'percentage', sortOrder: 2, defaultValue: '10' },
    ],
  });

  await upsertCalculator({
    slug: 'budget-planner',
    name: 'Budget Planner',
    description: 'Split monthly income into needs, wants, and savings.',
    categoryId: general.id,
    formula: {
      outputs: {
        needs: 'monthlyIncome * 0.5',
        wants: 'monthlyIncome * 0.3',
        savings: 'monthlyIncome * 0.2',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'needs', label: 'Needs (50%)', format: 'currency' },
        { key: 'wants', label: 'Wants (30%)', format: 'currency' },
        { key: 'savings', label: 'Savings (20%)', format: 'currency' },
      ],
    },
    fields: [
      { key: 'monthlyIncome', label: 'Monthly income', fieldType: 'currency', sortOrder: 0, defaultValue: '75000' },
    ],
  });

  await upsertCalculator({
    slug: 'compound-interest',
    name: 'Compound Interest Calculator',
    description: 'See how a lump sum grows with compound interest.',
    categoryId: finance.id,
    formula: {
      outputs: {
        maturity: 'principal * pow(1 + annualRate / 100, years)',
        gains: 'maturity - principal',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maturity', label: 'Maturity amount', format: 'currency' },
        { key: 'gains', label: 'Interest earned', format: 'currency' },
      ],
    },
    fields: [
      { key: 'principal', label: 'Principal', fieldType: 'currency', sortOrder: 0, defaultValue: '100000' },
      { key: 'annualRate', label: 'Rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '8' },
      { key: 'years', label: 'Years', fieldType: 'number', sortOrder: 2, defaultValue: '10' },
    ],
  });

  await upsertCalculator({
    slug: 'ppf',
    name: 'PPF Calculator',
    description: 'Estimate Public Provident Fund maturity with annual deposits.',
    categoryId: finance.id,
    formula: {
      outputs: {
        maturity: 'annualDeposit * ((pow(1 + rate, years) - 1) / rate) * (1 + rate)',
        rate: 'interestRate / 100',
        invested: 'annualDeposit * years',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'maturity', label: 'Maturity value', format: 'currency' },
        { key: 'invested', label: 'Total deposited', format: 'currency' },
      ],
    },
    fields: [
      { key: 'annualDeposit', label: 'Annual deposit', fieldType: 'currency', sortOrder: 0, defaultValue: '150000' },
      { key: 'interestRate', label: 'Interest rate (% p.a.)', fieldType: 'percentage', sortOrder: 1, defaultValue: '7.1' },
      { key: 'years', label: 'Tenure (years)', fieldType: 'number', sortOrder: 2, defaultValue: '15' },
    ],
  });

  await upsertCalculator({
    slug: 'gratuity',
    name: 'Gratuity Calculator',
    description: 'Estimate gratuity payout for eligible employees in India.',
    categoryId: finance.id,
    formula: {
      outputs: {
        gratuity: 'lastDrawnSalary * yearsOfService * 15 / 26',
      },
    },
    resultTemplate: {
      cards: [{ key: 'gratuity', label: 'Estimated gratuity', format: 'currency' }],
    },
    fields: [
      { key: 'lastDrawnSalary', label: 'Last drawn basic + DA (monthly)', fieldType: 'currency', sortOrder: 0, defaultValue: '50000' },
      { key: 'yearsOfService', label: 'Years of service', fieldType: 'number', sortOrder: 1, defaultValue: '8' },
    ],
  });

  await upsertCalculator({
    slug: 'property-tax',
    name: 'Property Tax Estimator',
    description: 'Rough annual property tax estimate from assessed value.',
    categoryId: general.id,
    formula: {
      outputs: {
        annualTax: 'assessedValue * taxRate / 100',
      },
    },
    resultTemplate: {
      cards: [{ key: 'annualTax', label: 'Estimated annual tax', format: 'currency' }],
    },
    fields: [
      { key: 'assessedValue', label: 'Assessed property value', fieldType: 'currency', sortOrder: 0, defaultValue: '5000000' },
      { key: 'taxRate', label: 'Tax rate (% of AV)', fieldType: 'percentage', sortOrder: 1, defaultValue: '0.2' },
    ],
  });

  await seedExtendedCalculators(prisma, {
    finance: finance.id,
    construction: construction.id,
    automobile: automobile.id,
    general: general.id,
  });
  await enrichExistingCalculators(prisma);
  await seedAiOps(prisma);

  // --- Finance Module sample data ---
  const financeCats = [
    { slug: 'banking', name: 'Banking', sortOrder: 1 },
    { slug: 'loans', name: 'Loans', sortOrder: 2 },
    { slug: 'credit-cards', name: 'Credit Cards', sortOrder: 3 },
    { slug: 'insurance', name: 'Insurance', sortOrder: 4 },
    { slug: 'investments', name: 'Investments', sortOrder: 5 },
    { slug: 'taxation', name: 'Taxation', sortOrder: 6 },
  ] as const;

  for (const cat of financeCats) {
    await prisma.financeCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder },
    });
  }

  const loansCat = await prisma.financeCategory.findUniqueOrThrow({ where: { slug: 'loans' } });
  const cardsCat = await prisma.financeCategory.findUniqueOrThrow({ where: { slug: 'credit-cards' } });
  const insuranceCat = await prisma.financeCategory.findUniqueOrThrow({ where: { slug: 'insurance' } });
  const investmentsCat = await prisma.financeCategory.findUniqueOrThrow({ where: { slug: 'investments' } });

  const hdfc = await prisma.bank.upsert({
    where: { slug: 'hdfc-bank' },
    update: {
      name: 'HDFC Bank',
      website: 'https://www.hdfcbank.com',
      description: 'Leading private sector bank in India.',
      status: 'PUBLISHED',
      featured: true,
    },
    create: {
      name: 'HDFC Bank',
      slug: 'hdfc-bank',
      website: 'https://www.hdfcbank.com',
      description: 'Leading private sector bank in India.',
      status: 'PUBLISHED',
      featured: true,
    },
  });

  const sbi = await prisma.bank.upsert({
    where: { slug: 'sbi' },
    update: {
      name: 'State Bank of India',
      website: 'https://www.onlinesbi.sbi',
      description: 'India’s largest public sector bank.',
      status: 'PUBLISHED',
      featured: true,
    },
    create: {
      name: 'State Bank of India',
      slug: 'sbi',
      website: 'https://www.onlinesbi.sbi',
      description: 'India’s largest public sector bank.',
      status: 'PUBLISHED',
      featured: true,
    },
  });

  await prisma.loan.upsert({
    where: { bankId_slug: { bankId: hdfc.id, slug: 'personal-loan' } },
    update: {
      name: 'HDFC Personal Loan',
      loanType: 'personal',
      interestRate: 10.5,
      processingFee: 1.5,
      tenureMin: 12,
      tenureMax: 60,
      maxAmount: 4000000,
      eligibility: 'Salaried individuals with stable income.',
      affiliateUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: loansCat.id,
    },
    create: {
      bankId: hdfc.id,
      categoryId: loansCat.id,
      name: 'HDFC Personal Loan',
      slug: 'personal-loan',
      loanType: 'personal',
      interestRate: 10.5,
      processingFee: 1.5,
      tenureMin: 12,
      tenureMax: 60,
      maxAmount: 4000000,
      eligibility: 'Salaried individuals with stable income.',
      affiliateUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.loan.upsert({
    where: { bankId_slug: { bankId: hdfc.id, slug: 'car-loan' } },
    update: {
      name: 'HDFC Car Loan',
      loanType: 'car',
      interestRate: 9.1,
      processingFee: 1,
      tenureMin: 12,
      tenureMax: 84,
      maxAmount: 10000000,
      eligibility: 'Salaried / self-employed buying a new passenger car.',
      affiliateUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/car-loan',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: loansCat.id,
    },
    create: {
      bankId: hdfc.id,
      categoryId: loansCat.id,
      name: 'HDFC Car Loan',
      slug: 'car-loan',
      loanType: 'car',
      interestRate: 9.1,
      processingFee: 1,
      tenureMin: 12,
      tenureMax: 84,
      maxAmount: 10000000,
      eligibility: 'Salaried / self-employed buying a new passenger car.',
      affiliateUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/car-loan',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.loan.upsert({
    where: { bankId_slug: { bankId: sbi.id, slug: 'home-loan' } },
    update: {
      name: 'SBI Home Loan',
      loanType: 'home',
      interestRate: 8.5,
      processingFee: 0.35,
      tenureMin: 60,
      tenureMax: 360,
      maxAmount: 100000000,
      eligibility: 'Resident Indians purchasing or constructing a home.',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: loansCat.id,
    },
    create: {
      bankId: sbi.id,
      categoryId: loansCat.id,
      name: 'SBI Home Loan',
      slug: 'home-loan',
      loanType: 'home',
      interestRate: 8.5,
      processingFee: 0.35,
      tenureMin: 60,
      tenureMax: 360,
      maxAmount: 100000000,
      eligibility: 'Resident Indians purchasing or constructing a home.',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.creditCard.upsert({
    where: { bankId_slug: { bankId: hdfc.id, slug: 'regalia' } },
    update: {
      name: 'HDFC Regalia',
      annualFee: 2500,
      joiningFee: 2500,
      rewards: 'Reward points on spends',
      cashback: 'Milestone benefits',
      loungeAccess: true,
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: cardsCat.id,
    },
    create: {
      bankId: hdfc.id,
      categoryId: cardsCat.id,
      name: 'HDFC Regalia',
      slug: 'regalia',
      annualFee: 2500,
      joiningFee: 2500,
      rewards: 'Reward points on spends',
      cashback: 'Milestone benefits',
      loungeAccess: true,
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.insuranceProduct.upsert({
    where: { slug: 'motor-comprehensive' },
    update: {
      providerName: 'Varnarc Protect',
      name: 'Motor Comprehensive',
      coverage: 'Own damage + third party for cars',
      premium: 8999,
      benefits: 'Cashless garage network and roadside assistance.',
      affiliateUrl: 'https://example.com/motor-insurance',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: insuranceCat.id,
    },
    create: {
      categoryId: insuranceCat.id,
      providerName: 'Varnarc Protect',
      name: 'Motor Comprehensive',
      slug: 'motor-comprehensive',
      coverage: 'Own damage + third party for cars',
      premium: 8999,
      benefits: 'Cashless garage network and roadside assistance.',
      affiliateUrl: 'https://example.com/motor-insurance',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.insuranceProduct.upsert({
    where: { slug: 'term-life-basic' },
    update: {
      providerName: 'Varnarc Protect',
      name: 'Term Life Basic',
      coverage: 'Life cover up to ₹1 Cr',
      premium: 499,
      benefits: 'Pure term protection with online issuance.',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: insuranceCat.id,
    },
    create: {
      categoryId: insuranceCat.id,
      providerName: 'Varnarc Protect',
      name: 'Term Life Basic',
      slug: 'term-life-basic',
      coverage: 'Life cover up to ₹1 Cr',
      premium: 499,
      benefits: 'Pure term protection with online issuance.',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.investmentProduct.upsert({
    where: { slug: 'flexi-cap-growth' },
    update: {
      providerName: 'Varnarc Funds',
      name: 'Flexi Cap Growth',
      riskLevel: 'moderate',
      expectedReturn: 12,
      lockInPeriod: 'None',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: investmentsCat.id,
    },
    create: {
      categoryId: investmentsCat.id,
      providerName: 'Varnarc Funds',
      name: 'Flexi Cap Growth',
      slug: 'flexi-cap-growth',
      riskLevel: 'moderate',
      expectedReturn: 12,
      lockInPeriod: 'None',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const personalLoan = await prisma.loan.findFirst({
    where: { bankId: hdfc.id, slug: 'personal-loan', deletedAt: null },
  });
  if (personalLoan) {
    const existingRate = await prisma.interestRate.findFirst({
      where: { loanId: personalLoan.id, deletedAt: null },
    });
    if (!existingRate) {
      await prisma.interestRate.create({
        data: {
          loanId: personalLoan.id,
          bankId: hdfc.id,
          productType: 'personal-loan',
          rate: 10.5,
          minTenure: 12,
          maxTenure: 60,
          source: 'Bank website',
          effectiveFrom: new Date(),
        },
      });
    }
  }

  await prisma.financeFaq.deleteMany({ where: { question: { in: ['What is an EMI?', 'How is SIP different from lump sum investing?', 'Are credit card rewards taxable?'] } } });
  await prisma.financeFaq.createMany({
    data: [
      {
        question: 'What is an EMI?',
        answer: 'Equated Monthly Installment — a fixed payment toward a loan each month covering principal and interest.',
        sortOrder: 1,
        status: 'PUBLISHED',
      },
      {
        question: 'How is SIP different from lump sum investing?',
        answer: 'SIP invests a fixed amount periodically, averaging purchase cost over time; lump sum invests once.',
        sortOrder: 2,
        status: 'PUBLISHED',
      },
      {
        question: 'Are credit card rewards taxable?',
        answer: 'Typically reward points and cashback are not taxed as income in India, but confirm with a tax advisor for your case.',
        sortOrder: 3,
        status: 'PUBLISHED',
      },
    ],
  });

  for (const term of [
    { term: 'APR', slug: 'apr', definition: 'Annual Percentage Rate — yearly cost of borrowing including fees.' },
    { term: 'CIBIL', slug: 'cibil', definition: 'A common credit score bureau report used by Indian lenders.' },
    { term: 'Tenure', slug: 'tenure', definition: 'The duration over which a loan is repaid.' },
    { term: 'Processing fee', slug: 'processing-fee', definition: 'One-time fee charged by lenders when disbursing a loan.' },
  ]) {
    await prisma.financeGlossaryTerm.upsert({
      where: { slug: term.slug },
      update: { term: term.term, definition: term.definition, status: 'PUBLISHED' },
      create: { ...term, status: 'PUBLISHED' },
    });
  }

  await prisma.financeGuide.upsert({
    where: { slug: 'how-to-choose-a-personal-loan' },
    update: {
      title: 'How to choose a personal loan',
      summary: 'Compare rates, fees, tenure, and eligibility before you apply.',
      body: 'Start with your EMI budget, compare interest rates and processing fees, check prepayment rules, and use an EMI calculator before applying.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: loansCat.id,
    },
    create: {
      title: 'How to choose a personal loan',
      slug: 'how-to-choose-a-personal-loan',
      summary: 'Compare rates, fees, tenure, and eligibility before you apply.',
      body: 'Start with your EMI budget, compare interest rates and processing fees, check prepayment rules, and use an EMI calculator before applying.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: loansCat.id,
    },
  });

  await prisma.financeGuide.upsert({
    where: { slug: 'sip-basics-for-beginners' },
    update: {
      title: 'SIP basics for beginners',
      summary: 'Learn how systematic investing works and what to watch for.',
      body: 'Pick a goal horizon, choose diversified funds matching your risk, automate SIPs, and review yearly — not daily.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: investmentsCat.id,
    },
    create: {
      title: 'SIP basics for beginners',
      slug: 'sip-basics-for-beginners',
      summary: 'Learn how systematic investing works and what to watch for.',
      body: 'Pick a goal horizon, choose diversified funds matching your risk, automate SIPs, and review yearly — not daily.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      categoryId: investmentsCat.id,
    },
  });

  await prisma.financeRateFeed.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: { name: 'Mock home loan rates', provider: 'mock', productType: 'home-loan', enabled: true },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Mock home loan rates',
      provider: 'mock',
      productType: 'home-loan',
      enabled: true,
      endpointUrl: null,
    },
  });

  await prisma.tag.upsert({
    where: { slug: 'finance' },
    update: { name: 'Finance' },
    create: { name: 'Finance', slug: 'finance' },
  });

  // --- Construction Module sample data ---
  const constructionCats = [
    { slug: 'materials', name: 'Materials', sortOrder: 1 },
    { slug: 'structural', name: 'Structural', sortOrder: 2 },
    { slug: 'interior', name: 'Interior', sortOrder: 3 },
    { slug: 'exterior', name: 'Exterior', sortOrder: 4 },
    { slug: 'planning', name: 'Planning', sortOrder: 5 },
  ] as const;
  for (const cat of constructionCats) {
    await prisma.constructionCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder },
    });
  }
  const materialsCat = await prisma.constructionCategory.findUniqueOrThrow({ where: { slug: 'materials' } });
  const interiorCat = await prisma.constructionCategory.findUniqueOrThrow({ where: { slug: 'interior' } });

  const ultratech = await prisma.constructionBrand.upsert({
    where: { slug: 'ultratech' },
    update: { name: 'UltraTech', website: 'https://www.ultratechcement.com', status: 'PUBLISHED', featured: true },
    create: {
      name: 'UltraTech',
      slug: 'ultratech',
      website: 'https://www.ultratechcement.com',
      description: 'Leading cement brand in India.',
      status: 'PUBLISHED',
      featured: true,
    },
  });
  const asianPaints = await prisma.constructionBrand.upsert({
    where: { slug: 'asian-paints' },
    update: { name: 'Asian Paints', website: 'https://www.asianpaints.com', status: 'PUBLISHED', featured: true },
    create: {
      name: 'Asian Paints',
      slug: 'asian-paints',
      website: 'https://www.asianpaints.com',
      description: 'Paints and interiors brand.',
      status: 'PUBLISHED',
      featured: true,
    },
  });

  await prisma.constructionMaterial.upsert({
    where: { slug: 'opc-53-cement' },
    update: {
      name: 'OPC 53 Grade Cement',
      unit: 'bag',
      unitCost: 380,
      approximatePrice: 380,
      categoryId: materialsCat.id,
      brandId: ultratech.id,
      status: 'PUBLISHED',
      featured: true,
      sponsored: true,
      publishedAt: new Date(),
      affiliateUrl: 'https://www.ultratechcement.com',
    },
    create: {
      name: 'OPC 53 Grade Cement',
      slug: 'opc-53-cement',
      unit: 'bag',
      unitCost: 380,
      approximatePrice: 380,
      description: 'Ordinary Portland Cement 53 grade for structural work.',
      categoryId: materialsCat.id,
      brandId: ultratech.id,
      status: 'PUBLISHED',
      featured: true,
      sponsored: true,
      publishedAt: new Date(),
      affiliateUrl: 'https://www.ultratechcement.com',
    },
  });

  await prisma.constructionMaterial.upsert({
    where: { slug: 'tmt-fe500d' },
    update: {
      name: 'TMT Fe500D Bars',
      unit: 'kg',
      unitCost: 68,
      approximatePrice: 68,
      categoryId: materialsCat.id,
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date(),
    },
    create: {
      name: 'TMT Fe500D Bars',
      slug: 'tmt-fe500d',
      unit: 'kg',
      unitCost: 68,
      approximatePrice: 68,
      description: 'Thermo-mechanically treated steel bars for RCC.',
      categoryId: materialsCat.id,
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date(),
    },
  });

  await prisma.constructionMaterial.upsert({
    where: { slug: 'premium-emulsion-paint' },
    update: {
      name: 'Premium Emulsion Paint',
      unit: 'litre',
      unitCost: 320,
      approximatePrice: 320,
      categoryId: interiorCat.id,
      brandId: asianPaints.id,
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date(),
    },
    create: {
      name: 'Premium Emulsion Paint',
      slug: 'premium-emulsion-paint',
      unit: 'litre',
      unitCost: 320,
      approximatePrice: 320,
      description: 'Interior emulsion with washable finish.',
      categoryId: interiorCat.id,
      brandId: asianPaints.id,
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date(),
    },
  });

  await prisma.costTemplate.upsert({
    where: { slug: 'house-construction' },
    update: {
      name: 'House Construction',
      category: 'structural',
      formulaReference: 'area * rate_per_sqft',
      laborPercent: 30,
      contingencyPercent: 10,
      status: 'PUBLISHED',
      items: { baseRatePerSqft: 1800 },
      categoryId: materialsCat.id,
    },
    create: {
      name: 'House Construction',
      slug: 'house-construction',
      description: 'Indicative cost template for residential builds.',
      category: 'structural',
      formulaReference: 'area * rate_per_sqft',
      laborPercent: 30,
      contingencyPercent: 10,
      status: 'PUBLISHED',
      items: { baseRatePerSqft: 1800 },
      categoryId: materialsCat.id,
    },
  });

  await prisma.constructionFaq.deleteMany({
    where: { question: { in: ['How much cement per sqft?', 'What is TMT steel?'] } },
  });
  await prisma.constructionFaq.createMany({
    data: [
      {
        question: 'How much cement per sqft?',
        answer: 'Rough thumb rule is 0.4 bags per sqft for RCC framed structures — use calculators for accuracy.',
        sortOrder: 1,
        status: 'PUBLISHED',
      },
      {
        question: 'What is TMT steel?',
        answer: 'Thermo-Mechanically Treated bars with higher strength and ductility for earthquake-resistant construction.',
        sortOrder: 2,
        status: 'PUBLISHED',
      },
    ],
  });

  await prisma.constructionGuide.upsert({
    where: { slug: 'cement-buying-guide' },
    update: {
      title: 'Cement buying guide',
      summary: 'OPC vs PPC and how to choose for your project.',
      body: 'Use OPC for structural RCC members and PPC for plaster/masonry where slower heat of hydration helps. Check manufacturing date and storage.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: 'Cement buying guide',
      slug: 'cement-buying-guide',
      summary: 'OPC vs PPC and how to choose for your project.',
      body: 'Use OPC for structural RCC members and PPC for plaster/masonry where slower heat of hydration helps. Check manufacturing date and storage.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const checklistSeeds = [
    {
      slug: 'residential-pre-construction',
      title: 'Residential pre-construction checklist',
      description: 'Permits, site survey, and material planning before breaking ground.',
      projectType: 'Planning',
      items: [
        { label: 'Confirm land title and building permits', phase: 'Planning' },
        { label: 'Soil test and site survey completed', phase: 'Planning' },
        { label: 'Architect drawings and BOQ finalized', phase: 'Planning' },
        { label: 'Shortlist cement, steel, and brick suppliers', phase: 'Materials' },
        { label: 'Arrange temporary power and water on site', phase: 'Site prep' },
      ],
    },
    {
      slug: 'foundation-milestones',
      title: 'Foundation & structure milestones',
      description: 'Track excavation through slab and frame completion.',
      projectType: 'Structure',
      items: [
        { label: 'Excavation depth verified', phase: 'Foundation' },
        { label: 'PCC and footing reinforcement inspected', phase: 'Foundation' },
        { label: 'Column and beam shuttering checked', phase: 'Structure' },
        { label: 'Slab pour scheduled with cube tests', phase: 'Structure' },
        { label: 'Waterproofing applied below grade', phase: 'Structure' },
      ],
    },
    {
      slug: 'finishing-handover',
      title: 'Finishing & handover checklist',
      description: 'Plaster, MEP, paint, and snag list before possession.',
      projectType: 'Finishing',
      items: [
        { label: 'Internal plaster and putty complete', phase: 'Finishing' },
        { label: 'Electrical and plumbing tested', phase: 'MEP' },
        { label: 'Flooring and tile work signed off', phase: 'Finishing' },
        { label: 'Final paint coats applied', phase: 'Finishing' },
        { label: 'Snag list closed and handover docs ready', phase: 'Handover' },
      ],
    },
  ] as const;

  for (const checklist of checklistSeeds) {
    await prisma.constructionChecklist.upsert({
      where: { slug: checklist.slug },
      update: {
        title: checklist.title,
        description: checklist.description,
        projectType: checklist.projectType,
        items: checklist.items,
        status: 'PUBLISHED',
      },
      create: {
        title: checklist.title,
        slug: checklist.slug,
        description: checklist.description,
        projectType: checklist.projectType,
        items: checklist.items,
        status: 'PUBLISHED',
      },
    });
  }

  const supplierCategorySeeds = [
    { slug: 'building-materials', name: 'Building Material Suppliers' },
    { slug: 'cement-dealers', name: 'Cement Dealers' },
    { slug: 'steel-dealers', name: 'Steel Dealers' },
    { slug: 'contractors', name: 'Contractors' },
    { slug: 'architects', name: 'Architects' },
    { slug: 'interior-designers', name: 'Interior Designers' },
  ] as const;

  const supplierCategories: Record<string, string> = {};
  for (const cat of supplierCategorySeeds) {
    const row = await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
    supplierCategories[cat.slug] = row.id;
  }

  const supplierBusinessSeeds = [
    {
      slug: 'mumbai-buildmart',
      name: 'Mumbai BuildMart',
      category: 'building-materials',
      city: 'Mumbai',
      phone: '+91 98765 43210',
      description: 'Wholesale cement, sand, and aggregate with same-day delivery in Mumbai.',
      sponsored: true,
    },
    {
      slug: 'delhi-cement-hub',
      name: 'Delhi Cement Hub',
      category: 'cement-dealers',
      city: 'New Delhi',
      phone: '+91 98100 12345',
      description: 'Authorized dealer for major cement brands across NCR.',
    },
    {
      slug: 'bengaluru-steel-traders',
      name: 'Bengaluru Steel Traders',
      category: 'steel-dealers',
      city: 'Bengaluru',
      phone: '+91 99000 55667',
      description: 'TMT bars, structural steel, and cut-and-bend services.',
    },
    {
      slug: 'varnarc-build-contractors',
      name: 'Varnarc Build Contractors',
      category: 'contractors',
      city: 'Hyderabad',
      phone: '+91 91234 56789',
      description: 'Turnkey residential construction with milestone billing.',
      sponsored: true,
    },
    {
      slug: 'studio-grid-architects',
      name: 'Studio Grid Architects',
      category: 'architects',
      city: 'Pune',
      phone: '+91 99887 76655',
      description: 'Residential and commercial design with Vastu-aware planning.',
    },
    {
      slug: 'homecraft-interiors',
      name: 'HomeCraft Interiors',
      category: 'interior-designers',
      city: 'Chennai',
      phone: '+91 94440 11223',
      description: 'Modular kitchens, wardrobes, and full-home interior execution.',
    },
  ] as const;

  for (const biz of supplierBusinessSeeds) {
    const categoryId = supplierCategories[biz.category];
    const business = await prisma.business.upsert({
      where: { slug: biz.slug },
      update: {
        name: biz.name,
        description: biz.description,
        phone: biz.phone,
        status: BusinessStatus.APPROVED,
        metadata: { sponsored: Boolean((biz as { sponsored?: boolean }).sponsored), vertical: 'construction' },
      },
      create: {
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        phone: biz.phone,
        status: BusinessStatus.APPROVED,
        metadata: { sponsored: Boolean((biz as { sponsored?: boolean }).sponsored), vertical: 'construction' },
      },
    });
    if (categoryId) {
      await prisma.businessCategoryLink.upsert({
        where: {
          businessId_categoryId: { businessId: business.id, categoryId },
        },
        update: {},
        create: { businessId: business.id, categoryId },
      });
    }
    const existingLocation = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, city: biz.city, deletedAt: null },
    });
    if (!existingLocation) {
      await prisma.businessLocation.create({
        data: {
          businessId: business.id,
          label: 'Main',
          address1: 'Industrial Area',
          city: biz.city,
          state: 'India',
          country: 'IN',
        },
      });
    }
  }

  const opcMaterial = await prisma.constructionMaterial.findUnique({ where: { slug: 'opc-53-cement' } });
  const tmtMaterial = await prisma.constructionMaterial.findUnique({ where: { slug: 'tmt-fe500d' } });
  if (opcMaterial && tmtMaterial) {
    await prisma.constructionComparison.upsert({
      where: { slug: 'cement-vs-steel-starter' },
      update: {
        title: 'Cement vs TMT starter compare',
        entityType: 'materials',
        entityIds: [opcMaterial.id, tmtMaterial.id],
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      create: {
        title: 'Cement vs TMT starter compare',
        slug: 'cement-vs-steel-starter',
        entityType: 'materials',
        entityIds: [opcMaterial.id, tmtMaterial.id],
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  await prisma.tag.upsert({
    where: { slug: 'construction' },
    update: { name: 'Construction' },
    create: { name: 'Construction', slug: 'construction' },
  });

  // --- Automobile Module sample data ---
  const maruti = await prisma.automobileManufacturer.upsert({
    where: { slug: 'maruti-suzuki' },
    update: {
      name: 'Maruti Suzuki',
      country: 'India',
      foundedYear: 1981,
      website: 'https://www.marutisuzuki.com',
      description: 'India’s largest passenger car manufacturer.',
      status: 'PUBLISHED',
      featured: true,
    },
    create: {
      name: 'Maruti Suzuki',
      slug: 'maruti-suzuki',
      country: 'India',
      foundedYear: 1981,
      website: 'https://www.marutisuzuki.com',
      description: 'India’s largest passenger car manufacturer.',
      status: 'PUBLISHED',
      featured: true,
    },
  });

  const hyundai = await prisma.automobileManufacturer.upsert({
    where: { slug: 'hyundai' },
    update: {
      name: 'Hyundai',
      country: 'South Korea',
      foundedYear: 1967,
      website: 'https://www.hyundai.com/in',
      description: 'Popular hatchback and SUV maker in India.',
      status: 'PUBLISHED',
      featured: true,
    },
    create: {
      name: 'Hyundai',
      slug: 'hyundai',
      country: 'South Korea',
      foundedYear: 1967,
      website: 'https://www.hyundai.com/in',
      description: 'Popular hatchback and SUV maker in India.',
      status: 'PUBLISHED',
      featured: true,
    },
  });

  const swift = await prisma.automobileVehicle.upsert({
    where: { slug: 'maruti-swift-vxi' },
    update: {
      manufacturerId: maruti.id,
      name: 'Maruti Swift VXI',
      model: 'Swift',
      variant: 'VXI',
      modelYear: 2024,
      category: 'Passenger Cars',
      bodyType: 'Hatchback',
      fuelType: 'Petrol',
      transmission: 'Manual',
      engineCapacity: '1197 cc',
      horsepower: 82,
      torque: 113,
      mileage: 22.4,
      seatingCapacity: 5,
      safetyRating: 2,
      exShowroomPrice: 650000,
      estimatedOnRoadPrice: 740000,
      warranty: '2 years / 40,000 km',
      description: 'Popular premium hatchback with peppy performance and low ownership cost.',
      pros: ['Efficient', 'Easy to drive', 'Strong resale'],
      cons: ['Average rear space', 'Basic safety kit on lower trims'],
      featured: true,
      sponsored: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      affiliateUrl: 'https://www.marutisuzuki.com',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
    },
    create: {
      manufacturerId: maruti.id,
      name: 'Maruti Swift VXI',
      slug: 'maruti-swift-vxi',
      model: 'Swift',
      variant: 'VXI',
      modelYear: 2024,
      category: 'Passenger Cars',
      bodyType: 'Hatchback',
      fuelType: 'Petrol',
      transmission: 'Manual',
      engineCapacity: '1197 cc',
      horsepower: 82,
      torque: 113,
      mileage: 22.4,
      seatingCapacity: 5,
      safetyRating: 2,
      exShowroomPrice: 650000,
      estimatedOnRoadPrice: 740000,
      warranty: '2 years / 40,000 km',
      description: 'Popular premium hatchback with peppy performance and low ownership cost.',
      pros: ['Efficient', 'Easy to drive', 'Strong resale'],
      cons: ['Average rear space', 'Basic safety kit on lower trims'],
      featured: true,
      sponsored: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      affiliateUrl: 'https://www.marutisuzuki.com',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
    },
  });

  await prisma.automobileVehicleImage.deleteMany({ where: { vehicleId: swift.id } });
  await prisma.automobileVehicleImage.createMany({
    data: [
      {
        vehicleId: swift.id,
        imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
        altText: 'Maruti Swift exterior',
        displayOrder: 0,
        updatedAt: new Date(),
      },
      {
        vehicleId: swift.id,
        imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200',
        altText: 'Maruti Swift side profile',
        displayOrder: 1,
        updatedAt: new Date(),
      },
    ],
  });

  const swiftProduct = await prisma.product.upsert({
    where: { slug: 'maruti-swift-vxi-product' },
    update: { name: 'Maruti Swift VXI', category: 'automobile' },
    create: {
      name: 'Maruti Swift VXI',
      slug: 'maruti-swift-vxi-product',
      category: 'automobile',
      description: 'Review product for Maruti Swift VXI',
    },
  });

  const swiftReview = await prisma.review.upsert({
    where: { slug: 'maruti-swift-vxi-review' },
    update: {
      title: 'Swift VXI: city-friendly hatch',
      summary: 'A nimble, efficient hatchback that excels in urban driving with strong resale value.',
      body: '## Overview\n\nThe Maruti Swift VXI remains one of India\'s most trusted hatchbacks. It balances peppy performance with frugal running costs.\n\n## Driving experience\n\nLight steering and a compact footprint make it easy to slot into tight city gaps. Highway stability is acceptable for its class.',
      verdict: 'A smart buy for first-time owners and city commuters who prioritize efficiency and resale.',
      recommendation: 'best_budget',
      reviewType: 'editorial',
      entityType: 'vehicle',
      entityId: swift.id,
      overallScore: 4.2,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      productId: swiftProduct.id,
      viewCount: 128,
      metadata: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        gallery: [
          {
            url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
            caption: 'Swift VXI exterior',
          },
          {
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
            caption: 'City driving',
          },
        ],
      },
    },
    create: {
      productId: swiftProduct.id,
      title: 'Swift VXI: city-friendly hatch',
      slug: 'maruti-swift-vxi-review',
      summary: 'A nimble, efficient hatchback that excels in urban driving with strong resale value.',
      body: '## Overview\n\nThe Maruti Swift VXI remains one of India\'s most trusted hatchbacks. It balances peppy performance with frugal running costs.\n\n## Driving experience\n\nLight steering and a compact footprint make it easy to slot into tight city gaps. Highway stability is acceptable for its class.',
      verdict: 'A smart buy for first-time owners and city commuters who prioritize efficiency and resale.',
      recommendation: 'best_budget',
      reviewType: 'editorial',
      entityType: 'vehicle',
      entityId: swift.id,
      overallScore: 4.2,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      viewCount: 128,
      metadata: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        gallery: [
          {
            url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
            caption: 'Swift VXI exterior',
          },
          {
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
            caption: 'City driving',
          },
        ],
      },
    },
  });

  await prisma.reviewScore.deleteMany({ where: { reviewId: swiftReview.id } });
  await prisma.reviewPro.deleteMany({ where: { reviewId: swiftReview.id } });
  await prisma.reviewCon.deleteMany({ where: { reviewId: swiftReview.id } });
  await prisma.reviewSection.deleteMany({ where: { reviewId: swiftReview.id } });

  await prisma.reviewScore.createMany({
    data: [
      { reviewId: swiftReview.id, label: 'Performance', score: 8.2, maxScore: 10 },
      { reviewId: swiftReview.id, label: 'Value for Money', score: 9.0, maxScore: 10 },
      { reviewId: swiftReview.id, label: 'Fuel Efficiency', score: 9.2, maxScore: 10 },
      { reviewId: swiftReview.id, label: 'Comfort', score: 7.0, maxScore: 10 },
    ],
  });

  await prisma.reviewPro.createMany({
    data: [
      { reviewId: swiftReview.id, text: 'Excellent fuel economy in city traffic' },
      { reviewId: swiftReview.id, text: 'Easy to park and maneuver' },
      { reviewId: swiftReview.id, text: 'Strong resale value' },
    ],
  });

  await prisma.reviewCon.createMany({
    data: [
      { reviewId: swiftReview.id, text: 'Rear seat space is tight for tall adults' },
      { reviewId: swiftReview.id, text: 'Base safety kit could be better' },
    ],
  });

  await prisma.reviewSection.createMany({
    data: [
      {
        reviewId: swiftReview.id,
        title: 'Interior & features',
        body: 'The cabin is functional with good ergonomics. Infotainment is basic but adequate for daily use.',
        sortOrder: 1,
      },
      {
        reviewId: swiftReview.id,
        title: 'Ownership costs',
        body: 'Service costs are among the lowest in the segment. Spare parts are widely available.',
        sortOrder: 2,
      },
    ],
  });

  await prisma.automobileVehicleReview.upsert({
    where: { vehicleId_reviewId: { vehicleId: swift.id, reviewId: swiftReview.id } },
    update: {},
    create: { vehicleId: swift.id, reviewId: swiftReview.id },
  });

  const creta = await prisma.automobileVehicle.upsert({
    where: { slug: 'hyundai-creta-sx' },
    update: {
      manufacturerId: hyundai.id,
      name: 'Hyundai Creta SX',
      model: 'Creta',
      variant: 'SX',
      modelYear: 2024,
      category: 'Passenger Cars',
      bodyType: 'SUV',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      engineCapacity: '1497 cc',
      horsepower: 113,
      torque: 144,
      mileage: 17.4,
      seatingCapacity: 5,
      safetyRating: 3,
      exShowroomPrice: 1450000,
      estimatedOnRoadPrice: 1680000,
      warranty: '3 years / unlimited km',
      description: 'Feature-rich compact SUV with strong brand pull and automatic options.',
      pros: ['Feature loaded', 'Comfortable ride', 'Strong dealer network'],
      cons: ['Higher ownership cost vs Swift', 'Average highway efficiency'],
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      manufacturerId: hyundai.id,
      name: 'Hyundai Creta SX',
      slug: 'hyundai-creta-sx',
      model: 'Creta',
      variant: 'SX',
      modelYear: 2024,
      category: 'Passenger Cars',
      bodyType: 'SUV',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      engineCapacity: '1497 cc',
      horsepower: 113,
      torque: 144,
      mileage: 17.4,
      seatingCapacity: 5,
      safetyRating: 3,
      exShowroomPrice: 1450000,
      estimatedOnRoadPrice: 1680000,
      warranty: '3 years / unlimited km',
      description: 'Feature-rich compact SUV with strong brand pull and automatic options.',
      pros: ['Feature loaded', 'Comfortable ride', 'Strong dealer network'],
      cons: ['Higher ownership cost vs Swift', 'Average highway efficiency'],
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.automobileMaintenanceSchedule.deleteMany({ where: { vehicleId: swift.id } });
  await prisma.automobileMaintenanceSchedule.createMany({
    data: [
      {
        vehicleId: swift.id,
        title: 'First free service',
        serviceInterval: '1,000 km / 1 month',
        estimatedCost: 0,
        sortOrder: 1,
      },
      {
        vehicleId: swift.id,
        title: 'Periodic service',
        serviceInterval: '10,000 km / 12 months',
        estimatedCost: 3500,
        sortOrder: 2,
      },
      {
        vehicleId: swift.id,
        title: 'Major service',
        serviceInterval: '40,000 km / 36 months',
        estimatedCost: 8500,
        sortOrder: 3,
      },
    ],
  });

  await prisma.automobileFaq.deleteMany({
    where: { question: { in: ['What is ex-showroom price?', 'How is on-road price calculated?'] } },
  });
  await prisma.automobileFaq.createMany({
    data: [
      {
        question: 'What is ex-showroom price?',
        answer: 'Ex-showroom is the manufacturer price before RTO, insurance, and dealer charges.',
        sortOrder: 1,
        status: 'PUBLISHED',
      },
      {
        question: 'How is on-road price calculated?',
        answer: 'On-road ≈ ex-showroom + registration + insurance + handling charges. Exact figures vary by city.',
        sortOrder: 2,
        status: 'PUBLISHED',
      },
    ],
  });

  await prisma.automobileGuide.upsert({
    where: { slug: 'first-car-buying-guide' },
    update: {
      title: 'First car buying guide',
      summary: 'Budget, body type, fuel, and finance tips for first-time buyers.',
      body: 'Start with total ownership budget (EMI + fuel + insurance + service). Prefer hatchbacks or compact SUVs for city use. Compare mileage, safety rating, and service network before booking a test drive.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: 'First car buying guide',
      slug: 'first-car-buying-guide',
      summary: 'Budget, body type, fuel, and finance tips for first-time buyers.',
      body: 'Start with total ownership budget (EMI + fuel + insurance + service). Prefer hatchbacks or compact SUVs for city use. Compare mileage, safety rating, and service network before booking a test drive.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.automobileComparison.upsert({
    where: { slug: 'swift-vs-creta' },
    update: {
      title: 'Swift vs Creta',
      entityType: 'vehicles',
      entityIds: [swift.id, creta.id],
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: 'Swift vs Creta',
      slug: 'swift-vs-creta',
      entityType: 'vehicles',
      entityIds: [swift.id, creta.id],
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const cretaProduct = await prisma.product.upsert({
    where: { slug: 'hyundai-creta-sx-product' },
    update: { name: 'Hyundai Creta SX', category: 'automobile' },
    create: {
      name: 'Hyundai Creta SX',
      slug: 'hyundai-creta-sx-product',
      category: 'automobile',
      description: 'Review/comparison product for Hyundai Creta SX',
    },
  });

  const vehicleComparisonTemplate = await prisma.comparisonTemplate.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    update: {
      name: 'Vehicle comparison',
      entityType: 'vehicle',
      description: 'Standard vehicle side-by-side attributes',
      attributes: [
        { key: 'price', label: 'Ex-showroom price', valueType: 'currency', sortOrder: 0 },
        { key: 'mileage', label: 'Mileage', valueType: 'text', sortOrder: 1 },
        { key: 'safety', label: 'Safety rating', valueType: 'rating', sortOrder: 2 },
        { key: 'engine', label: 'Engine', valueType: 'text', sortOrder: 3 },
      ],
    },
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      name: 'Vehicle comparison',
      entityType: 'vehicle',
      description: 'Standard vehicle side-by-side attributes',
      attributes: [
        { key: 'price', label: 'Ex-showroom price', valueType: 'currency', sortOrder: 0 },
        { key: 'mileage', label: 'Mileage', valueType: 'text', sortOrder: 1 },
        { key: 'safety', label: 'Safety rating', valueType: 'rating', sortOrder: 2 },
        { key: 'engine', label: 'Engine', valueType: 'text', sortOrder: 3 },
      ],
    },
  });

  const genericVehicleComparison = await prisma.comparison.upsert({
    where: { slug: 'maruti-swift-vs-hyundai-creta' },
    update: {
      title: 'Maruti Swift VXI vs Hyundai Creta SX',
      description: 'Hatchback efficiency vs compact SUV space — which fits your daily drive?',
      comparisonType: 'vehicle',
      entityType: 'vehicle',
      recommendation: 'best_overall',
      winnerEntityType: 'vehicle',
      winnerEntityId: creta.id,
      templateId: vehicleComparisonTemplate.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      viewCount: 84,
    },
    create: {
      title: 'Maruti Swift VXI vs Hyundai Creta SX',
      slug: 'maruti-swift-vs-hyundai-creta',
      description: 'Hatchback efficiency vs compact SUV space — which fits your daily drive?',
      comparisonType: 'vehicle',
      entityType: 'vehicle',
      recommendation: 'best_overall',
      winnerEntityType: 'vehicle',
      winnerEntityId: creta.id,
      templateId: vehicleComparisonTemplate.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      viewCount: 84,
    },
  });

  await prisma.comparisonItem.deleteMany({ where: { comparisonId: genericVehicleComparison.id } });
  await prisma.comparisonAttribute.deleteMany({ where: { comparisonId: genericVehicleComparison.id } });

  const swiftItem = await prisma.comparisonItem.create({
    data: {
      comparisonId: genericVehicleComparison.id,
      productId: swiftProduct.id,
      entityType: 'vehicle',
      entityId: swift.id,
      label: 'Maruti Swift VXI',
      sortOrder: 0,
    },
  });
  const cretaItem = await prisma.comparisonItem.create({
    data: {
      comparisonId: genericVehicleComparison.id,
      productId: cretaProduct.id,
      entityType: 'vehicle',
      entityId: creta.id,
      label: 'Hyundai Creta SX',
      sortOrder: 1,
    },
  });

  const priceAttr = await prisma.comparisonAttribute.create({
    data: {
      comparisonId: genericVehicleComparison.id,
      key: 'price',
      label: 'Ex-showroom price',
      valueType: 'currency',
      groupKey: 'pricing',
      values: ['₹6.5L', '₹12.5L'],
      sortOrder: 0,
    },
  });
  const mileageAttr = await prisma.comparisonAttribute.create({
    data: {
      comparisonId: genericVehicleComparison.id,
      key: 'mileage',
      label: 'Mileage',
      valueType: 'text',
      groupKey: 'performance',
      values: ['22.4 km/l', '17.4 km/l'],
      sortOrder: 1,
    },
  });
  const safetyAttr = await prisma.comparisonAttribute.create({
    data: {
      comparisonId: genericVehicleComparison.id,
      key: 'safety',
      label: 'Safety rating',
      valueType: 'rating',
      groupKey: 'safety',
      values: [2, 5],
      sortOrder: 2,
    },
  });
  const engineAttr = await prisma.comparisonAttribute.create({
    data: {
      comparisonId: genericVehicleComparison.id,
      key: 'engine',
      label: 'Engine',
      valueType: 'text',
      groupKey: 'performance',
      values: ['1197 cc Petrol', '1497 cc Petrol'],
      sortOrder: 3,
    },
  });

  await prisma.comparisonValue.createMany({
    data: [
      { comparisonItemId: swiftItem.id, comparisonAttributeId: priceAttr.id, value: '₹6.5L', highlight: 'best_budget' },
      { comparisonItemId: cretaItem.id, comparisonAttributeId: priceAttr.id, value: '₹12.5L' },
      { comparisonItemId: swiftItem.id, comparisonAttributeId: mileageAttr.id, value: '22.4 km/l', highlight: 'best_value' },
      { comparisonItemId: cretaItem.id, comparisonAttributeId: mileageAttr.id, value: '17.4 km/l' },
      { comparisonItemId: swiftItem.id, comparisonAttributeId: safetyAttr.id, value: 2 },
      { comparisonItemId: cretaItem.id, comparisonAttributeId: safetyAttr.id, value: 5, highlight: 'best_overall' },
      { comparisonItemId: swiftItem.id, comparisonAttributeId: engineAttr.id, value: '1197 cc Petrol' },
      { comparisonItemId: cretaItem.id, comparisonAttributeId: engineAttr.id, value: '1497 cc Petrol' },
    ],
  });

  await seedExpandedComparisons(prisma);

  const directoryTree: Array<{ slug: string; name: string; children?: Array<{ slug: string; name: string }> }> = [
    {
      slug: 'business',
      name: 'Business',
      children: [
        { slug: 'companies', name: 'Companies' },
        { slug: 'startups', name: 'Startups' },
        { slug: 'software-vendors', name: 'Software Vendors' },
        { slug: 'agencies', name: 'Agencies' },
      ],
    },
    {
      slug: 'construction',
      name: 'Construction',
      children: [
        { slug: 'contractors', name: 'Contractors' },
        { slug: 'cement-dealers', name: 'Cement Dealers' },
        { slug: 'steel-suppliers', name: 'Steel Suppliers' },
        { slug: 'hardware-stores', name: 'Hardware Stores' },
        { slug: 'architects', name: 'Architects' },
        { slug: 'engineers', name: 'Engineers' },
        { slug: 'interior-designers', name: 'Interior Designers' },
      ],
    },
    {
      slug: 'automobile',
      name: 'Automobile',
      children: [
        { slug: 'car-dealers', name: 'Car Dealers' },
        { slug: 'service-centers', name: 'Service Centers' },
        { slug: 'ev-charging-stations', name: 'EV Charging Stations' },
        { slug: 'tyre-shops', name: 'Tyre Shops' },
        { slug: 'spare-parts-suppliers', name: 'Spare Parts Suppliers' },
      ],
    },
    {
      slug: 'finance',
      name: 'Finance',
      children: [
        { slug: 'banks', name: 'Banks' },
        { slug: 'nbfcs', name: 'NBFCs' },
        { slug: 'insurance-providers', name: 'Insurance Providers' },
        { slug: 'investment-advisors', name: 'Investment Advisors' },
      ],
    },
    {
      slug: 'home-services',
      name: 'Home',
      children: [
        { slug: 'electricians', name: 'Electricians' },
        { slug: 'plumbers', name: 'Plumbers' },
        { slug: 'painters', name: 'Painters' },
        { slug: 'carpenters', name: 'Carpenters' },
      ],
    },
    {
      slug: 'healthcare',
      name: 'Healthcare',
      children: [
        { slug: 'hospitals', name: 'Hospitals' },
        { slug: 'clinics', name: 'Clinics' },
        { slug: 'diagnostic-centers', name: 'Diagnostic Centers' },
        { slug: 'pharmacies', name: 'Pharmacies' },
      ],
    },
    {
      slug: 'education',
      name: 'Education',
      children: [
        { slug: 'schools', name: 'Schools' },
        { slug: 'colleges', name: 'Colleges' },
        { slug: 'coaching-centers', name: 'Coaching Centers' },
      ],
    },
    {
      slug: 'technology',
      name: 'Technology',
      children: [
        { slug: 'ai-companies', name: 'AI Companies' },
        { slug: 'saas-products', name: 'SaaS Products' },
        { slug: 'cloud-providers', name: 'Cloud Providers' },
      ],
    },
  ];

  for (const parent of directoryTree) {
    const parentRow = await prisma.businessCategory.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name },
      create: { slug: parent.slug, name: parent.name },
    });
    for (const child of parent.children ?? []) {
      await prisma.businessCategory.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parentRow.id },
        create: { slug: child.slug, name: child.name, parentId: parentRow.id },
      });
    }
  }

  const dealerCats = [
    { slug: 'car-dealers', name: 'Car Dealers' },
    { slug: 'showrooms', name: 'Showrooms' },
    { slug: 'service-centers', name: 'Service Centers' },
    { slug: 'charging-stations', name: 'Charging Stations' },
    { slug: 'spare-parts', name: 'Spare Parts Suppliers' },
  ] as const;
  const dealerCatIds: Record<string, string> = {};
  for (const cat of dealerCats) {
    const row = await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
    dealerCatIds[cat.slug] = row.id;
  }

  const dealerBiz = await prisma.business.upsert({
    where: { slug: 'city-auto-motors' },
    update: {
      name: 'City Auto Motors',
      description: 'Authorized passenger car dealer and service center.',
      phone: '+91 98765 11122',
      status: BusinessStatus.APPROVED,
      metadata: { sponsored: true, vertical: 'automobile' },
    },
    create: {
      name: 'City Auto Motors',
      slug: 'city-auto-motors',
      description: 'Authorized passenger car dealer and service center.',
      phone: '+91 98765 11122',
      status: BusinessStatus.APPROVED,
      metadata: { sponsored: true, vertical: 'automobile' },
    },
  });
  if (dealerCatIds['car-dealers']) {
    await prisma.businessCategoryLink.upsert({
      where: {
        businessId_categoryId: { businessId: dealerBiz.id, categoryId: dealerCatIds['car-dealers']! },
      },
      update: {},
      create: { businessId: dealerBiz.id, categoryId: dealerCatIds['car-dealers']! },
    });
  }
  const dealerLoc = await prisma.businessLocation.findFirst({
    where: { businessId: dealerBiz.id, city: 'Hyderabad', deletedAt: null },
  });
  if (!dealerLoc) {
    await prisma.businessLocation.create({
      data: {
        businessId: dealerBiz.id,
        label: 'Showroom',
        address1: 'Banjara Hills Road No. 12',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'IN',
      },
    });
  }

  await prisma.tag.upsert({
    where: { slug: 'automobile' },
    update: { name: 'Automobile' },
    create: { name: 'Automobile', slug: 'automobile' },
  });

  const aiCategoryTree: Array<{ slug: string; name: string; children?: Array<{ slug: string; name: string }> }> = [
    {
      slug: 'writing',
      name: 'Writing',
      children: [
        { slug: 'ai-writing', name: 'AI Writing' },
        { slug: 'copywriting', name: 'Copywriting' },
        { slug: 'blogging', name: 'Blogging' },
        { slug: 'grammar', name: 'Grammar' },
        { slug: 'summarization', name: 'Summarization' },
      ],
    },
    {
      slug: 'image',
      name: 'Image',
      children: [
        { slug: 'image-generation', name: 'Image Generation' },
        { slug: 'image-editing', name: 'Image Editing' },
        { slug: 'upscaling', name: 'Upscaling' },
        { slug: 'background-removal', name: 'Background Removal' },
      ],
    },
    {
      slug: 'video',
      name: 'Video',
      children: [
        { slug: 'video-generation', name: 'Video Generation' },
        { slug: 'video-editing', name: 'Video Editing' },
        { slug: 'animation', name: 'Animation' },
        { slug: 'avatars', name: 'Avatars' },
      ],
    },
    {
      slug: 'audio',
      name: 'Audio',
      children: [
        { slug: 'speech-to-text', name: 'Speech-to-Text' },
        { slug: 'text-to-speech', name: 'Text-to-Speech' },
        { slug: 'voice-cloning', name: 'Voice Cloning' },
        { slug: 'music-generation', name: 'Music Generation' },
      ],
    },
    {
      slug: 'coding',
      name: 'Coding',
      children: [
        { slug: 'code-generation', name: 'Code Generation' },
        { slug: 'code-review', name: 'Code Review' },
        { slug: 'debugging', name: 'Debugging' },
        { slug: 'api-assistants', name: 'API Assistants' },
      ],
    },
    {
      slug: 'productivity',
      name: 'Productivity',
      children: [
        { slug: 'meeting-assistants', name: 'Meeting Assistants' },
        { slug: 'note-taking', name: 'Note Taking' },
        { slug: 'scheduling', name: 'Scheduling' },
        { slug: 'workflow-automation', name: 'Workflow Automation' },
      ],
    },
    {
      slug: 'marketing',
      name: 'Marketing',
      children: [
        { slug: 'seo', name: 'SEO' },
        { slug: 'email-marketing', name: 'Email Marketing' },
        { slug: 'social-media', name: 'Social Media' },
        { slug: 'advertising', name: 'Advertising' },
      ],
    },
    {
      slug: 'business',
      name: 'Business',
      children: [
        { slug: 'crm', name: 'CRM' },
        { slug: 'analytics-ai', name: 'Analytics' },
        { slug: 'customer-support', name: 'Customer Support' },
        { slug: 'automation', name: 'Automation' },
      ],
    },
    {
      slug: 'education',
      name: 'Education',
      children: [
        { slug: 'learning', name: 'Learning' },
        { slug: 'tutoring', name: 'Tutoring' },
        { slug: 'research', name: 'Research' },
        { slug: 'flashcards', name: 'Flashcards' },
      ],
    },
    {
      slug: 'developer',
      name: 'Developer',
      children: [
        { slug: 'apis', name: 'APIs' },
        { slug: 'llm-platforms', name: 'LLM Platforms' },
        { slug: 'ai-frameworks', name: 'AI Frameworks' },
        { slug: 'agents', name: 'Agents' },
      ],
    },
  ];

  const aiCatIds: Record<string, string> = {};
  for (const parent of aiCategoryTree) {
    const parentRow = await prisma.aiCategory.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name },
      create: { slug: parent.slug, name: parent.name },
    });
    aiCatIds[parent.slug] = parentRow.id;
    for (const child of parent.children ?? []) {
      const childRow = await prisma.aiCategory.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parentRow.id },
        create: { slug: child.slug, name: child.name, parentId: parentRow.id },
      });
      aiCatIds[child.slug] = childRow.id;
    }
  }

  const sampleTools = [
    {
      slug: 'openai-chatgpt',
      name: 'ChatGPT',
      categorySlug: 'llm-platforms',
      description: 'Conversational AI assistant for writing, coding, analysis, and productivity.',
      shortDescription: 'OpenAI conversational AI',
      pricingModel: 'FREEMIUM' as const,
      freePlan: true,
      freeTrial: false,
      apiAvailable: true,
      website: 'https://chatgpt.com',
      documentation: 'https://platform.openai.com/docs',
      featured: true,
      sponsored: false,
      features: ['AI Chat', 'Code Generation', 'Image Generation', 'API', 'Team Collaboration'],
      integrations: ['Zapier', 'Slack', 'Microsoft Teams'],
      platforms: ['Web', 'iOS', 'Android', 'API'],
    },
    {
      slug: 'anthropic-claude',
      name: 'Claude',
      categorySlug: 'llm-platforms',
      description: 'Helpful, honest, and harmless AI assistant from Anthropic with strong reasoning.',
      shortDescription: 'Anthropic AI assistant',
      pricingModel: 'FREEMIUM' as const,
      freePlan: true,
      freeTrial: false,
      apiAvailable: true,
      website: 'https://claude.ai',
      documentation: 'https://docs.anthropic.com',
      featured: true,
      sponsored: true,
      features: ['AI Chat', 'Long Context', 'API', 'Artifacts', 'Projects'],
      integrations: ['Slack', 'Google Drive', 'GitHub'],
      platforms: ['Web', 'API'],
    },
    {
      slug: 'midjourney',
      name: 'Midjourney',
      categorySlug: 'image-generation',
      description: 'AI image generation platform known for artistic, high-quality visuals.',
      shortDescription: 'AI image generation',
      pricingModel: 'SUBSCRIPTION' as const,
      freePlan: false,
      freeTrial: false,
      apiAvailable: false,
      website: 'https://www.midjourney.com',
      documentation: null,
      featured: true,
      sponsored: false,
      features: ['Image Generation', 'Upscaling', 'Style Reference'],
      integrations: ['Discord'],
      platforms: ['Web', 'Discord'],
    },
  ] as const;

  for (const tool of sampleTools) {
    const categoryId = aiCatIds[tool.categorySlug] ?? null;
    const row = await prisma.aiTool.upsert({
      where: { slug: tool.slug },
      update: {
        name: tool.name,
        description: tool.description,
        shortDescription: tool.shortDescription,
        pricingModel: tool.pricingModel,
        freePlan: tool.freePlan,
        freeTrial: tool.freeTrial,
        apiAvailable: tool.apiAvailable,
        website: tool.website,
        documentation: tool.documentation,
        featured: tool.featured,
        sponsored: tool.sponsored,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId,
        platforms: [...tool.platforms],
      },
      create: {
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        shortDescription: tool.shortDescription,
        pricingModel: tool.pricingModel,
        freePlan: tool.freePlan,
        freeTrial: tool.freeTrial,
        apiAvailable: tool.apiAvailable,
        website: tool.website,
        documentation: tool.documentation,
        featured: tool.featured,
        sponsored: tool.sponsored,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId,
        platforms: [...tool.platforms],
      },
    });

    await prisma.aiToolFeature.deleteMany({ where: { toolId: row.id } });
    await prisma.aiToolFeature.createMany({
      data: tool.features.map((name, i) => ({ id: randomUUID(), toolId: row.id, name, sortOrder: i })),
    });
    await prisma.aiToolIntegration.deleteMany({ where: { toolId: row.id } });
    await prisma.aiToolIntegration.createMany({
      data: tool.integrations.map((name, i) => ({ id: randomUUID(), toolId: row.id, name, sortOrder: i })),
    });
  }

  // Seed popular search keywords for suggestions
  for (const [keyword, searchCount] of [
    ['home loan', 42],
    ['emi calculator', 38],
    ['ai tools', 31],
    ['electric scooter', 27],
    ['cement price', 19],
  ] as const) {
    await prisma.popularSearch.upsert({
      where: { keyword },
      update: { searchCount },
      create: { keyword, searchCount },
    });
  }

  // Keep TypeScript happy that UserStatus is used in seed surface
  void UserStatus.ACTIVE;

  const defaultTemplates = [
    {
      slug: 'user.welcome',
      name: 'Welcome',
      channel: 'IN_APP' as const,
      subject: 'Welcome to Varnarc',
      body: 'Hi {{name}}, welcome to Varnarc. Explore calculators, guides, and tools.',
    },
    {
      slug: 'review.approved',
      name: 'Review approved',
      channel: 'IN_APP' as const,
      subject: 'Your review was approved',
      body: 'Your review "{{title}}" is now live.',
    },
    {
      slug: 'lead.created',
      name: 'New lead',
      channel: 'IN_APP' as const,
      subject: 'New directory lead',
      body: 'You received a new lead for {{businessName}}.',
    },
  ];

  for (const tpl of defaultTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { slug: tpl.slug },
      update: { name: tpl.name, channel: tpl.channel, subject: tpl.subject, body: tpl.body },
      create: tpl,
    });
  }

  await seedContent(prisma);

  await seedMenu('main-header', 'Main header', 'header', [
    { label: 'Home', href: '/' },
    { label: 'Finance', href: '/finance' },
    { label: 'Home & Construction', href: '/construction' },
    { label: 'Automobile', href: '/automobile' },
    { label: 'Solar', href: '/solar' },
    { label: 'Calculators', href: '/calculators' },
    { label: 'AI Tools', href: '/ai-tools' },
    { label: 'Compare', href: '/compare' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Blog', href: '/articles' },
    { label: 'Tags', href: '/tags' },
    { label: 'Directory', href: '/directory' },
  ]);

  await seedMenu('main-footer', 'Main footer', 'footer', [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Blog', href: '/articles' },
    { label: 'Comparisons', href: '/compare' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Directory', href: '/directory' },
  ]);

  await seedHomepage(prisma);
  await seedPremiumPlans(prisma);
  await seedNewsletter(prisma);

  console.log(
    'Seeded Auth0 RBAC, themes, ads, calculators, finance, construction, automobile, reviews, comparisons, articles, directory, AI tools, search, menus, homepage, and newsletter',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
