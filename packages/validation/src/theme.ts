import { z } from 'zod';
import { jsonValueSchema, slugSchema, uuidSchema } from './common';

const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid hex color');

const optionalHex = hexColorSchema.optional().nullable();
const optionalUrl = z
  .union([z.string().url(), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v));

export const themeColorPaletteSchema = z
  .object({
    primary: optionalHex,
    secondary: optionalHex,
    accent: optionalHex,
    success: optionalHex,
    warning: optionalHex,
    danger: optionalHex,
    info: optionalHex,
    background: optionalHex,
    surface: optionalHex,
    border: optionalHex,
    textPrimary: optionalHex,
    textSecondary: optionalHex,
    link: optionalHex,
    footer: optionalHex,
    header: optionalHex,
    sidebar: optionalHex,
    button: optionalHex,
    hover: optionalHex,
  })
  .partial();

export const themeColorsSchema = z
  .object({
    light: themeColorPaletteSchema.optional(),
    dark: themeColorPaletteSchema.optional(),
  })
  .partial();

export const themeBrandingSchema = z
  .object({
    siteName: z.string().min(1).max(120).optional().nullable(),
    siteTagline: z.string().max(240).optional().nullable(),
    logoUrl: optionalUrl,
    darkLogoUrl: optionalUrl,
    faviconUrl: optionalUrl,
    appleTouchIconUrl: optionalUrl,
    ogImageUrl: optionalUrl,
    logoMediaId: uuidSchema.optional().nullable(),
    darkLogoMediaId: uuidSchema.optional().nullable(),
    faviconMediaId: uuidSchema.optional().nullable(),
    ogImageMediaId: uuidSchema.optional().nullable(),
    logoWidth: z.number().int().min(16).max(2048).optional().nullable(),
    logoHeight: z.number().int().min(16).max(2048).optional().nullable(),
  })
  .partial()
  .superRefine((value, ctx) => {
    if (value.logoWidth && value.logoHeight) {
      const ratio = value.logoWidth / value.logoHeight;
      if (ratio < 0.2 || ratio > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Logo dimensions look invalid (unexpected aspect ratio).',
          path: ['logoWidth'],
        });
      }
    }
  });

export const themeFontsSchema = z
  .object({
    body: z.string().max(120).optional().nullable(),
    heading: z.string().max(120).optional().nullable(),
    baseSize: z.string().max(20).optional().nullable(),
    headingScale: z.number().min(1).max(2).optional().nullable(),
    lineHeight: z.number().min(1).max(2.5).optional().nullable(),
    letterSpacing: z.string().max(20).optional().nullable(),
    weight: z.union([z.string(), z.number()]).optional().nullable(),
    googleFonts: z.array(z.string().max(80)).max(6).optional().nullable(),
  })
  .partial();

export const themeLayoutSchema = z
  .object({
    containerWidth: z.string().max(40).optional().nullable(),
    sidebarWidth: z.string().max(40).optional().nullable(),
    headerStyle: z.enum(['solid', 'transparent', 'blur']).optional().nullable(),
    footerStyle: z.enum(['simple', 'columns', 'centered']).optional().nullable(),
    cardRadius: z.string().max(20).optional().nullable(),
    spacingScale: z.string().max(40).optional().nullable(),
    sectionPadding: z.string().max(40).optional().nullable(),
    gridColumns: z.number().int().min(1).max(24).optional().nullable(),
    maxContentWidth: z.string().max(40).optional().nullable(),
  })
  .partial();

export const themeNavigationSchema = z
  .object({
    stickyHeader: z.boolean().optional().nullable(),
    breadcrumbs: z.boolean().optional().nullable(),
    mobileNav: z.enum(['drawer', 'sheet', 'dropdown']).optional().nullable(),
    headerMenuLocation: z.string().max(40).optional().nullable(),
    footerMenuLocation: z.string().max(40).optional().nullable(),
  })
  .partial();

export const themeFooterSchema = z
  .object({
    layout: z.enum(['simple', 'columns', 'centered']).optional().nullable(),
    columns: z.number().int().min(1).max(6).optional().nullable(),
    copyright: z.string().max(240).optional().nullable(),
    socialLinks: z
      .array(
        z.object({
          label: z.string().min(1).max(60),
          href: z.string().url(),
        }),
      )
      .max(12)
      .optional()
      .nullable(),
    newsletterEnabled: z.boolean().optional().nullable(),
    showAds: z.boolean().optional().nullable(),
  })
  .partial();

