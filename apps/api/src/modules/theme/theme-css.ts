type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function pickString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function mapPalette(
  palette: JsonRecord,
  defaults: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  const pairs: Array<[string, string]> = [
    ['primary', '--color-primary'],
    ['secondary', '--color-secondary'],
    ['accent', '--color-accent'],
    ['success', '--color-success'],
    ['warning', '--color-warning'],
    ['danger', '--color-danger'],
    ['info', '--color-info'],
    ['background', '--color-background'],
    ['surface', '--color-surface'],
    ['border', '--color-border'],
    ['textPrimary', '--color-text-primary'],
    ['textSecondary', '--color-text-secondary'],
    ['link', '--color-link'],
    ['footer', '--color-footer'],
    ['header', '--color-header'],
    ['sidebar', '--color-sidebar'],
    ['button', '--color-button'],
    ['hover', '--color-hover'],
  ];

  for (const [key, cssVar] of pairs) {
    const value = pickString(palette, key);
    if (value) out[cssVar] = value;
  }

  // Platform aliases
  out['--varnarc-brand'] = out['--color-primary'] ?? defaults['--color-primary']!;
  out['--varnarc-accent'] = out['--color-accent'] ?? defaults['--color-accent']!;
  out['--varnarc-bg'] = out['--color-background'] ?? defaults['--color-background']!;
  out['--varnarc-surface'] = out['--color-surface'] ?? defaults['--color-surface']!;
  out['--varnarc-ink'] = out['--color-text-primary'] ?? defaults['--color-text-primary']!;
  out['--varnarc-subtle'] = out['--color-text-secondary'] ?? defaults['--color-text-secondary']!;
  out['--varnarc-border'] = out['--color-border'] ?? defaults['--color-border']!;
  out['--vn-navy'] = out['--color-primary'] ?? defaults['--color-primary']!;
  out['--vn-orange'] = out['--color-accent'] ?? defaults['--color-accent']!;
  out['--vn-canvas'] = out['--color-background'] ?? defaults['--color-background']!;
  out['--vn-surface'] = out['--color-surface'] ?? defaults['--color-surface']!;
  out['--vn-ink'] = out['--color-text-primary'] ?? defaults['--color-text-primary']!;
  out['--vn-subtle'] = out['--color-text-secondary'] ?? defaults['--color-text-secondary']!;
  out['--vn-border'] = out['--color-border'] ?? defaults['--color-border']!;
  out['--vn-footer'] = out['--color-footer'] ?? defaults['--color-footer']!;
  out['--vn-header'] = out['--color-header'] ?? defaults['--color-header']!;
  out['--vn-link'] = out['--color-link'] ?? defaults['--color-link']!;
  out['--vn-button'] = out['--color-button'] ?? defaults['--color-button']!;
  out['--vn-hover'] = out['--color-hover'] ?? defaults['--color-hover']!;

  return out;
}

const LIGHT_DEFAULTS: Record<string, string> = {
  '--color-primary': '#0b1f3a',
  '--color-secondary': '#64748b',
  '--color-accent': '#f97316',
  '--color-success': '#16a34a',
  '--color-warning': '#f59e0b',
  '--color-danger': '#dc2626',
  '--color-info': '#0ea5e9',
  '--color-background': '#f7f8fb',
  '--color-surface': '#ffffff',
  '--color-border': '#e2e8f0',
  '--color-text-primary': '#0b1f3a',
  '--color-text-secondary': '#475569',
  '--color-link': '#0b1f3a',
  '--color-footer': '#071428',
  '--color-header': '#ffffff',
  '--color-sidebar': '#ffffff',
  '--color-button': '#0b1f3a',
  '--color-hover': '#ea580c',
};

