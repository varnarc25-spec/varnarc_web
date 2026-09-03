import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  CmsDefaultsSettingsInput,
  ContactSettingsInput,
  CreateThemeInput,
  CursorPaginationQuery,
  GeneralSettingsInput,
  MaintenanceSettingsInput,
  SecuritySettingsInput,
  SeoDefaultsSettingsInput,
  AdsenseSettingsInput,
  GcsSettingsInput,
  UpsertFeatureFlagInput,
  UpsertSettingInput,
} from '@varnarc/validation';
import {
  adsenseSettingsSchema,
  gcsSettingsSchema,
  normalizeHttpPublicUrl,
  cmsDefaultsSettingsSchema,
  contactSettingsSchema,
  generalSettingsSchema,
  maintenanceSettingsSchema,
  securitySettingsSchema,
  seoDefaultsSettingsSchema,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

const CACHE_TTL = 60_000;

function redactSettingSecrets(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const next = { ...(value as Record<string, unknown>) };
  if (typeof next.privateKey === 'string' && next.privateKey.trim()) {
    next.privateKey = '[redacted]';
  }
  return next;
}

export const SETTINGS_KEYS = {
  general: 'settings.general',
  maintenance: 'settings.maintenance',
  security: 'settings.security',
  cms: 'settings.cms',
  seoDefaults: 'settings.seo-defaults',
  contact: 'settings.contact',
  adsense: 'settings.adsense',
  gcs: 'settings.gcs',
} as const;

const DEFAULT_GENERAL: GeneralSettingsInput = {
  siteName: 'Varnarc',
  siteTagline: 'Smart Tools & Expert Guides',
  logoUrl: null,
  faviconUrl: null,
  contactEmail: null,
  contactPhone: null,
  copyrightText: null,
  companyName: null,
  companyAddress: null,
  timezone: 'UTC',
  locale: 'en',
};

const DEFAULT_MAINTENANCE: MaintenanceSettingsInput = {
  enabled: false,
  message: 'We are performing scheduled maintenance. Please check back soon.',
  readOnly: false,
  scheduledFrom: null,
  scheduledUntil: null,
  allowedIps: [],
  bypassRoles: ['admin', 'super_admin'],
};

const DEFAULT_SECURITY: SecuritySettingsInput = {
  rateLimitPerMinute: 120,
  corsOrigins: [],
  cspEnabled: false,
  cspReportOnly: true,
  allowedOrigins: [],
  apiKeyRequired: false,
  passwordMinLength: 8,
};

const DEFAULT_CMS: CmsDefaultsSettingsInput = {
  defaultArticleStatus: 'DRAFT',
  autoSaveEnabled: true,
  autoSaveIntervalSeconds: 60,
  revisionLimit: 50,
};

const DEFAULT_SEO_DEFAULTS: SeoDefaultsSettingsInput = {
  defaultTitle: null,
  defaultDescription: null,
  defaultOgImage: null,
  titleSeparator: '|',
  robotsIndexDefault: true,
};

const DEFAULT_CONTACT: ContactSettingsInput = {
  emailEnabled: true,
  fromEmail: null,
  toGeneral: null,
  toEditorial: null,
  toBusiness: null,
  toSupport: null,
  toPrivacy: null,
  publicContactEmail: null,
  resendApiKey: null,
};

const DEFAULT_ADSENSE: AdsenseSettingsInput = {
  enabled: true,
  client: null,
  defaultSlot: null,
  slots: {},
};

const DEFAULT_GCS: GcsSettingsInput = {
  enabled: false,
  bucket: null,
  projectId: null,
  clientEmail: null,
  privateKey: null,
  publicBaseUrl: null,
  makePublic: false,
};

@Injectable()
export class SettingsService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async audit(
    action: string,
    entityId: string,
    actorId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await this.repos.auditLogs
      .create({
        action,
        entity: 'setting',
        entityId,
        userId: actorId ?? null,
        newValue: metadata as never,
      })
      .catch(() => undefined);
  }

  private cacheKey(key: string) {
    return `settings:${key}`;
  }

  private async invalidate(key: string) {
    await this.cache.del(this.cacheKey(key)).catch(() => undefined);
  }

  private async readJson<T extends Record<string, unknown>>(key: string, defaults: T): Promise<T> {
    const cached = await this.cache.get<T>(this.cacheKey(key));
    if (cached) return cached;

    const row = await this.repos.settings.findByKey(key).catch(() => null);
    const merged = {
      ...defaults,
      ...(row?.value && typeof row.value === 'object'
        ? (row.value as Record<string, unknown>)
        : {}),
    } as T;

    await this.cache.set(this.cacheKey(key), merged, CACHE_TTL).catch(() => undefined);
    return merged;
  }

  private async writeJson<T extends Record<string, unknown>>(
    key: string,
    value: T,
    group: string,
    actorId: string,
    action: string,
  ) {
    const previous = await this.repos.settings.findByKey(key).catch(() => null);
    const row = await this.repos.settings.upsert(key, value as never, group, actorId);
    await this.invalidate(key);
    await this.audit(action, key, actorId, {
      previous: redactSettingSecrets(previous?.value ?? null),
      next: redactSettingSecrets(value),
    });
    return row.value as T;
  }

  listSettings(query: CursorPaginationQuery & { group?: string }) {
    return this.repos.settings.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      group: query.group,
    });
  }

  upsertSetting(input: UpsertSettingInput, actorId: string) {
    return this.repos.settings.upsert(input.key, input.value as never, input.group, actorId);
  }

  async getGeneral() {
    return this.readJson(SETTINGS_KEYS.general, DEFAULT_GENERAL);
  }

  async setGeneral(input: GeneralSettingsInput, actorId: string) {
    const parsed = generalSettingsSchema.parse(input);
    const merged = { ...(await this.getGeneral()), ...parsed };
    await this.writeJson(
      SETTINGS_KEYS.general,
      merged,
      'general',
      actorId,
      'settings.general.update',
    );
    return merged;
  }

  async getMaintenance() {
    return this.readJson(SETTINGS_KEYS.maintenance, DEFAULT_MAINTENANCE);
  }

  async setMaintenance(input: MaintenanceSettingsInput, actorId: string) {
    const parsed = maintenanceSettingsSchema.parse(input);
    const merged = { ...(await this.getMaintenance()), ...parsed };
    await this.writeJson(
      SETTINGS_KEYS.maintenance,
      merged,
      'maintenance',
      actorId,
      'settings.maintenance.update',
    );
    return merged;
  }

  async getMaintenanceStatus() {
    const settings = await this.getMaintenance();
    const now = Date.now();
    let active = settings.enabled;

    if (settings.scheduledFrom) {
      const from = Date.parse(settings.scheduledFrom);
      if (!Number.isNaN(from) && from > now) active = false;
    }
    if (settings.scheduledUntil) {
      const until = Date.parse(settings.scheduledUntil);
      if (!Number.isNaN(until) && until < now) active = false;
    }
    if (settings.scheduledFrom && settings.scheduledUntil) {
      const from = Date.parse(settings.scheduledFrom);
      const until = Date.parse(settings.scheduledUntil);
      if (!Number.isNaN(from) && !Number.isNaN(until) && from <= now && now <= until) {
        active = true;
      }
    }

    return {
      active,
      message: settings.message ?? DEFAULT_MAINTENANCE.message,
      readOnly: settings.readOnly,
    };
  }

  async getSecurity() {
    return this.readJson(SETTINGS_KEYS.security, DEFAULT_SECURITY);
  }

  async setSecurity(input: SecuritySettingsInput, actorId: string) {
    const parsed = securitySettingsSchema.parse(input);
    const merged = { ...(await this.getSecurity()), ...parsed };
    await this.writeJson(
      SETTINGS_KEYS.security,
      merged,
      'security',
      actorId,
      'settings.security.update',
    );
    return merged;
  }

  async getCmsDefaults() {
    return this.readJson(SETTINGS_KEYS.cms, DEFAULT_CMS);
  }

  async setCmsDefaults(input: CmsDefaultsSettingsInput, actorId: string) {
    const parsed = cmsDefaultsSettingsSchema.parse(input);
    const merged = { ...(await this.getCmsDefaults()), ...parsed };
    await this.writeJson(SETTINGS_KEYS.cms, merged, 'cms', actorId, 'settings.cms.update');
    return merged;
  }

  async getSeoDefaults() {
    return this.readJson(SETTINGS_KEYS.seoDefaults, DEFAULT_SEO_DEFAULTS);
  }

  async setSeoDefaults(input: SeoDefaultsSettingsInput, actorId: string) {
    const parsed = seoDefaultsSettingsSchema.parse(input);
    const merged = { ...(await this.getSeoDefaults()), ...parsed };
    await this.writeJson(
      SETTINGS_KEYS.seoDefaults,
      merged,
      'seo',
      actorId,
      'settings.seo-defaults.update',
    );
    return merged;
  }

  async getContactRaw(): Promise<ContactSettingsInput> {
    return this.readJson(SETTINGS_KEYS.contact, DEFAULT_CONTACT);
  }

  async getContact() {
    const raw = await this.getContactRaw();
    const envApiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
    const dbKey = raw.resendApiKey?.trim();
    return {
      emailEnabled: raw.emailEnabled,
      fromEmail: raw.fromEmail ?? null,
      toGeneral: raw.toGeneral ?? null,
      toEditorial: raw.toEditorial ?? null,
      toBusiness: raw.toBusiness ?? null,
      toSupport: raw.toSupport ?? null,
      toPrivacy: raw.toPrivacy ?? null,
      publicContactEmail: raw.publicContactEmail ?? null,
      resendApiKeyConfigured: Boolean(dbKey) || envApiKeyConfigured,
      envApiKeyConfigured,
    };
  }

  async setContact(input: ContactSettingsInput, actorId: string) {
    const parsed = contactSettingsSchema.parse(input);
    const current = await this.getContactRaw();
    const nextKey =
      parsed.resendApiKey === undefined || parsed.resendApiKey === null
        ? current.resendApiKey
        : parsed.resendApiKey.trim() === ''
          ? null
          : parsed.resendApiKey.trim();

    const merged: ContactSettingsInput = {
      emailEnabled: parsed.emailEnabled,
      fromEmail: parsed.fromEmail?.trim() || null,
      toGeneral: parsed.toGeneral?.trim() || null,
      toEditorial: parsed.toEditorial?.trim() || null,
      toBusiness: parsed.toBusiness?.trim() || null,
      toSupport: parsed.toSupport?.trim() || null,
      toPrivacy: parsed.toPrivacy?.trim() || null,
      publicContactEmail: parsed.publicContactEmail?.trim() || null,
      resendApiKey: nextKey,
    };

    await this.writeJson(
      SETTINGS_KEYS.contact,
      merged,
      'contact',
      actorId,
      'settings.contact.update',
    );
    return this.getContact();
  }

  async getAdsense(): Promise<AdsenseSettingsInput> {
    return this.readJson(SETTINGS_KEYS.adsense, DEFAULT_ADSENSE);
  }

  async getAdsensePublic() {
    const settings = await this.getAdsense();
    const client = settings.client?.trim() || null;
    if (!settings.enabled || !client) {
      return {
        enabled: false,
        client: null,
        defaultSlot: null,
        slots: {} as Record<string, string>,
      };
    }
    return {
      enabled: true,
      client,
      defaultSlot: settings.defaultSlot?.trim() || null,
      slots: settings.slots ?? {},
    };
  }

  async setAdsense(input: AdsenseSettingsInput, actorId: string) {
    const parsed = adsenseSettingsSchema.parse(input);
    const merged: AdsenseSettingsInput = {
      enabled: parsed.enabled,
      client: parsed.client?.trim() || null,
      defaultSlot: parsed.defaultSlot?.trim() || null,
      slots: parsed.slots ?? {},
    };
    await this.writeJson(
      SETTINGS_KEYS.adsense,
      {
        enabled: merged.enabled,
        client: merged.client ?? null,
        defaultSlot: merged.defaultSlot ?? null,
        slots: merged.slots ?? {},
      },
      'ads',
      actorId,
      'settings.adsense.update',
    );
    return merged;
  }

  async getGcsRaw(): Promise<GcsSettingsInput> {
    return this.readJson(SETTINGS_KEYS.gcs, DEFAULT_GCS);
  }

  async getGcs() {
    const raw = await this.getGcsRaw();
    const envBucket = Boolean(process.env.GCS_BUCKET?.trim());
    const dbReady = Boolean(raw.enabled && raw.bucket?.trim());
    return {
      enabled: raw.enabled,
      bucket: raw.bucket ?? null,
      projectId: raw.projectId ?? null,
      clientEmail: raw.clientEmail ?? null,
      publicBaseUrl: normalizeHttpPublicUrl(raw.publicBaseUrl),
      makePublic: Boolean(raw.makePublic),
      privateKeyConfigured: Boolean(raw.privateKey?.trim()),
      envBucketConfigured: envBucket,
      activeSource: dbReady
        ? ('database' as const)
        : envBucket
          ? ('environment' as const)
          : ('none' as const),
    };
  }

  async setGcs(input: GcsSettingsInput, actorId: string) {
    const parsed = gcsSettingsSchema.parse(input);
    const current = await this.getGcsRaw();
    const nextKey = parsed.clearPrivateKey
      ? null
      : parsed.privateKey === undefined || parsed.privateKey === null
        ? current.privateKey
        : parsed.privateKey.trim() === ''
          ? current.privateKey
          : parsed.privateKey.replace(/\\n/g, '\n').trim();

    const merged: GcsSettingsInput = {
      enabled: parsed.enabled,
      bucket: parsed.bucket?.trim() || null,
      projectId: parsed.projectId?.trim() || null,
      clientEmail: parsed.clientEmail?.trim() || null,
      privateKey: nextKey,
      publicBaseUrl: parsed.publicBaseUrl,
      makePublic: Boolean(parsed.makePublic),
    };

    await this.writeJson(
      SETTINGS_KEYS.gcs,
      {
        ...merged,
        privateKey: merged.privateKey,
      },
      'media',
      actorId,
      'settings.gcs.update',
    );
    return this.getGcs();
  }

  async isFeatureEnabled(key: string) {
    const cacheKey = `feature-flag:${key}`;
    const cached = await this.cache.get<boolean>(cacheKey);
    if (typeof cached === 'boolean') return cached;

    const flag = await this.repos.featureFlags.findByKey(key);
    const enabled = flag?.enabled ?? false;
    await this.cache.set(cacheKey, enabled, CACHE_TTL).catch(() => undefined);
    return enabled;
  }

  listThemes(query: CursorPaginationQuery) {
    return this.repos.themes.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }

  async defaultTheme() {
    const theme = await this.repos.themes.findDefault();
    if (!theme) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Default theme not found.' },
      });
    }
    return theme;
  }

  createTheme(input: CreateThemeInput, actorId: string) {
    return this.repos.themes.create({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      tokens: input.tokens as never,
      fonts: input.fonts as never,
      colors: input.colors as never,
      branding: input.branding as never,
      cssVars: input.cssVars as never,
      isDefault: input.isDefault,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async upsertFlag(input: UpsertFeatureFlagInput, actorId: string) {
    const row = await this.repos.featureFlags.upsert(
      input.key,
      {
        name: input.name,
        description: input.description,
        enabled: input.enabled,
        metadata: input.metadata as never,
      },
      actorId,
    );
    await this.cache.del(`feature-flag:${input.key}`).catch(() => undefined);
    await this.audit('settings.feature-flag.update', input.key, actorId, {
      enabled: input.enabled,
      name: input.name,
    });
    return row;
  }

  listFlags(query: CursorPaginationQuery) {
    return this.repos.featureFlags.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
    });
  }
}
