import { Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type { CursorPaginationQuery } from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

@Injectable()
export class AuditService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  list(
    query: CursorPaginationQuery & {
      userId?: string;
      entity?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ) {
    return this.repos.auditLogs.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      userId: query.userId,
      entity: query.entity,
      action: query.action,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }
}