const DARK_DEFAULTS: Record<string, string> = {
  '--color-primary': '#60a5fa',
  '--color-secondary': '#94a3b8',
  '--color-accent': '#f97316',
  '--color-success': '#22c55e',
  '--color-warning': '#fbbf24',
  '--color-danger': '#f87171',
  '--color-info': '#38bdf8',
  '--color-background': '#0f1720',
  '--color-surface': '#16202b',
  '--color-border': '#2a394a',
  '--color-text-primary': '#e8eef5',
  '--color-text-secondary': '#9aa8ba',
  '--color-link': '#60a5fa',
  '--color-footer': '#020617',
  '--color-header': '#16202b',
  '--color-sidebar': '#16202b',
  '--color-button': '#60a5fa',
  '--color-hover': '#f97316',
};

/** Maps theme color/font/token fields onto the platform CSS variable contract. */
export function buildThemeCssVariables(theme: {
  colors?: unknown;
  fonts?: unknown;
  tokens?: unknown;
  branding?: unknown;
  cssVars?: unknown;
}): { light: Record<string, string>; dark: Record<string, string> } {
  const colors = asRecord(theme.colors);
  const lightColors = asRecord(colors.light);
  const darkColors = asRecord(colors.dark);
  const fonts = asRecord(theme.fonts);
  const tokens = asRecord(theme.tokens);
  const layout = asRecord(tokens.layout);
  const overrides = asRecord(theme.cssVars);

  const light = mapPalette(lightColors, LIGHT_DEFAULTS);
  light['--vn-radius-md'] = pickString(layout, 'cardRadius') ?? '0.5rem';
  light['--vn-container'] = pickString(layout, 'containerWidth') ?? '80%';
  light['--vn-sidebar-width'] = pickString(layout, 'sidebarWidth') ?? '16rem';
  light['--vn-section-padding'] = pickString(layout, 'sectionPadding') ?? '4rem';
  light['--vn-max-content'] = pickString(layout, 'maxContentWidth') ?? '48rem';
  light['--font-body'] = pickString(fonts, 'body') ?? 'DM Sans';
  light['--font-heading'] = pickString(fonts, 'heading') ?? 'Fraunces';
  light['--font-size-base'] = pickString(fonts, 'baseSize') ?? '16px';
  if (pickString(fonts, 'letterSpacing')) {
    light['--font-letter-spacing'] = pickString(fonts, 'letterSpacing')!;
  }
  if (typeof fonts.lineHeight === 'number') {
    light['--font-line-height'] = String(fonts.lineHeight);
  }
  if (fonts.weight != null) {
    light['--font-weight'] = String(fonts.weight);
  }
  if (typeof fonts.headingScale === 'number') {
    light['--font-heading-scale'] = String(fonts.headingScale);
  }

  const components = asRecord(tokens.components);
  const button = asRecord(components.button);
  const card = asRecord(components.card);
  light['--vn-button-radius'] = pickString(button, 'radius') ?? light['--vn-radius-md'];
  light['--vn-card-radius'] = pickString(card, 'radius') ?? light['--vn-radius-md'];

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string' && value.trim()) {
      light[key.startsWith('--') ? key : `--${key}`] = value.trim();
    }
  }

  const dark = mapPalette(darkColors, DARK_DEFAULTS);
  dark['--vn-button-radius'] = light['--vn-button-radius'];
  dark['--vn-card-radius'] = light['--vn-card-radius'];
  dark['--vn-radius-md'] = light['--vn-radius-md'];
  dark['--vn-container'] = light['--vn-container'];

  return { light, dark };
}

export function themeCssToStyleBlock(vars: {
  light: Record<string, string>;
  dark: Record<string, string>;
}): string {
  const toBlock = (map: Record<string, string>) =>
    Object.entries(map)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

  return `:root {\n${toBlock(vars.light)}\n}\n.dark {\n${toBlock(vars.dark)}\n}`;
}

