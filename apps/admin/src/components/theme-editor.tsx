'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';
import { MediaPicker } from '@/components/media-picker';
import { DateTimeLocalInput } from '@/components/datetime-local-input';

type ThemeColors = {
  light?: Record<string, string | null | undefined>;
  dark?: Record<string, string | null | undefined>;
};

type ThemeBranding = {
  siteName?: string | null;
  siteTagline?: string | null;
  logoUrl?: string | null;
  darkLogoUrl?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  logoMediaId?: string | null;
  darkLogoMediaId?: string | null;
};

type ThemeFonts = {
  body?: string | null;
  heading?: string | null;
  baseSize?: string | null;
  headingScale?: number | null;
  lineHeight?: number | null;
  letterSpacing?: string | null;
  weight?: string | number | null;
};

type ComponentTokens = Record<string, Record<string, string | boolean | null | undefined>>;

type ThemeTokens = {
  layout?: Record<string, unknown>;
  navigation?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  components?: ComponentTokens;
};

export type ThemeEditorValue = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  branding?: ThemeBranding | null;
  colors?: ThemeColors | null;
  fonts?: ThemeFonts | null;
  tokens?: ThemeTokens | null;
  isDefault?: boolean;
  tenantKey?: string | null;
  season?: string | null;
  scheduledFrom?: string | null;
  scheduledUntil?: string | null;
  marketplaceListed?: boolean;
};

const COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
  'background',
  'surface',
  'border',
  'textPrimary',
  'textSecondary',
  'link',
  'footer',
  'header',
  'sidebar',
  'button',
  'hover',
] as const;

const COMPONENT_KEYS = [
  'button',
  'card',
  'table',
  'form',
  'alert',
  'badge',
  'modal',
  'pagination',
  'breadcrumbs',
  'tags',
] as const;

type TabId =
  | 'branding'
  | 'colors'
  | 'typography'
  | 'layout'
  | 'components'
  | 'navigation'
  | 'schedule'
  | 'visual'
  | 'preview';

