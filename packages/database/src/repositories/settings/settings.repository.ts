import type { Prisma, PrismaClient } from '@prisma/client';
import {
  BaseRepository,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

export class SettingRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findByKey(key: string) {
    return this.db.setting.findFirst({ where: { key, deletedAt: null } });
  }

  list(params: CursorPageParams & { group?: string } = {}) {
    return listActiveWithCursor(this.db.setting, {
      ...params,
      where: params.group ? { group: params.group } : undefined,
    });
  }

  upsert(key: string, value: Prisma.InputJsonValue, group = 'general', actorId?: string | null) {
    return this.db.setting.upsert({
      where: { key },
      create: {
        key,
        value,
        group,
        ...this.withAuditCreate(actorId),
      },
      update: {
        value,
        group,
        deletedAt: null,
        ...this.withAuditUpdate(actorId),
      },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.setting, id, actorId);
  }
}

export class ThemeRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.theme.findFirst({
      where: { id, deletedAt: null },
      include: { assets: { include: { media: true } } },
    });
  }

  findBySlug(slug: string) {
    return this.db.theme.findFirst({
      where: { slug, deletedAt: null },
      include: { assets: { include: { media: true } } },
    });
  }

  findDefault(tenantKey?: string | null) {
    return this.db.theme.findFirst({
      where: {
        isDefault: true,
        deletedAt: null,
        ...(tenantKey ? { tenantKey } : { OR: [{ tenantKey: null }, { tenantKey: '' }] }),
      },
      include: { assets: { include: { media: true } } },
    });
  }

  findScheduledActive(now = new Date(), tenantKey?: string | null) {
    return this.db.theme.findFirst({
      where: {
        deletedAt: null,
        scheduledFrom: { lte: now },
        scheduledUntil: { gte: now },
        ...(tenantKey ? { tenantKey } : { OR: [{ tenantKey: null }, { tenantKey: '' }] }),
      },
      orderBy: { scheduledFrom: 'desc' },
      include: { assets: { include: { media: true } } },
    });
  }

  listMarketplace(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.theme, {
      ...params,
      where: { marketplaceListed: true },
    });
  }

  findSystemBaseline() {
    return this.db.theme.findFirst({
      where: { isSystem: true, slug: 'default', deletedAt: null },
      include: { assets: { include: { media: true } } },
    });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.theme, params);
  }

  create(data: Prisma.ThemeCreateInput) {
    return this.db.theme.create({
      data,
      include: { assets: { include: { media: true } } },
    });
  }

  update(id: string, data: Prisma.ThemeUpdateInput) {
    return this.db.theme.update({
      where: { id },
      data,
      include: { assets: { include: { media: true } } },
    });
  }

  async clearDefault(exceptId?: string) {
    return this.db.theme.updateMany({
      where: {
        isDefault: true,
        deletedAt: null,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.theme, id, actorId);
  }

  listAssets(themeId: string) {
    return this.db.themeAsset.findMany({
      where: { themeId },
      include: { media: true },
      orderBy: { type: 'asc' },
    });
  }

  upsertAsset(data: {
    themeId: string;
    type: string;
    mediaId?: string | null;
    url?: string | null;
  }) {
    return this.db.themeAsset.upsert({
      where: { themeId_type: { themeId: data.themeId, type: data.type } },
      create: {
        themeId: data.themeId,
        type: data.type,
        mediaId: data.mediaId ?? null,
        url: data.url ?? null,
      },
      update: {
        mediaId: data.mediaId ?? null,
        url: data.url ?? null,
      },
      include: { media: true },
    });
  }

  deleteAsset(id: string) {
    return this.db.themeAsset.delete({ where: { id } });
  }
}

export class FeatureFlagRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findByKey(key: string) {
    return this.db.featureFlag.findFirst({ where: { key, deletedAt: null } });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.featureFlag, params);
  }

  upsert(
    key: string,
    data: { name: string; description?: string | null; enabled?: boolean; metadata?: Prisma.InputJsonValue },
    actorId?: string | null,
  ) {
    return this.db.featureFlag.upsert({
      where: { key },
      create: {
        key,
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        metadata: data.metadata,
        ...this.withAuditCreate(actorId),
      },
      update: {
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        metadata: data.metadata,
        deletedAt: null,
        ...this.withAuditUpdate(actorId),
      },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.featureFlag, id, actorId);
  }
}

