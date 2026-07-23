import { Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';

@Injectable()
export class DashboardService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async summary() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, activeUsers, suspendedUsers, recentLogins, recentActivity] =
      await Promise.all([
        this.repos.users.countAll(),
        this.repos.users.countByStatus('ACTIVE'),
        this.repos.users.countByStatus('DISABLED'),
        this.repos.users.countLoggedInSince(since),
        this.repos.auditLogs.recent(12),
      ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        disabled: suspendedUsers,
        loggedInLast7Days: recentLogins,
      },
      recentActivity: recentActivity.map((row) => ({
        id: row.id,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        createdAt: row.createdAt,
        user: row.user
          ? {
              id: row.user.id,
              email: row.user.email,
              displayName: row.user.displayName,
            }
          : null,
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}
