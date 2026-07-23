import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateCategoryInput,
  CursorPaginationQuery,
  UpdateCategoryInput,
} from '@varnarc/validation';
import { REPOS } from '../../../database/database.module';

@Injectable()
export class CategoriesService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  list(query: CursorPaginationQuery) {
    return this.repos.categories.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
    });
  }

  tree() {
    return this.repos.categories.listTree({ status: 'PUBLISHED' });
  }

  async getById(id: string) {
    const row = await this.repos.categories.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    return row;
  }

  async getBySlug(slug: string) {
    const row = await this.repos.categories.findBySlug(slug);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    return row;
  }

  create(input: CreateCategoryInput, actorId: string) {
    return this.repos.categories.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async update(id: string, input: UpdateCategoryInput, actorId: string) {
    await this.getById(id);
    const { parentId, ...rest } = input;
    return this.repos.categories.update(id, {
      ...rest,
      ...(parentId !== undefined
        ? parentId
          ? { parent: { connect: { id: parentId } } }
          : { parent: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
  }

  async remove(id: string, actorId: string) {
    const ok = await this.repos.categories.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    return { deleted: true };
  }
}