export class HomepageLayoutRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findBySlug(slug: string) {
    return this.db.homepageLayout.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
      include: {
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            widgetInstances: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: { widget: true },
            },
          },
        },
      },
    });
  }

  findDefault() {
    return this.db.homepageLayout.findFirst({
      where: { isDefault: true, deletedAt: null, status: 'PUBLISHED' },
      include: {
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            widgetInstances: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: { widget: true },
            },
          },
        },
      },
    });
  }

  findById(id: string) {
    return this.db.homepageLayout.findFirst({
      where: { id, deletedAt: null },
      include: {
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            widgetInstances: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: { widget: true },
            },
          },
        },
      },
    });
  }

  async createWithSections(
    data: {
      name: string;
      slug: string;
      isDefault?: boolean;
      createdBy?: string | null;
      sections?: Array<{
        name: string;
        sortOrder: number;
        settings?: Prisma.InputJsonValue | null;
        widgets: Array<{
          widgetId: string;
          sortOrder: number;
          settings?: Prisma.InputJsonValue | null;
        }>;
      }>;
    },
  ) {
    const layoutId = await this.db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.homepageLayout.updateMany({
          where: { isDefault: true, deletedAt: null },
          data: { isDefault: false },
        });
      }
      const layout = await tx.homepageLayout.create({
        data: {
          name: data.name,
          slug: data.slug,
          isDefault: data.isDefault ?? false,
          status: 'DRAFT',
          createdBy: data.createdBy ?? undefined,
          updatedBy: data.createdBy ?? undefined,
        },
      });
      await this.insertSections(tx, layout.id, data.sections ?? []);
      return layout.id;
    });
    return this.findById(layoutId);
  }

  async saveSections(
    layoutId: string,
    sections: Array<{
      name: string;
      sortOrder: number;
      settings?: Prisma.InputJsonValue | null;
      widgets: Array<{
        widgetId: string;
        sortOrder: number;
        settings?: Prisma.InputJsonValue | null;
      }>;
    }>,
    actorId?: string | null,
  ) {
    await this.db.$transaction(async (tx) => {
      const existing = await tx.homepageSection.findMany({
        where: { layoutId, deletedAt: null },
        select: { id: true },
      });
      const now = new Date();
      for (const section of existing) {
        await tx.widgetInstance.updateMany({
          where: { sectionId: section.id, deletedAt: null },
          data: { deletedAt: now },
        });
      }
      await tx.homepageSection.updateMany({
        where: { layoutId, deletedAt: null },
        data: { deletedAt: now },
      });
      await this.insertSections(tx, layoutId, sections);
      await tx.homepageLayout.update({
        where: { id: layoutId },
        data: { updatedBy: actorId ?? undefined },
      });
    });
    return this.findById(layoutId);
  }

  private async insertSections(
    tx: Prisma.TransactionClient,
    layoutId: string,
    sections: Array<{
      name: string;
      sortOrder: number;
      settings?: Prisma.InputJsonValue | null;
      widgets: Array<{
        widgetId: string;
        sortOrder: number;
        settings?: Prisma.InputJsonValue | null;
      }>;
    }>,
  ) {
    for (const section of sections) {
      const row = await tx.homepageSection.create({
        data: {
          layoutId,
          name: section.name,
          sortOrder: section.sortOrder,
          settings: section.settings ?? undefined,
        },
      });
      for (const widget of section.widgets) {
        await tx.widgetInstance.create({
          data: {
            sectionId: row.id,
            widgetId: widget.widgetId,
            sortOrder: widget.sortOrder,
            settings: widget.settings ?? undefined,
          },
        });
      }
    }
  }

  updateMeta(
    id: string,
    data: { name?: string; slug?: string; isDefault?: boolean },
    actorId?: string | null,
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.homepageLayout.updateMany({
          where: { isDefault: true, deletedAt: null, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.homepageLayout.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
          updatedBy: actorId ?? undefined,
        },
      });
    });
  }

  publish(id: string, actorId?: string | null) {
    return this.db.homepageLayout.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedBy: actorId ?? undefined,
      },
    });
  }

  setDefault(id: string, actorId?: string | null) {
    return this.db.$transaction(async (tx) => {
      await tx.homepageLayout.updateMany({
        where: { isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
      return tx.homepageLayout.update({
        where: { id },
        data: { isDefault: true, updatedBy: actorId ?? undefined },
      });
    });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.homepageLayout, params);
  }

  create(data: Prisma.HomepageLayoutCreateInput) {
    return this.db.homepageLayout.create({ data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.homepageLayout, id, actorId);
  }
}

export class WidgetRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listAll() {
    return this.db.widget.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  findBySlug(slug: string) {
    return this.db.widget.findFirst({ where: { slug, deletedAt: null } });
  }

  upsertBySlug(data: {
    slug: string;
    name: string;
    description?: string | null;
    schema?: Prisma.InputJsonValue | null;
  }) {
    return this.db.widget.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description ?? undefined,
        schema: data.schema ?? undefined,
        deletedAt: null,
      },
      create: {
        slug: data.slug,
        name: data.name,
        description: data.description ?? undefined,
        schema: data.schema ?? undefined,
      },
    });
  }
}