export function ThemeEditor({ theme }: { theme: ThemeEditorValue }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('branding');
  const [name, setName] = useState(theme.name);
  const [description, setDescription] = useState(theme.description ?? '');
  const [branding, setBranding] = useState<ThemeBranding>(theme.branding ?? {});
  const [colors, setColors] = useState<ThemeColors>(theme.colors ?? { light: {}, dark: {} });
  const [fonts, setFonts] = useState<ThemeFonts>(theme.fonts ?? {});
  const [tokens, setTokens] = useState<ThemeTokens>(theme.tokens ?? {});
  const [tenantKey, setTenantKey] = useState(theme.tenantKey ?? '');
  const [season, setSeason] = useState(theme.season ?? '');
  const [scheduledFrom, setScheduledFrom] = useState(
    theme.scheduledFrom ? theme.scheduledFrom.slice(0, 16) : '',
  );
  const [scheduledUntil, setScheduledUntil] = useState(
    theme.scheduledUntil ? theme.scheduledUntil.slice(0, 16) : '',
  );
  const [marketplaceListed, setMarketplaceListed] = useState(Boolean(theme.marketplaceListed));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewStyle = useMemo(() => {
    const light = colors.light ?? {};
    return {
      background: light.background ?? '#f7f8fb',
      color: light.textPrimary ?? '#0b1f3a',
      borderColor: light.border ?? '#e2e8f0',
      ['--preview-accent' as string]: light.accent ?? '#f97316',
      ['--preview-brand' as string]: light.primary ?? '#0b1f3a',
      ['--preview-surface' as string]: light.surface ?? '#ffffff',
      borderRadius: String(tokens.layout?.cardRadius ?? '0.5rem'),
    } as React.CSSProperties;
  }, [colors, tokens.layout?.cardRadius]);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: theme.id,
          name,
          description: description || null,
          branding,
          colors,
          fonts,
          tokens,
          tenantKey: tenantKey || null,
          season: season || null,
          scheduledFrom: scheduledFrom ? new Date(scheduledFrom).toISOString() : null,
          scheduledUntil: scheduledUntil ? new Date(scheduledUntil).toISOString() : null,
          marketplaceListed,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save theme');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/themes/${theme.id}`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to publish theme');
      setMessage('Published as active theme');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function resetDefaults() {
    if (!confirm('Reset this theme to system defaults?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/themes/${theme.id}?action=reset`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string }; data?: ThemeEditorValue };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to reset theme');
      if (json.data) {
        setName(json.data.name);
        setDescription(json.data.description ?? '');
        setBranding(json.data.branding ?? {});
        setColors(json.data.colors ?? { light: {}, dark: {} });
        setFonts(json.data.fonts ?? {});
        setTokens(json.data.tokens ?? {});
      }
      setMessage('Reset to defaults');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function exportTheme() {
    const payload = {
      name,
      slug: theme.slug,
      description: description || null,
      branding,
      colors,
      fonts,
      tokens,
      season: season || null,
      marketplaceListed,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.slug}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'branding', label: 'Branding' },
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'layout', label: 'Layout' },
    { id: 'components', label: 'Components' },
    { id: 'navigation', label: 'Nav / Footer' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'visual', label: 'Visual' },
    { id: 'preview', label: 'Preview' },
  ];

  const cardRadius = Number.parseFloat(String(tokens.layout?.cardRadius ?? '0.5')) || 0.5;
  const sectionPadding = Number.parseFloat(String(tokens.layout?.sectionPadding ?? '4')) || 4;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === item.id
                ? 'bg-[var(--varnarc-brand)] text-white'
                : 'border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'branding' ? (
        <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Name</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Description</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Site name</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={branding.siteName ?? ''}
              onChange={(e) => setBranding({ ...branding, siteName: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Tagline</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={branding.siteTagline ?? ''}
              onChange={(e) => setBranding({ ...branding, siteTagline: e.target.value })}
            />
          </label>
          <div className="md:col-span-2">
            <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Logo (media library)</span>
            <MediaPicker
              value={branding.logoMediaId ?? null}
              previewUrl={branding.logoUrl}
              onChange={(id, preview) =>
                setBranding({
                  ...branding,
                  logoMediaId: id,
                  logoUrl: preview || branding.logoUrl,
                })
              }
            />
          </div>
          <div className="md:col-span-2">
            <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Dark logo</span>
            <MediaPicker
              value={branding.darkLogoMediaId ?? null}
              previewUrl={branding.darkLogoUrl}
              onChange={(id, preview) =>
                setBranding({
                  ...branding,
                  darkLogoMediaId: id,
                  darkLogoUrl: preview || branding.darkLogoUrl,
                })
              }
            />
          </div>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Favicon URL</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={branding.faviconUrl ?? ''}
              onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value || null })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Open Graph image URL</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={branding.ogImageUrl ?? ''}
              onChange={(e) => setBranding({ ...branding, ogImageUrl: e.target.value || null })}
            />
          </label>
        </div>
      ) : null}

      {tab === 'colors' ? (
        <div className="space-y-4">
          {(['light', 'dark'] as const).map((mode) => (
            <div
              key={mode}
              className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <h3 className="mb-3 text-sm font-semibold capitalize">{mode} palette</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {COLOR_KEYS.map((key) => (
                  <label key={`${mode}-${key}`} className="text-sm">
                    <span className="mb-1 block text-[var(--varnarc-subtle)]">{key}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="h-10 w-12 cursor-pointer rounded border border-[var(--varnarc-border)]"
                        value={(colors[mode]?.[key] as string) || '#000000'}
                        onChange={(e) =>
                          setColors({
                            ...colors,
                            [mode]: { ...(colors[mode] ?? {}), [key]: e.target.value },
                          })
                        }
                      />
                      <input
                        className="h-10 flex-1 rounded-md border border-[var(--varnarc-border)] px-3 font-mono text-xs"
                        value={(colors[mode]?.[key] as string) || ''}
                        onChange={(e) =>
                          setColors({
                            ...colors,
                            [mode]: { ...(colors[mode] ?? {}), [key]: e.target.value },
                          })
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'typography' ? (
        <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Body font</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={fonts.body ?? ''}
              onChange={(e) => setFonts({ ...fonts, body: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Heading font</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={fonts.heading ?? ''}
              onChange={(e) => setFonts({ ...fonts, heading: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Base size</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={fonts.baseSize ?? ''}
              onChange={(e) => setFonts({ ...fonts, baseSize: e.target.value })}
              placeholder="16px"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Heading scale</span>
            <input
              type="number"
              step="0.05"
              min={1}
              max={2}
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={Number((fonts as { headingScale?: number }).headingScale ?? 1.25)}
              onChange={(e) =>
                setFonts({ ...fonts, headingScale: Number(e.target.value) } as ThemeFonts)
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Line height</span>
            <input
              type="number"
              step="0.05"
              min={1}
              max={2.5}
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={Number((fonts as { lineHeight?: number }).lineHeight ?? 1.5)}
              onChange={(e) =>
                setFonts({ ...fonts, lineHeight: Number(e.target.value) } as ThemeFonts)
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Letter spacing</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={String((fonts as { letterSpacing?: string }).letterSpacing ?? '')}
              onChange={(e) =>
                setFonts({ ...fonts, letterSpacing: e.target.value } as ThemeFonts)
              }
            />
          </label>
        </div>
      ) : null}

      {tab === 'layout' ? (
        <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Container width</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={String(tokens.layout?.containerWidth ?? '')}
              onChange={(e) =>
                setTokens({
                  ...tokens,
                  layout: { ...(tokens.layout ?? {}), containerWidth: e.target.value },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Card radius</span>
            <input
              className="h-10 w-full rounded-md border border-[varnarc-border)] px-3"
              value={String(tokens.layout?.cardRadius ?? '')}
              onChange={(e) =>
                setTokens({
                  ...tokens,
                  layout: { ...(tokens.layout ?? {}), cardRadius: e.target.value },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Section padding</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={String(tokens.layout?.sectionPadding ?? '')}
              onChange={(e) =>
                setTokens({
                  ...tokens,
                  layout: { ...(tokens.layout ?? {}), sectionPadding: e.target.value },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Max content width</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={String(tokens.layout?.maxContentWidth ?? '')}
              onChange={(e) =>
                setTokens({
                  ...tokens,
                  layout: { ...(tokens.layout ?? {}), maxContentWidth: e.target.value },
                })
              }
            />
          </label>
        </div>
      ) : null}

      {tab === 'components' ? (
        <div className="space-y-4">
          {COMPONENT_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <h3 className="mb-3 text-sm font-semibold capitalize">{key}</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(tokens.components?.[key] ?? { radius: '0.5rem' }).map(
                  ([field, value]) => (
                    <label key={`${key}-${field}`} className="text-sm">
                      <span className="mb-1 block text-[var(--varnarc-subtle)]">{field}</span>
                      {typeof value === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setTokens({
                              ...tokens,
                              components: {
                                ...(tokens.components ?? {}),
                                [key]: {
                                  ...(tokens.components?.[key] ?? {}),
                                  [field]: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                      ) : (
                        <input
                          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
                          value={String(value ?? '')}
                          onChange={(e) =>
                            setTokens({
                              ...tokens,
                              components: {
                                ...(tokens.components ?? {}),
                                [key]: {
                                  ...(tokens.components?.[key] ?? {}),
                                  [field]: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      )}
                    </label>
                  ),
                )}
                {!tokens.components?.[key] ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setTokens({
                        ...tokens,
                        components: {
                          ...(tokens.components ?? {}),
                          [key]: { radius: '0.5rem' },
                        },
                      })
                    }
                  >
                    Initialize {key}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'navigation' ? (
        <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(tokens.navigation?.stickyHeader)}
                onChange={(e) =>
                  setTokens({
                    ...tokens,
                    navigation: { ...(tokens.navigation ?? {}), stickyHeader: e.target.checked },
                  })
                }
              />
              Sticky header
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(tokens.navigation?.breadcrumbs)}
                onChange={(e) =>
                  setTokens({
                    ...tokens,
                    navigation: { ...(tokens.navigation ?? {}), breadcrumbs: e.target.checked },
                  })
                }
              />
              Breadcrumbs
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--varnarc-subtle)]">Footer copyright</span>
              <input
                className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
                value={String(tokens.footer?.copyright ?? '')}
                onChange={(e) =>
                  setTokens({
                    ...tokens,
                    footer: { ...(tokens.footer ?? {}), copyright: e.target.value },
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--varnarc-subtle)]">Footer columns</span>
              <input
                type="number"
                min={1}
                max={6}
                className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
                value={Number(tokens.footer?.columns ?? 4)}
                onChange={(e) =>
                  setTokens({
                    ...tokens,
                    footer: { ...(tokens.footer ?? {}), columns: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="text-[var(--varnarc-brand)] underline" href="/menus?location=header">
              Edit header menu
            </Link>
            <Link className="text-[var(--varnarc-brand)] underline" href="/menus?location=footer">
              Edit footer menu
            </Link>
            <Link className="text-[var(--varnarc-brand)] underline" href="/menus?location=mobile">
              Edit mobile menu
            </Link>
            <Link className="text-[var(--varnarc-brand)] underline" href="/cms">
              CMS
            </Link>
            <Link className="text-[var(--varnarc-brand)] underline" href="/media">
              Media library
            </Link>
            <Link className="text-[var(--varnarc-brand)] underline" href="/themes/marketplace">
              Marketplace
            </Link>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">
              Social links JSON (array of label/href objects)
            </span>
            <textarea
              className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs"
              defaultValue={JSON.stringify(tokens.footer?.socialLinks ?? [], null, 2)}
              onBlur={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as Array<{ label: string; href: string }>;
                  setTokens({
                    ...tokens,
                    footer: { ...(tokens.footer ?? {}), socialLinks: parsed },
                  });
                } catch {
                  // ignore invalid JSON until blur with valid content
                }
              }}
            />
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(tokens.footer?.newsletterEnabled ?? true)}
                onChange={(e) =>
                  setTokens({
                    ...tokens,
                    footer: { ...(tokens.footer ?? {}), newsletterEnabled: e.target.checked },
                  })
                }
              />
              Newsletter block
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(tokens.footer?.showAds ?? true)}
                onChange={(e) =>
                  setTokens({
                    ...tokens,
                    footer: { ...(tokens.footer ?? {}), showAds: e.target.checked },
                  })
                }
              />
              Advertisement area
            </label>
          </div>
        </div>
      ) : null}

      {tab === 'schedule' ? (
        <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Tenant key (white-label)</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={tenantKey}
              onChange={(e) => setTenantKey(e.target.value)}
              placeholder="acme"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Season</span>
            <select
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            >
              <option value="">None</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
              <option value="holiday">Holiday</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Scheduled from</span>
            <DateTimeLocalInput
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={scheduledFrom}
              onChange={(e) => setScheduledFrom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Scheduled until</span>
            <DateTimeLocalInput
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={scheduledUntil}
              onChange={(e) => setScheduledUntil(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={marketplaceListed}
              onChange={(e) => setMarketplaceListed(e.target.checked)}
            />
            List in theme marketplace
          </label>
        </div>
      ) : null}

      {tab === 'visual' ? (
        <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
          <p className="text-sm text-[var(--varnarc-subtle)]">
            Visual controls for core tokens. Drag sliders to adjust radius and spacing.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">
              Card radius ({cardRadius.toFixed(2)}rem)
            </span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={cardRadius}
              onChange={(e) =>
                setTokens({
                  ...tokens,
                  layout: { ...(tokens.layout ?? {}), cardRadius: `${e.target.value}rem` },
                  components: {
                    ...(tokens.components ?? {}),
                    card: {
                      ...(tokens.components?.card ?? {}),
                      radius: `${e.target.value}rem`,
                    },
                    button: {
                      ...(tokens.components?.button ?? {}),
                      radius: `${Math.max(0.25, Number(e.target.value) - 0.1)}rem`,
                    },
                  },
                })
              }
              className="w-full"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">
              Section padding ({sectionPadding.toFixed(1)}rem)
            </span>
            <input
              type="range"
              min={1}
              max={8}
              step={0.25}
              value={sectionPadding}
              onChange={(e) =>
                setTokens({
                  ...tokens,
                  layout: { ...(tokens.layout ?? {}), sectionPadding: `${e.target.value}rem` },
                })
              }
              className="w-full"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            {COLOR_KEYS.slice(0, 3).map((key) => (
              <label key={key} className="text-sm">
                <span className="mb-1 block capitalize text-[var(--varnarc-subtle)]">{key}</span>
                <input
                  type="color"
                  className="h-12 w-full cursor-pointer rounded border border-[var(--varnarc-border)]"
                  value={(colors.light?.[key] as string) || '#000000'}
                  onChange={(e) =>
                    setColors({
                      ...colors,
                      light: { ...(colors.light ?? {}), [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <div
            className="border p-6"
            style={{
              ...previewStyle,
              borderRadius: `${cardRadius}rem`,
              padding: `${Math.min(sectionPadding, 3)}rem`,
            }}
          >
            <div className="mb-3 text-lg font-semibold" style={{ color: 'var(--preview-brand)' }}>
              {branding.siteName || name}
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm text-white"
              style={{
                background: 'var(--preview-accent)',
                borderRadius: String(tokens.components?.button?.radius ?? '0.5rem'),
              }}
            >
              Sample button
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div
          className="overflow-hidden rounded-lg border border-[var(--varnarc-border)]"
          style={previewStyle}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: 'var(--preview-surface)' }}
          >
            <div>
              <div className="text-lg font-semibold" style={{ color: 'var(--preview-brand)' }}>
                {branding.siteName || name || 'Varnarc'}
              </div>
              <div className="text-sm opacity-70">{branding.siteTagline || description}</div>
            </div>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm text-white"
              style={{ background: 'var(--preview-accent)' }}
            >
              Primary CTA
            </button>
          </div>
          <div className="space-y-3 px-6 py-8">
            <div
              className="rounded-lg border p-4"
              style={{
                background: 'var(--preview-surface)',
                borderColor: previewStyle.borderColor,
                borderRadius: previewStyle.borderRadius,
              }}
            >
              <h4 className="font-semibold">Sample card</h4>
              <p className="mt-1 text-sm opacity-70">
                Live preview of brand colors, surfaces, radius, and accent actions.
              </p>
            </div>
            <p className="text-xs opacity-60">
              {String(tokens.footer?.copyright ?? '© Varnarc. All rights reserved.')}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={loading}>
          {loading ? 'Saving…' : 'Save theme'}
        </Button>
        {!theme.isDefault ? (
          <Button type="button" variant="secondary" onClick={publish} disabled={loading}>
            Publish
          </Button>
        ) : (
          <span className="text-sm text-[var(--varnarc-subtle)]">Active default theme</span>
        )}
        <Button type="button" variant="secondary" onClick={resetDefaults} disabled={loading}>
          Reset to defaults
        </Button>
        <Button type="button" variant="secondary" onClick={exportTheme}>
          Export JSON
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
