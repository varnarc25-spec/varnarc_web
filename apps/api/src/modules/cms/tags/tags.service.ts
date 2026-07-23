import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateTagInput,
  CursorPaginationQuery,
  UpdateTagInput,
} from '@varnarc/validation';
import { REPOS } from '../../../database/database.module';

@Injectable()
export class TagsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  list(query: CursorPaginationQuery) {
    return this.repos.tags.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
    });
  }

  async getBySlug(slug: string) {
    const row = await this.repos.tags.findBySlug(slug);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tag not found.' },
      });
    }
    return row;
  }

  async listArticlesBySlug(slug: string, query: CursorPaginationQuery) {
    await this.getBySlug(slug);
    return this.repos.articles.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      tagSlug: slug,
      status: 'PUBLISHED',
    });
  }

  create(input: CreateTagInput, _actorId: string) {
    return this.repos.tags.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
    });
  }

  async update(id: string, input: UpdateTagInput) {
    const existing = await this.repos.tags.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tag not found.' },
      });
    }
    return this.repos.tags.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
  }

  async remove(id: string) {
    const ok = await this.repos.tags.softDelete(id);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tag not found.' },
      });
    }
    return { deleted: true };
  }
}
