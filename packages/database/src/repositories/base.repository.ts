import type { PrismaClient } from '@prisma/client';
import {
  paginateWithCursor,
  type CursorPage,
  type CursorPageParams,
} from '../pagination';

export type AuditFields = {
  createdBy?: string | null;
  updatedBy?: string | null;
};

/**
 * Shared helpers for soft-delete-aware Prisma repositories.
 */
export abstract class BaseRepository {
  constructor(protected readonly db: PrismaClient) {}

  protected notDeleted<T extends Record<string, unknown>>(
    where?: T,
  ): T & { deletedAt: null } {
    return { ...(where as T), deletedAt: null };
  }

  protected withAuditCreate(actorId?: string | null): AuditFields {
    if (!actorId) return {};
    return { createdBy: actorId, updatedBy: actorId };
  }

  protected withAuditUpdate(actorId?: string | null): AuditFields {
    if (!actorId) return {};
    return { updatedBy: actorId };
  }
}

/** Prisma delegates are structurally incompatible with strict Record types — use a loose adapter. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDelegate = {
  findUnique: (args: any) => Promise<any>;
  findFirst: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any[]>;
  update: (args: any) => Promise<any>;
};

export async function softDeleteById(
  delegate: AnyDelegate,
  id: string,
  actorId?: string | null,
): Promise<boolean> {
  const row = await delegate.findUnique({ where: { id } });
  if (!row || row.deletedAt) return false;

  if (actorId) {
    try {
      await delegate.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: actorId },
      });
      return true;
    } catch {
      // Model may not have updated_by
    }
  }

  await delegate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return true;
}

export async function findActiveById<T = unknown>(
  delegate: AnyDelegate,
  id: string,
  include?: unknown,
): Promise<T | null> {
  return delegate.findFirst({
    where: { id, deletedAt: null },
    ...(include ? { include } : {}),
  }) as Promise<T | null>;
}

export async function listActiveWithCursor<
  T extends { id: string; createdAt: Date },
>(
  delegate: AnyDelegate,
  params: CursorPageParams & {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
  } = {},
): Promise<CursorPage<T>> {
  return paginateWithCursor(
    (args) => delegate.findMany(args) as Promise<T[]>,
    {
      ...params,
      softDelete: true,
    },
  );
}
