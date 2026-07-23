import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  CreateThemeInput,
  CursorPaginationQuery,
  ImportThemeInput,
  UpdateThemeInput,
  UpsertThemeAssetInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import {
  buildThemeCssVariables,
  DEFAULT_THEME_PAYLOAD,
  resolveThemeBranding,
  themeCssToStyleBlock,
} from './theme-css';

const ACTIVE_THEME_CACHE_KEY = 'theme:active';

@Injectable()
export class ThemeService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private notFound(message = 'Theme not found.') {
    return new NotFoundException({
      success: false,
      error: { code: 'NOT_FOUND', message },
    });
  }

  private async audit(
    actorId: string,
    action: string,
    entityId: string,
    oldValue?: object,
    newValue?: object,
  ) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: 'theme',
      entityId,
      oldValue: oldValue as never,
      newValue: newValue as never,
    });
  }

  private decorate(theme: Record<string, unknown>) {
    const branding = resolveThemeBranding(theme);
    const fonts = theme.fonts && typeof theme.fonts === 'object' ? theme.fonts : {};
    const googleFonts =
      fonts && typeof fonts === 'object' && Array.isArray((fonts as { googleFonts?: unknown }).googleFonts)
        ? ((fonts as { googleFonts: string[] }).googleFonts)
        : [];
    const css = buildThemeCssVariables({ ...theme, branding });
    return {
      ...theme,
      branding,
      googleFonts,
      resolvedCssVars: css,
      cssStyleBlock: themeCssToStyleBlock(css),
    };
  }

  private cacheKey(tenantKey?: string | null) {
    return `${ACTIVE_THEME_CACHE_KEY}:${tenantKey || 'default'}`;
  }

  private async bustCache(tenantKey?: string | null) {
    await this.cache.del(this.cacheKey(tenantKey));
    await this.cache.del(this.cacheKey(null));
  }

  private themeFields(input: CreateThemeInput | UpdateThemeInput) {
    return {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.tokens !== undefined ? { tokens: input.tokens as never } : {}),
      ...(input.fonts !== undefined ? { fonts: input.fonts as never } : {}),
      ...(input.colors !== undefined ? { colors: input.colors as never } : {}),
      ...(input.branding !== undefined ? { branding: input.branding as never } : {}),
      ...(input.cssVars !== undefined ? { cssVars: input.cssVars as never } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.isSystem !== undefined ? { isSystem: input.isSystem } : {}),
      ...(input.tenantKey !== undefined ? { tenantKey: input.tenantKey } : {}),
      ...(input.season !== undefined ? { season: input.season } : {}),
      ...(input.scheduledFrom !== undefined ? { scheduledFrom: input.scheduledFrom } : {}),
      ...(input.scheduledUntil !== undefined ? { scheduledUntil: input.scheduledUntil } : {}),
      ...(input.marketplaceListed !== undefined
        ? { marketplaceListed: input.marketplaceListed }
        : {}),
    };
  }

  async getActive(tenantKey?: string | null) {
    const key = this.cacheKey(tenantKey);
    const cached = await this.cache.get<unknown>(key);
    if (cached) return cached;

    const scheduled = await this.repos.themes.findScheduledActive(new Date(), tenantKey);
    const theme = scheduled ?? (await this.repos.themes.findDefault(tenantKey));
    const payload = theme
      ? (theme as unknown as Record<string, unknown>)
      : ({
          id: 'fallback-default',
          slug: 'default',
          name: 'Default',
          ...DEFAULT_THEME_PAYLOAD,
          isDefault: true,
          assets: [],
        } as Record<string, unknown>);

    const decorated = this.decorate(payload);
    await this.cache.set(key, decorated, 60_000);
    return decorated;
  }

  listPresets(query: CursorPaginationQuery) {
    return this.repos.themes.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  listMarketplace(query: CursorPaginationQuery) {
    return this.repos.themes.listMarketplace({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  async getPreset(id: string) {
    const theme = await this.repos.themes.findById(id);
    if (!theme) throw this.notFound();
    return this.decorate(theme as unknown as Record<string, unknown>);
  }

  async createPreset(input: CreateThemeInput, actorId: string) {
    if (input.isDefault) {
      await this.repos.themes.clearDefault();
    }

    const theme = await this.repos.themes.create({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      tokens: (input.tokens ?? DEFAULT_THEME_PAYLOAD.tokens) as never,
      fonts: (input.fonts ?? DEFAULT_THEME_PAYLOAD.fonts) as never,
      colors: (input.colors ?? DEFAULT_THEME_PAYLOAD.colors) as never,
      branding: (input.branding ?? DEFAULT_THEME_PAYLOAD.branding) as never,
      cssVars: (input.cssVars ?? null) as never,
      isDefault: input.isDefault,
      isSystem: input.isSystem ?? false,
      tenantKey: input.tenantKey ?? null,
      season: input.season ?? null,
      scheduledFrom: input.scheduledFrom ?? null,
      scheduledUntil: input.scheduledUntil ?? null,
      marketplaceListed: input.marketplaceListed ?? false,
      createdBy: actorId,
      updatedBy: actorId,
    });

    await this.audit(actorId, 'theme.create', theme.id, undefined, {
      slug: theme.slug,
      name: theme.name,
    });
    await this.bustCache(input.tenantKey);
    return this.decorate(theme as unknown as Record<string, unknown>);
  }

  async updatePreset(id: string, input: UpdateThemeInput, actorId: string) {
    const existing = await this.repos.themes.findById(id);
    if (!existing) throw this.notFound();

    if (input.isDefault === true) {
      await this.repos.themes.clearDefault(id);
    }

    const theme = await this.repos.themes.update(id, {
      ...this.themeFields(input),
      updatedBy: actorId,
    });

    await this.audit(
      actorId,
      'theme.update',
      id,
      { name: existing.name, isDefault: existing.isDefault },
      { name: theme.name, isDefault: theme.isDefault },
    );
    await this.bustCache(theme.tenantKey);
    return this.decorate(theme as unknown as Record<string, unknown>);
  }

  async updateActive(input: UpdateThemeInput, actorId: string) {
    const active = await this.repos.themes.findDefault();
    if (!active) throw this.notFound('Default theme not found.');
    return this.updatePreset(active.id, { ...input, isDefault: true }, actorId);
  }

  async resetToDefaults(id: string, actorId: string) {
    const existing = await this.repos.themes.findById(id);
    if (!existing) throw this.notFound();

    const baseline = await this.repos.themes.findSystemBaseline();
    const payload = baseline
      ? {
          tokens: baseline.tokens,
          fonts: baseline.fonts,
          colors: baseline.colors,
          branding: baseline.branding,
          cssVars: baseline.cssVars,
        }
      : {
          tokens: DEFAULT_THEME_PAYLOAD.tokens,
          fonts: DEFAULT_THEME_PAYLOAD.fonts,
          colors: DEFAULT_THEME_PAYLOAD.colors,
          branding: DEFAULT_THEME_PAYLOAD.branding,
          cssVars: null,
        };

    const theme = await this.repos.themes.update(id, {
      tokens: payload.tokens as never,
      fonts: payload.fonts as never,
      colors: payload.colors as never,
      branding: payload.branding as never,
      cssVars: payload.cssVars as never,
      updatedBy: actorId,
    });

    await this.audit(actorId, 'theme.reset', id, { name: existing.name }, { reset: true });
    await this.bustCache(theme.tenantKey);
    return this.decorate(theme as unknown as Record<string, unknown>);
  }

  async publishPreset(id: string, actorId: string) {
    const existing = await this.repos.themes.findById(id);
    if (!existing) throw this.notFound();

    await this.repos.themes.clearDefault(id);
    const theme = await this.repos.themes.update(id, {
      isDefault: true,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'theme.publish', id, { isDefault: false }, { isDefault: true });
    await this.bustCache(theme.tenantKey);
    return this.decorate(theme as unknown as Record<string, unknown>);
  }

  async deletePreset(id: string, actorId: string) {
    const existing = await this.repos.themes.findById(id);
    if (!existing) throw this.notFound();
    if (existing.isDefault) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'THEME_DEFAULT_LOCKED',
          message: 'Cannot delete the active default theme. Publish another preset first.',
        },
      });
    }
    if (existing.isSystem) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'THEME_SYSTEM_LOCKED',
          message: 'Cannot delete a system baseline theme.',
        },
      });
    }
    await this.repos.themes.softDelete(id, actorId);
    await this.audit(actorId, 'theme.delete', id, { slug: existing.slug }, { deleted: true });
    await this.bustCache(existing.tenantKey);
    return { id, deleted: true };
  }

  async importPreset(input: ImportThemeInput, actorId: string) {
    const slug = input.slug ?? `imported-${Date.now().toString(36)}`;
    return this.createPreset(
      {
        slug,
        name: input.name ?? 'Imported theme',
        description: input.description ?? null,
        tokens: input.tokens ?? DEFAULT_THEME_PAYLOAD.tokens,
        fonts: input.fonts ?? DEFAULT_THEME_PAYLOAD.fonts,
        colors: input.colors ?? DEFAULT_THEME_PAYLOAD.colors,
        branding: input.branding ?? DEFAULT_THEME_PAYLOAD.branding,
        cssVars: input.cssVars ?? null,
        season: input.season ?? null,
        marketplaceListed: input.marketplaceListed ?? false,
        isDefault: false,
        isSystem: false,
      },
      actorId,
    );
  }

  async listAssets(themeId?: string) {
    let id = themeId;
    if (!id) {
      const active = await this.repos.themes.findDefault();
      if (!active) throw this.notFound('Default theme not found.');
      id = active.id;
    }
    return this.repos.themes.listAssets(id);
  }

  async upsertAsset(input: UpsertThemeAssetInput, actorId: string) {
    const theme = await this.repos.themes.findById(input.themeId);
    if (!theme) throw this.notFound();
    if (!input.mediaId && !input.url) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'THEME_ASSET_INVALID',
          message: 'Provide mediaId or url for the theme asset.',
        },
      });
    }
    const asset = await this.repos.themes.upsertAsset({
      themeId: input.themeId,
      type: input.type,
      mediaId: input.mediaId ?? null,
      url: input.url ?? null,
    });
    await this.audit(actorId, 'theme.asset.upsert', theme.id, undefined, {
      type: input.type,
      mediaId: input.mediaId,
      url: input.url,
    });
    await this.bustCache(theme.tenantKey);
    return asset;
  }

  async deleteAsset(id: string, actorId: string) {
    await this.repos.themes.deleteAsset(id);
    await this.audit(actorId, 'theme.asset.delete', id, undefined, { deleted: true });
    await this.bustCache();
    return { id, deleted: true };
  }

  exportPreset(theme: Record<string, unknown>) {
    return {
      name: theme.name,
      slug: theme.slug,
      description: theme.description ?? null,
      tokens: theme.tokens ?? {},
      fonts: theme.fonts ?? null,
      colors: theme.colors ?? null,
      branding: theme.branding ?? null,
      cssVars: theme.cssVars ?? null,
      season: theme.season ?? null,
      marketplaceListed: theme.marketplaceListed ?? false,
    };
  }
}
