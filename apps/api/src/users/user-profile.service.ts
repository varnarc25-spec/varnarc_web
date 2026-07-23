import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  ActivityListQuery,
  BookmarkListQuery,
  CheckContentSubscriptionsInput,
  CreateBookmarkInput,
  RecordReadingHistoryInput,
  ReadingHistoryListQuery,
  SetAvatarInput,
  ToggleContentSubscriptionInput,
  UpdateContentSubscriptionsInput,
  UpdateProfileInput,
  UserPreferencesInput,
} from '@varnarc/validation';
import { READING_HISTORY_ACTIVITY_TYPE } from '@varnarc/validation';
import { REPOS } from '../database/database.module';
import { UsersService } from '../auth/users.service';
import { MediaService } from '../modules/media/media.service';
import { enrichBookmarks, resolveBookmarkEntity } from './bookmark-resolver.util';

function sliceCursor<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}

@Injectable()
export class UserProfileService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  async getMe(userId: string) {
    return this.usersService.getById(userId);
  }

  async updateMe(userId: string, input: UpdateProfileInput, actorId: string) {
    if (input.username) {
      const clash = await this.repos.users.findByUsername(input.username);
      if (clash && clash.id !== userId) {
        throw new BadRequestException('Username already taken');
      }
    }
    return this.usersService.updateProfile(userId, input, actorId);
  }

  async setAvatar(userId: string, input: SetAvatarInput, actorId: string) {
    const asset = await this.repos.mediaAssets.findById(input.mediaAssetId);
    if (!asset) throw new NotFoundException('Media asset not found');
    await this.repos.users.updateProfile(userId, {
      avatarMediaId: asset.id,
      avatarUrl: asset.url,
      updatedBy: actorId,
    });
    await this.repos.userActivity.record({
      userId,
      activityType: 'avatar.updated',
      entityType: 'media',
      entityId: asset.id,
    });
    return this.getMe(userId);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File, actorId: string) {
    if (!file?.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image file');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Avatar must be 5 MB or smaller');
    }
    const asset = await this.mediaService.uploadFile(file, actorId, { alt: 'Profile avatar' });
    return this.setAvatar(userId, { mediaAssetId: asset.id }, actorId);
  }

  async getPreferences(userId: string) {
    const prefs = await this.repos.userPreferences.findByUserId(userId);
    return (
      prefs ?? {
        theme: null,
        language: null,
        timezone: null,
        notificationSettings: { inApp: true, email: true },
        privacySettings: { profileVisibility: 'PUBLIC' },
        newsletterOptIn: false,
      }
    );
  }

  async updatePreferences(userId: string, input: UserPreferencesInput) {
    return this.repos.userPreferences.upsert(userId, {
      theme: input.theme ?? undefined,
      language: input.language ?? undefined,
      timezone: input.timezone ?? undefined,
      notificationSettings: input.notificationSettings ?? undefined,
      privacySettings: input.privacySettings ?? undefined,
      newsletterOptIn: input.newsletterOptIn,
    });
  }

  async listBookmarks(userId: string, query: BookmarkListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.bookmarks.list(userId, query);
    const page = sliceCursor(rows, limit);
    const items = await enrichBookmarks(this.repos, page.items);
    return { ...page, items };
  }

  async createBookmark(userId: string, input: CreateBookmarkInput) {
    try {
      const row = await this.repos.bookmarks.create({
        user: { connect: { id: userId } },
        entityType: input.entityType,
        entityId: input.entityId,
        collectionName: input.collectionName ?? null,
      });
      await this.repos.userActivity.record({
        userId,
        activityType: 'bookmark.created',
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: { collectionName: input.collectionName ?? null },
      });
      return row;
    } catch {
      throw new BadRequestException('Bookmark already exists');
    }
  }

  async deleteBookmark(userId: string, bookmarkId: string) {
    const result = await this.repos.bookmarks.softDelete(userId, bookmarkId);
    if (!result.count) throw new NotFoundException('Bookmark not found');
    return { ok: true };
  }

  async listActivity(userId: string, query: ActivityListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.userActivity.list(userId, query);
    const filtered = query.activityType
      ? rows
      : rows.filter((row) => row.activityType !== READING_HISTORY_ACTIVITY_TYPE);
    const page = sliceCursor(filtered, limit);
    const items = await Promise.all(
      page.items.map(async (row) => {
        if (!row.entityType || !row.entityId) return row;
        const resolved = await resolveBookmarkEntity(this.repos, row.entityType, row.entityId);
        return {
          ...row,
          title: resolved.title,
          href: resolved.href,
          subtitle: resolved.subtitle,
        };
      }),
    );
    return { ...page, items };
  }

  async recordReadingView(userId: string, input: RecordReadingHistoryInput) {
    const entityType = input.entityType.toLowerCase();
    const existing = await this.repos.userActivity.findLatestReadingView(
      userId,
      READING_HISTORY_ACTIVITY_TYPE,
      entityType,
      input.entityId,
    );

    const metadata = (input.metadata ?? undefined) as never;
    const now = new Date();

    if (existing) {
      return this.repos.userActivity.updateReadingView(existing.id, {
        createdAt: now,
        ...(metadata !== undefined ? { metadata } : {}),
      });
    }

    return this.repos.userActivity.record({
      userId,
      activityType: READING_HISTORY_ACTIVITY_TYPE,
      entityType,
      entityId: input.entityId,
      metadata,
    });
  }

  async listReadingHistory(userId: string, query: ReadingHistoryListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.userActivity.listReadingHistory(userId, {
      activityType: READING_HISTORY_ACTIVITY_TYPE,
      entityType: query.entityType,
      cursor: query.cursor,
      limit,
    });
    const page = sliceCursor(rows, limit);
    const items = await enrichBookmarks(this.repos, page.items as Array<{
      id: string;
      entityType: string;
      entityId: string;
      createdAt: Date;
      metadata?: unknown;
    }>);
    return { ...page, items };
  }

  async deleteReadingHistoryItem(userId: string, activityId: string) {
    const result = await this.repos.userActivity.deleteForUser(userId, activityId);
    if (!result.count) throw new NotFoundException('Reading history item not found');
    return { ok: true };
  }

  async clearReadingHistory(userId: string) {
    const result = await this.repos.userActivity.clearReadingHistory(
      userId,
      READING_HISTORY_ACTIVITY_TYPE,
    );
    return { deleted: result.count };
  }

  async listSubscriptions(userId: string) {
    return this.repos.userContentSubscriptions.listByUser(userId);
  }

  async updateSubscriptions(userId: string, input: UpdateContentSubscriptionsInput) {
    return this.repos.userContentSubscriptions.replaceForUser(userId, input.subscriptions);
  }

  async toggleSubscription(userId: string, input: ToggleContentSubscriptionInput) {
    return this.repos.userContentSubscriptions.toggle(
      userId,
      input.subscriptionType,
      input.target,
      input.subscribed,
    );
  }

  async checkSubscriptions(userId: string, input: CheckContentSubscriptionsInput) {
    return this.repos.userContentSubscriptions.checkMany(userId, input.items);
  }

  async subscriptionFeed(userId: string, limit = 20) {
    const articles = await this.repos.userContentSubscriptions.feedArticles(userId, limit);
    return { articles };
  }

  async subscriptionCatalog() {
    const [categoriesPage, tagsPage, authors] = await Promise.all([
      this.repos.categories.list({ limit: 50 }),
      this.repos.tags.list({ limit: 50 }),
      this.repos.users.findAuthorsWithPublishedArticles(30),
    ]);

    return {
      categories: categoriesPage.items.map((row: { slug: string; name: string }) => ({
        slug: row.slug,
        name: row.name,
      })),
      tags: tagsPage.items.map((row: { slug: string; name: string }) => ({
        slug: row.slug,
        name: row.name,
      })),
      topics: [
        'home loans',
        'personal finance',
        'tax planning',
        'construction cost',
        'electric vehicles',
        'rooftop solar',
      ],
      authors: authors.map((row: { username: string | null; displayName: string | null }) => ({
        username: row.username,
        displayName: row.displayName,
      })),
    };
  }

  async adminActivityDashboard(query: ActivityListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.userActivity.listAll(query);
    const recentCount = await this.repos.userActivity.countRecent(7);
    const page = sliceCursor(rows, limit);
    return { recentCount, ...page };
  }

  async adminSubscriptionsDashboard(query: { cursor?: string; limit?: number }) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.userContentSubscriptions.listAll(query);
    return sliceCursor(rows, limit);
  }
}
