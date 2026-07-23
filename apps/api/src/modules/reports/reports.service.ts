import { Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async usersCsv(search?: string) {
    const page = await this.repos.users.list({ limit: 100, search });
    const header = ['id', 'email', 'displayName', 'status', 'roles', 'lastLoginAt', 'createdAt'];
    const lines = [header.join(',')];

    for (const user of page.items) {
      const roles = user.roles.map((r) => r.role.slug).join('|');
      lines.push(
        [
          user.id,
          user.email,
          user.displayName ?? '',
          user.status,
          roles,
          user.lastLoginAt?.toISOString() ?? '',
          user.createdAt.toISOString(),
        ]
          .map((v) => csvEscape(String(v)))
          .join(','),
      );
    }

    return lines.join('\n');
  }
}
