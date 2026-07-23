import { Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../../database/database.module';

@Injectable()
export class CmsDashboardService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async summary() {
    const [
      totalPages,
      publishedPages,
      draftPages,
      scheduledPages,
      totalArticles,
      publishedArticles,
      draftArticles,
      scheduledArticles,
      mediaCount,
      recentPages,
      recentArticles,
    ] = await Promise.all([
      this.repos.pages.countAll(),
      this.repos.pages.countByStatus('PUBLISHED'),
      this.repos.pages.countByStatus('DRAFT'),
      this.repos.pages.countByStatus('SCHEDULED'),
      this.repos.articles.countAll(),
      this.repos.articles.countByStatus('PUBLISHED'),
      this.repos.articles.countByStatus('DRAFT'),
      this.repos.articles.countByStatus('SCHEDULED'),
      this.repos.mediaAssets.countAll(),
      this.repos.pages.recent(8),
      this.repos.articles.recent(8),
    ]);

    const recentUpdates = [
      ...recentPages.map((row) => ({
        id: row.id,
        type: 'page' as const,
        title: row.title,
        slug: row.slug,
        status: row.status,
        updatedAt: row.updatedAt,
      })),
      ...recentArticles.map((row) => ({
        id: row.id,
        type: 'article' as const,
        title: row.title,
        slug: row.slug,
        status: row.status,
        updatedAt: row.updatedAt,
      })),
    ]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 12);

    return {
      pages: {
        total: totalPages,
        published: publishedPages,
        draft: draftPages,
        scheduled: scheduledPages,
      },
      articles: {
        total: totalArticles,
        published: publishedArticles,
        draft: draftArticles,
        scheduled: scheduledArticles,
      },
      media: {
        total: mediaCount,
      },
      recentUpdates,
      generatedAt: new Date().toISOString(),
    };
  }
}
