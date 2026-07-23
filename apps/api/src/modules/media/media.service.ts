import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateMediaAssetInput,
  CreateMediaCollectionInput,
  CreateMediaFolderInput,
  CursorPaginationQuery,
  MediaListQuery,
  MediaSearchQuery,
  UpdateMediaAssetInput,
  UpdateMediaCollectionInput,
  UpdateMediaFolderInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { GcsStorageService } from './gcs-storage.service';

type UsageRef = {
  entityType: string;
  entityId: string;
  fieldName?: string | null;
  label?: string;
};

@Injectable()
export class MediaService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly storage: GcsStorageService,
  ) {}

  private notFound(message = 'Media not found.') {
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
      entity: 'media',
      entityId,
      oldValue: oldValue as never,
      newValue: newValue as never,
    });
  }

  private async folderPath(folderId?: string | null): Promise<string | undefined> {
    if (!folderId) return undefined;
    const folder = await this.repos.mediaFolders.findById(folderId);
    if (!folder) throw this.notFound('Folder not found.');
    return folder.path ?? folder.slug;
  }

  private async buildFolderPath(parentId: string | null | undefined, slug: string) {
    if (!parentId) return slug;
    const parent = await this.repos.mediaFolders.findById(parentId);
    if (!parent) throw this.notFound('Parent folder not found.');
    const base = parent.path ?? parent.slug;
    return `${base}/${slug}`;
  }

  list(query: MediaListQuery) {
    return this.repos.mediaAssets.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      folderId: query.folderId,
      resourceType: query.resourceType,
    });
  }

  search(query: MediaSearchQuery) {
    return this.repos.mediaAssets.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      folderId: query.folderId,
      resourceType: query.resourceType,
      tagId: query.tagId,
    });
  }

  async getById(id: string) {
    const row = await this.repos.mediaAssets.findById(id);
    if (!row) throw this.notFound();
    return row;
  }

  async create(input: CreateMediaAssetInput, actorId: string) {
    const existing = await this.repos.mediaAssets.findByPublicId(input.publicId);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE_PUBLIC_ID', message: 'An asset with this public ID already exists.' },
      });
    }
    if (input.folderId) {
      const folder = await this.repos.mediaFolders.findById(input.folderId);
      if (!folder) throw this.notFound('Folder not found.');
    }

    const { tagIds, ...rest } = input;
    const asset = await this.repos.mediaAssets.create({
      publicId: rest.publicId,
      url: rest.url,
      secureUrl: rest.secureUrl,
      resourceType: rest.resourceType,
      originalName: rest.originalName ?? null,
      fileName: rest.fileName ?? null,
      mimeType: rest.mimeType ?? null,
      format: rest.format ?? null,
      bytes: rest.bytes ?? null,
      width: rest.width ?? null,
      height: rest.height ?? null,
      duration: rest.duration ?? null,
      thumbnailUrl: rest.thumbnailUrl ?? null,
      alt: rest.alt ?? null,
      caption: rest.caption ?? null,
      description: rest.description ?? null,
      metadata: rest.metadata as never,
      ...(rest.folderId ? { folder: { connect: { id: rest.folderId } } } : {}),
      ...(tagIds?.length ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'media.create', asset.id, undefined, { publicId: asset.publicId });
    return asset;
  }

  async uploadFile(
    file: Express.Multer.File,
    actorId: string,
    options: { folderId?: string | null; alt?: string | null } = {},
  ) {
    if (options.folderId) {
      const folder = await this.repos.mediaFolders.findById(options.folderId);
      if (!folder) throw this.notFound('Folder not found.');
    }

    const folderPath = await this.folderPath(options.folderId);
    const uploaded = await this.storage.upload(file, { folderPath });

    const duplicate = await this.repos.mediaAssets.findByPublicId(uploaded.publicId);
    if (duplicate) {
      await this.storage.destroy(uploaded.publicId, uploaded.resourceType).catch(() => undefined);
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE_PUBLIC_ID', message: 'This file was already uploaded.' },
      });
    }

    const asset = await this.repos.mediaAssets.create({
      publicId: uploaded.publicId,
      url: uploaded.url,
      secureUrl: uploaded.secureUrl,
      resourceType: uploaded.resourceType,
      originalName: file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      format: uploaded.format ?? null,
      bytes: uploaded.bytes ?? null,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      duration: uploaded.duration ?? null,
      thumbnailUrl: uploaded.thumbnailUrl ?? null,
      alt: options.alt ?? null,
      ...(options.folderId ? { folder: { connect: { id: options.folderId } } } : {}),
      versions: {
        create: uploaded.versions.map((v) => ({
          url: v.url,
          width: v.width ?? null,
          height: v.height ?? null,
          label: v.label,
        })),
      },
      createdBy: actorId,
      updatedBy: actorId,
    });

    await this.audit(actorId, 'media.upload', asset.id, undefined, {
      publicId: asset.publicId,
      bytes: asset.bytes,
    });
    return asset;
  }

  async update(id: string, input: UpdateMediaAssetInput, actorId: string) {
    const existing = await this.repos.mediaAssets.findById(id);
    if (!existing) throw this.notFound();

    if (input.folderId) {
      const folder = await this.repos.mediaFolders.findById(input.folderId);
      if (!folder) throw this.notFound('Folder not found.');
    }

    const { tagIds, ...rest } = input;
    const asset = await this.repos.mediaAssets.update(id, {
      ...(rest.resourceType !== undefined ? { resourceType: rest.resourceType } : {}),
      ...(rest.originalName !== undefined ? { originalName: rest.originalName } : {}),
      ...(rest.fileName !== undefined ? { fileName: rest.fileName } : {}),
      ...(rest.mimeType !== undefined ? { mimeType: rest.mimeType } : {}),
      ...(rest.format !== undefined ? { format: rest.format } : {}),
      ...(rest.bytes !== undefined ? { bytes: rest.bytes } : {}),
      ...(rest.width !== undefined ? { width: rest.width } : {}),
      ...(rest.height !== undefined ? { height: rest.height } : {}),
      ...(rest.duration !== undefined ? { duration: rest.duration } : {}),
      ...(rest.thumbnailUrl !== undefined ? { thumbnailUrl: rest.thumbnailUrl } : {}),
      ...(rest.alt !== undefined ? { alt: rest.alt } : {}),
      ...(rest.caption !== undefined ? { caption: rest.caption } : {}),
      ...(rest.description !== undefined ? { description: rest.description } : {}),
      ...(rest.metadata !== undefined ? { metadata: rest.metadata as never } : {}),
      ...(rest.folderId !== undefined
        ? rest.folderId
          ? { folder: { connect: { id: rest.folderId } } }
          : { folder: { disconnect: true } }
        : {}),
      ...(tagIds
        ? {
            tags: {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
      updatedBy: actorId,
    });

    await this.audit(actorId, 'media.update', id, { alt: existing.alt }, { alt: asset.alt });
    return asset;
  }

  async getUsage(id: string): Promise<UsageRef[]> {
    const asset = await this.repos.mediaAssets.findById(id);
    if (!asset) throw this.notFound();

    const [{ articles, themeAssets }, explicit] = await Promise.all([
      this.repos.mediaUsage.findImplicitUsage(id),
      this.repos.mediaUsage.listByAsset(id),
    ]);

    const usage: UsageRef[] = [];

    for (const row of articles) {
      usage.push({
        entityType: 'article',
        entityId: row.id,
        fieldName: 'featuredImageId',
        label: row.title,
      });
    }
    for (const row of themeAssets) {
      usage.push({
        entityType: 'theme',
        entityId: row.themeId,
        fieldName: row.type,
        label: row.type,
      });
    }
    for (const row of explicit) {
      usage.push({
        entityType: row.entityType,
        entityId: row.entityId,
        fieldName: row.fieldName,
      });
    }
    return usage;
  }

  async remove(id: string, actorId: string) {
    const asset = await this.repos.mediaAssets.findById(id);
    if (!asset) throw this.notFound();

    const usage = await this.getUsage(id);
    if (usage.length) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'MEDIA_IN_USE',
          message: 'Cannot delete media that is currently in use.',
          details: usage,
        },
      });
    }

    if (this.storage.isConfigured()) {
      await this.storage.destroy(asset.publicId, asset.resourceType).catch(() => undefined);
    }

    const ok = await this.repos.mediaAssets.softDelete(id, actorId);
    if (!ok) throw this.notFound();
    await this.audit(actorId, 'media.delete', id, { publicId: asset.publicId });
    return { deleted: true };
  }

  async bulkRemove(ids: string[], actorId: string) {
    const results: Array<{ id: string; deleted: boolean; error?: string }> = [];
    for (const id of ids) {
      try {
        await this.remove(id, actorId);
        results.push({ id, deleted: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        results.push({ id, deleted: false, error: message });
      }
    }
    return results;
  }

  // --- Folders ---

  listFolders(query: CursorPaginationQuery & { parentId?: string | null }) {
    return this.repos.mediaFolders.list(query);
  }

  listAllFolders() {
    return this.repos.mediaFolders.listAll();
  }

  async getFolder(id: string) {
    const row = await this.repos.mediaFolders.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Folder not found.' },
      });
    }
    return row;
  }

  async createFolder(input: CreateMediaFolderInput, actorId: string) {
    const parentId = input.parentId ?? null;
    const existing = await this.repos.mediaFolders.findBySlug(parentId, input.slug);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'FOLDER_EXISTS', message: 'A folder with this slug already exists here.' },
      });
    }
    const path = await this.buildFolderPath(parentId, input.slug);
    const folder = await this.repos.mediaFolders.create({
      name: input.name,
      slug: input.slug,
      path,
      ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'media.folder.create', folder.id, undefined, { path });
    return folder;
  }

  async updateFolder(id: string, input: UpdateMediaFolderInput, actorId: string) {
    const existing = await this.repos.mediaFolders.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Folder not found.' },
      });
    }

    const parentId = input.parentId !== undefined ? input.parentId : existing.parentId;
    const slug = input.slug ?? existing.slug;
    if (input.slug || input.parentId !== undefined) {
      const conflict = await this.repos.mediaFolders.findBySlug(parentId, slug);
      if (conflict && conflict.id !== id) {
        throw new ConflictException({
          success: false,
          error: { code: 'FOLDER_EXISTS', message: 'A folder with this slug already exists here.' },
        });
      }
    }

    const path = await this.buildFolderPath(parentId, slug);
    const folder = await this.repos.mediaFolders.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      path,
      ...(input.parentId !== undefined
        ? input.parentId
          ? { parent: { connect: { id: input.parentId } } }
          : { parent: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'media.folder.update', id, { path: existing.path }, { path });
    return folder;
  }

  async removeFolder(id: string, actorId: string) {
    const folder = await this.repos.mediaFolders.findById(id);
    if (!folder) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Folder not found.' },
      });
    }
    const [childCount, assetCount] = await Promise.all([
      this.repos.mediaFolders.countChildren(id),
      this.repos.mediaAssets.countInFolder(id),
    ]);
    if (childCount || assetCount) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'FOLDER_NOT_EMPTY',
          message: 'Folder must be empty before deletion.',
        },
      });
    }
    await this.repos.mediaFolders.softDelete(id, actorId);
    await this.audit(actorId, 'media.folder.delete', id, { path: folder.path });
    return { deleted: true };
  }

  // --- Collections (albums) ---

  listCollections(query: CursorPaginationQuery) {
    return this.repos.mediaAlbums.list(query);
  }

  async getCollection(id: string) {
    const row = await this.repos.mediaAlbums.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found.' },
      });
    }
    return row;
  }

  async createCollection(input: CreateMediaCollectionInput, actorId: string) {
    const existing = await this.repos.mediaAlbums.findBySlug(input.slug);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'COLLECTION_EXISTS', message: 'A collection with this slug already exists.' },
      });
    }

    const album = await this.repos.mediaAlbums.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      ...(input.assetIds.length
        ? {
            assets: {
              create: input.assetIds.map((assetId, index) => ({
                assetId,
                sortOrder: index,
              })),
            },
          }
        : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'media.collection.create', album.id, undefined, { slug: album.slug });
    return album;
  }

  async updateCollection(id: string, input: UpdateMediaCollectionInput, actorId: string) {
    const existing = await this.repos.mediaAlbums.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found.' },
      });
    }
    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.repos.mediaAlbums.findBySlug(input.slug);
      if (conflict) {
        throw new ConflictException({
          success: false,
          error: { code: 'COLLECTION_EXISTS', message: 'A collection with this slug already exists.' },
        });
      }
    }

    const album = await this.repos.mediaAlbums.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      updatedBy: actorId,
    });

    if (input.assetIds) {
      await this.repos.mediaAlbums.replaceAssets(id, input.assetIds);
    }

    return this.getCollection(id);
  }

  async removeCollection(id: string, actorId: string) {
    const ok = await this.repos.mediaAlbums.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found.' },
      });
    }
    await this.audit(actorId, 'media.collection.delete', id);
    return { deleted: true };
  }
}