export function resolveThemeBranding(theme: Record<string, unknown>) {
  const branding = asRecord(theme.branding);
  const assets = Array.isArray(theme.assets) ? theme.assets : [];

  const assetUrl = (type: string) => {
    const match = assets.find((item) => {
      const row = asRecord(item);
      return row.type === type;
    });
    if (!match) return undefined;
    const row = asRecord(match);
    const media = asRecord(row.media);
    return (
      pickString(row, 'url') ||
      pickString(media, 'secureUrl') ||
      pickString(media, 'url')
    );
  };

  return {
    siteName: pickString(branding, 'siteName') ?? null,
    siteTagline: pickString(branding, 'siteTagline') ?? null,
    logoUrl: pickString(branding, 'logoUrl') ?? assetUrl('logo') ?? null,
    darkLogoUrl: pickString(branding, 'darkLogoUrl') ?? assetUrl('dark_logo') ?? null,
    faviconUrl: pickString(branding, 'faviconUrl') ?? assetUrl('favicon') ?? null,
    appleTouchIconUrl:
      pickString(branding, 'appleTouchIconUrl') ?? assetUrl('apple_touch_icon') ?? null,
    ogImageUrl: pickString(branding, 'ogImageUrl') ?? assetUrl('og_image') ?? null,
  };
}

export const DEFAULT_THEME_PAYLOAD = {
  description: 'Default Varnarc brand theme',
  branding: {
    siteName: 'Varnarc',
    siteTagline: 'Smart Tools & Expert Guides',
    logoUrl: null,
    darkLogoUrl: null,
    faviconUrl: null,
    appleTouchIconUrl: null,
    ogImageUrl: null,
  },
  colors: {
    light: {
      primary: '#0b1f3a',
      secondary: '#64748b',
      accent: '#f97316',
      success: '#16a34a',
      warning: '#f59e0b',
      danger: '#dc2626',
      info: '#0ea5e9',
      background: '#f7f8fb',
      surface: '#ffffff',
      border: '#e2e8f0',
      textPrimary: '#0b1f3a',
      textSecondary: '#475569',
      link: '#0b1f3a',
      footer: '#071428',
      header: '#ffffff',
      sidebar: '#ffffff',
      button: '#0b1f3a',
      hover: '#ea580c',
    },
    dark: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      accent: '#f97316',
      success: '#22c55e',
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#38bdf8',
      background: '#0f1720',
      surface: '#16202b',
      border: '#2a394a',
      textPrimary: '#e8eef5',
      textSecondary: '#9aa8ba',
      link: '#60a5fa',
      footer: '#020617',
      header: '#16202b',
      sidebar: '#16202b',
      button: '#60a5fa',
      hover: '#f97316',
    },
  },
  fonts: {
    body: 'DM Sans',
    heading: 'Fraunces',
    baseSize: '16px',
    headingScale: 1.25,
    lineHeight: 1.5,
    letterSpacing: '0',
    weight: 400,
    googleFonts: ['DM Sans', 'Fraunces'],
  },
  tokens: {
    layout: {
      containerWidth: '80%',
      sidebarWidth: '16rem',
      headerStyle: 'solid',
      footerStyle: 'columns',
      cardRadius: '0.5rem',
      spacingScale: '1rem',
      sectionPadding: '4rem',
      gridColumns: 12,
      maxContentWidth: '48rem',
    },
    navigation: {
      stickyHeader: true,
      breadcrumbs: true,
      mobileNav: 'drawer',
    },
    footer: {
      layout: 'columns',
      columns: 4,
      copyright: '© Varnarc. All rights reserved.',
      socialLinks: [],
      newsletterEnabled: true,
      showAds: true,
    },
    components: {
      button: { radius: '0.5rem', paddingX: '1rem', paddingY: '0.5rem', fontWeight: '600' },
      card: { radius: '0.75rem', shadow: 'sm', border: true },
      table: { density: 'comfortable', striped: false },
      form: { inputRadius: '0.5rem', labelWeight: '500' },
      alert: { radius: '0.5rem' },
      badge: { radius: '999px' },
      modal: { radius: '0.75rem', overlayOpacity: '0.5' },
      pagination: { radius: '0.375rem' },
      breadcrumbs: { separator: '/' },
      tags: { radius: '0.375rem' },
    },
  },
};
