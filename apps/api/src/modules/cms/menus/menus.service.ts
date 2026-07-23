import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateMenuInput,
  CreateMenuItemInput,
  CursorPaginationQuery,
  ReorderMenuItemsInput,
  UpdateMenuInput,
  UpdateMenuItemInput,
} from '@varnarc/validation';
import { REPOS } from '../../../database/database.module';
import {
  CACHE_MANAGER,
  cmsCacheKeys,
  invalidateCmsCache,
  type Cache,
} from '../cms-cache';

@Injectable()
export class MenusService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  list(query: CursorPaginationQuery & { location?: string }) {
    return this.repos.menus.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      location: query.location,
    });
  }

  async getById(id: string) {
    const row = await this.repos.menus.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu not found.' },
      });
    }
    return row;
  }

  async getByLocation(location: string) {
    const cacheKey = cmsCacheKeys.menuLocation(location);
    const cached = await this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    const row = await this.repos.menus.findByLocation(location);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu not found.' },
      });
    }
    await this.cache.set(cacheKey, row, 60_000);
    return row;
  }

  private async bustLocation(location?: string | null) {
    if (location) {
      await invalidateCmsCache(this.cache, [cmsCacheKeys.menuLocation(location)]);
    }
  }

  async create(input: CreateMenuInput, actorId: string) {
    const row = await this.repos.menus.create({
      name: input.name,
      slug: input.slug,
      location: input.location,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.bustLocation(row.location);
    return row;
  }

  async update(id: string, input: UpdateMenuInput, actorId: string) {
    const existing = await this.getById(id);
    const row = await this.repos.menus.update(id, {
      ...input,
      updatedBy: actorId,
    });
    await this.bustLocation(existing.location);
    await this.bustLocation(row.location);
    return row;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.getById(id);
    const ok = await this.repos.menus.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu not found.' },
      });
    }
    await this.bustLocation(existing.location);
    return { deleted: true };
  }

  async addItem(menuId: string, input: CreateMenuItemInput, actorId: string) {
    const menu = await this.getById(menuId);
    await this.repos.menus.createItem({
      label: input.label,
      href: input.href ?? null,
      sortOrder: input.sortOrder,
      menu: { connect: { id: menuId } },
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.bustLocation(menu.location);
    return this.getById(menuId);
  }

  async updateItem(menuId: string, itemId: string, input: UpdateMenuItemInput, actorId: string) {
    const menu = await this.getById(menuId);
    const { parentId, ...rest } = input;
    await this.repos.menus.updateItem(itemId, {
      ...rest,
      ...(parentId !== undefined
        ? parentId
          ? { parent: { connect: { id: parentId } } }
          : { parent: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
    await this.bustLocation(menu.location);
    return this.getById(menuId);
  }

  async removeItem(menuId: string, itemId: string, actorId: string) {
    const menu = await this.getById(menuId);
    await this.repos.menus.softDeleteItem(itemId, actorId);
    await this.bustLocation(menu.location);
    return this.getById(menuId);
  }

  async reorder(menuId: string, input: ReorderMenuItemsInput) {
    const menu = await this.getById(menuId);
    const row = await this.repos.menus.reorderItems(menuId, input.orderedIds);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu not found.' },
      });
    }
    await this.bustLocation(menu.location);
    return row;
  }
}
