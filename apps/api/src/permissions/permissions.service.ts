import { Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type { PaginationQuery } from '@varnarc/validation';
import { REPOS } from '../database/database.module';

@Injectable()
export class PermissionsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async list(query: PaginationQuery) {
    const { total, rows } = await this.repos.permissions.listOffset({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });

    return {
      data: rows,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }
}
