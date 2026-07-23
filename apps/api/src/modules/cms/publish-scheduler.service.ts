import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import {
  CACHE_MANAGER,
  cmsCacheKeys,
  invalidateCmsCache,
  type Cache,
} from '../cms/cms-cache';

@Injectable()
export class PublishSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublishSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.promoteDue();
    }, 60_000);
    void this.promoteDue();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async promoteDue() {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const [articles, pages] = await Promise.all([
        this.repos.articles.publishDue(now),
        this.repos.pages.publishDue(now),
      ]);

      if (articles.count || pages.count) {
        this.logger.log(
          `Promoted scheduled content: articles=${articles.count} pages=${pages.count}`,
        );
        const keys = [
          cmsCacheKeys.articlesList('published'),
          ...articles.slugs.map((slug) => cmsCacheKeys.articleSlug(slug)),
          ...pages.slugs.map((slug) => cmsCacheKeys.pageSlug(slug)),
        ];
        await invalidateCmsCache(this.cache, keys);
      }
    } catch (error) {
      this.logger.warn(
        `Scheduled publish check failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    } finally {
      this.running = false;
    }
  }
}