export const themeComponentTokensSchema = z
  .object({
    button: z
      .object({
        radius: z.string().max(20).optional().nullable(),
        paddingX: z.string().max(20).optional().nullable(),
        paddingY: z.string().max(20).optional().nullable(),
        fontWeight: z.string().max(20).optional().nullable(),
      })
      .partial()
      .optional(),
    card: z
      .object({
        radius: z.string().max(20).optional().nullable(),
        shadow: z.enum(['none', 'sm', 'md', 'lg']).optional().nullable(),
        border: z.boolean().optional().nullable(),
      })
      .partial()
      .optional(),
    table: z
      .object({
        density: z.enum(['compact', 'comfortable', 'spacious']).optional().nullable(),
        striped: z.boolean().optional().nullable(),
      })
      .partial()
      .optional(),
    form: z
      .object({
        inputRadius: z.string().max(20).optional().nullable(),
        labelWeight: z.string().max(20).optional().nullable(),
      })
      .partial()
      .optional(),
    alert: z.object({ radius: z.string().max(20).optional().nullable() }).partial().optional(),
    badge: z.object({ radius: z.string().max(20).optional().nullable() }).partial().optional(),
    modal: z
      .object({
        radius: z.string().max(20).optional().nullable(),
        overlayOpacity: z.string().max(10).optional().nullable(),
      })
      .partial()
      .optional(),
    pagination: z.object({ radius: z.string().max(20).optional().nullable() }).partial().optional(),
    breadcrumbs: z.object({ separator: z.string().max(8).optional().nullable() }).partial().optional(),
    tags: z.object({ radius: z.string().max(20).optional().nullable() }).partial().optional(),
  })
  .partial();

export const themeTokensSchema = z
  .object({
    layout: themeLayoutSchema.optional(),
    navigation: themeNavigationSchema.optional(),
    footer: themeFooterSchema.optional(),
    components: themeComponentTokensSchema.or(jsonValueSchema).optional().nullable(),
  })
  .passthrough();

export const themeAssetTypeSchema = z.enum([
  'logo',
  'dark_logo',
  'favicon',
  'apple_touch_icon',
  'og_image',
]);

export const themeSeasonSchema = z.enum([
  'spring',
  'summer',
  'fall',
  'winter',
  'holiday',
  'custom',
]);

export const createThemeSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  tokens: themeTokensSchema.or(jsonValueSchema).default({}),
  fonts: themeFontsSchema.or(jsonValueSchema).optional().nullable(),
  colors: themeColorsSchema.or(jsonValueSchema).optional().nullable(),
  branding: themeBrandingSchema.or(jsonValueSchema).optional().nullable(),
  cssVars: z.record(z.string()).optional().nullable(),
  isDefault: z.boolean().default(false),
  isSystem: z.boolean().default(false),
  tenantKey: z.string().max(80).optional().nullable(),
  season: themeSeasonSchema.optional().nullable(),
  scheduledFrom: z.coerce.date().optional().nullable(),
  scheduledUntil: z.coerce.date().optional().nullable(),
  marketplaceListed: z.boolean().default(false),
});

export const updateThemeSchema = createThemeSchema.partial();

export const upsertThemeAssetSchema = z.object({
  themeId: uuidSchema,
  type: themeAssetTypeSchema,
  mediaId: uuidSchema.optional().nullable(),
  url: z
    .union([z.string().url(), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
});

export const importThemeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional().nullable(),
  tokens: themeTokensSchema.or(jsonValueSchema).optional(),
  fonts: themeFontsSchema.or(jsonValueSchema).optional().nullable(),
  colors: themeColorsSchema.or(jsonValueSchema).optional().nullable(),
  branding: themeBrandingSchema.or(jsonValueSchema).optional().nullable(),
  cssVars: z.record(z.string()).optional().nullable(),
  season: themeSeasonSchema.optional().nullable(),
  marketplaceListed: z.boolean().optional(),
});

export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
export type UpsertThemeAssetInput = z.infer<typeof upsertThemeAssetSchema>;
export type ImportThemeInput = z.infer<typeof importThemeSchema>;
export type ThemeAssetType = z.infer<typeof themeAssetTypeSchema>;
