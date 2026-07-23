import type { MediaResourceType, Prisma, PrismaClient } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

type MediaAssetDetail = Prisma.MediaAssetGetPayload<{
  include: {
    folder: true;
    tags: { include: { tag: true } };
    versions: true;
  };
}>;

type MediaFolderDetail = Prisma.MediaFolderGetPayload<{ include: { parent: true } }>;

type MediaAlbumDetail = Prisma.MediaAlbumGetPayload<{
  include: {
    assets: {
      include: { asset: { include: { folder: true } } };
    };
  };
}>;

export class MediaAssetRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById<MediaAssetDetail>(this.db.mediaAsset, id, {
      folder: true,
      tags: { include: { tag: true } },
      versions: { orderBy: { createdAt: 'asc' } },
    });
  }

  findByPublicId(publicId: string) {
    return this.db.mediaAsset.findFirst({
      where: { publicId, deletedAt: null },
    });
  }

  list(
    params: CursorPageParams & {
      folderId?: string | null;
      resourceType?: MediaResourceType;
      tagId?: string;
      search?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.mediaAsset, {
      ...params,
      where: {
        ...(params.folderId !== undefined ? { folderId: params.folderId } : {}),
        ...(params.resourceType ? { resourceType: params.resourceType } : {}),
        ...(params.tagId
          ? { tags: { some: { tagId: params.tagId } } }
          : {}),
        ...(params.search
          ? {
              OR: [
                { alt: { contains: params.search, mode: 'insensitive' } },
                { publicId: { contains: params.search, mode: 'insensitive' } },
                { originalName: { contains: params.search, mode: 'insensitive' } },
                { fileName: { contains: params.search, mode: 'insensitive' } },
                { caption: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { folder: true, tags: { include: { tag: true } }, versions: true },
    });
  }

  create(data: Prisma.MediaAssetCreateInput) {
    return this.db.mediaAsset.create({
      data,
      include: { folder: true, tags: { include: { tag: true } }, versions: true },
    });
  }

  update(id: string, data: Prisma.MediaAssetUpdateInput) {
    return this.db.mediaAsset.update({
      where: { id },
      data,
      include: { folder: true, tags: { include: { tag: true } }, versions: true },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.mediaAsset, id, actorId);
  }

  countAll() {
    return this.db.mediaAsset.count({ where: { deletedAt: null } });
  }

  countInFolder(folderId: string) {
    return this.db.mediaAsset.count({ where: { folderId, deletedAt: null } });
  }
}

export class MediaFolderRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById<MediaFolderDetail>(this.db.mediaFolder, id, { parent: true });
  }

  findBySlug(parentId: string | null, slug: string) {
    return this.db.mediaFolder.findFirst({
      where: { parentId, slug, deletedAt: null },
    });
  }

  list(params: CursorPageParams & { parentId?: string | null } = {}) {
    return listActiveWithCursor(this.db.mediaFolder, {
      ...params,
      where:
        params.parentId !== undefined ? { parentId: params.parentId } : undefined,
      include: { parent: true },
    });
  }

  listAll() {
    return this.db.mediaFolder.findMany({
      where: { deletedAt: null },
      orderBy: [{ path: 'asc' }, { name: 'asc' }],
    });
  }

  create(data: Prisma.MediaFolderCreateInput) {
    return this.db.mediaFolder.create({ data, include: { parent: true } });
  }

  update(id: string, data: Prisma.MediaFolderUpdateInput) {
    return this.db.mediaFolder.update({ where: { id }, data, include: { parent: true } });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.mediaFolder, id, actorId);
  }

  countChildren(id: string) {
    return this.db.mediaFolder.count({ where: { parentId: id, deletedAt: null } });
  }
}

export class MediaAlbumRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById<MediaAlbumDetail>(this.db.mediaAlbum, id, {
      assets: {
        include: { asset: { include: { folder: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    });
  }

  findBySlug(slug: string) {
    return this.db.mediaAlbum.findFirst({
      where: { slug, deletedAt: null },
      include: {
        assets: {
          include: { asset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.mediaAlbum, {
      ...params,
      include: {
        assets: {
          include: { asset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  create(data: Prisma.MediaAlbumCreateInput) {
    return this.db.mediaAlbum.create({
      data,
      include: {
        assets: {
          include: { asset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  update(id: string, data: Prisma.MediaAlbumUpdateInput) {
    return this.db.mediaAlbum.update({
      where: { id },
      data,
      include: {
        assets: {
          include: { asset: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.mediaAlbum, id, actorId);
  }

  replaceAssets(albumId: string, assetIds: string[]) {
    return this.db.$transaction([
      this.db.mediaAlbumAsset.deleteMany({ where: { albumId } }),
      ...assetIds.map((assetId, index) =>
        this.db.mediaAlbumAsset.create({
          data: { albumId, assetId, sortOrder: index },
        }),
      ),
    ]);
  }
}

export class MediaUsageRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listByAsset(assetId: string) {
    return this.db.mediaUsage.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    assetId: string;
    entityType: string;
    entityId: string;
    fieldName?: string | null;
  }) {
    return this.db.mediaUsage.create({ data });
  }

  remove(data: {
    assetId: string;
    entityType: string;
    entityId: string;
    fieldName?: string | null;
  }) {
    const fieldName = data.fieldName ?? null;
    return this.db.mediaUsage.deleteMany({
      where: {
        assetId: data.assetId,
        entityType: data.entityType,
        entityId: data.entityId,
        fieldName,
      },
    });
  }

  async findImplicitUsage(assetId: string) {
    const [articles, themeAssets] = await Promise.all([
      this.db.article.findMany({
        where: { featuredImageId: assetId, deletedAt: null },
        select: { id: true, title: true },
      }),
      this.db.themeAsset.findMany({
        where: { mediaId: assetId },
        select: { themeId: true, type: true },
      }),
    ]);
    return { articles, themeAssets };
  }
}
