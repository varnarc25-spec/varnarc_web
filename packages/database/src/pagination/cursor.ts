export type CursorDirection = 'asc' | 'desc';

export interface CursorPayload {
  id: string;
  createdAt: string;
}

export interface CursorPageParams {
  /** Max items to return (1–100). Default 20. */
  limit?: number;
  /** Opaque cursor from a previous page. */
  cursor?: string | null;
  direction?: CursorDirection;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export function normalizeLimit(limit?: number, fallback = 20): number {
  if (limit == null || Number.isNaN(limit)) return fallback;
  return Math.min(100, Math.max(1, Math.floor(limit)));
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as CursorPayload;
    if (!parsed?.id || !parsed?.createdAt) {
      throw new Error('Invalid cursor payload');
    }
    return parsed;
  } catch {
    throw new Error('Invalid cursor');
  }
}

export function toCursorPayload(row: {
  id: string;
  createdAt: Date;
}): CursorPayload {
  return { id: row.id, createdAt: row.createdAt.toISOString() };
}

/**
 * Prisma `where` clause for keyset pagination on (createdAt, id).
 * Use with `orderBy: [{ createdAt: direction }, { id: direction }]`.
 */
export function cursorWhereClause(
  cursor: string | null | undefined,
  direction: CursorDirection = 'desc',
): Record<string, unknown> | undefined {
  if (!cursor) return undefined;

  const { id, createdAt } = decodeCursor(cursor);
  const createdAtDate = new Date(createdAt);
  const cmp = direction === 'desc' ? 'lt' : 'gt';

  return {
    OR: [
      { createdAt: { [cmp]: createdAtDate } },
      { createdAt: createdAtDate, id: { [cmp]: id } },
    ],
  };
}

export function mergeWhere(
  base?: Record<string, unknown> | null,
  extra?: Record<string, unknown> | null,
): Record<string, unknown> | undefined {
  const parts = [base, extra].filter(
    (p): p is Record<string, unknown> => !!p && Object.keys(p).length > 0,
  );
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export function buildCursorPage<T extends { id: string; createdAt: Date }>(
  rows: T[],
  limit: number,
  options?: { includePrevCursor?: boolean },
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && items.length > 0
      ? encodeCursor(toCursorPayload(items[items.length - 1]!))
      : null;
  const prevCursor =
    options?.includePrevCursor && items.length > 0
      ? encodeCursor(toCursorPayload(items[0]!))
      : null;

  return { items, nextCursor, prevCursor, hasMore, limit };
}

export type FindManyCursorArgs = {
  where?: Record<string, unknown>;
  take: number;
  orderBy: Array<Record<string, CursorDirection>>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
};

/**
 * Generic cursor paginator for models with `id` + `createdAt`.
 */
export async function paginateWithCursor<
  T extends { id: string; createdAt: Date },
>(
  findMany: (args: FindManyCursorArgs) => Promise<T[]>,
  params: CursorPageParams & {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
    softDelete?: boolean;
    /** Custom Prisma orderBy; defaults to createdAt + id for cursor stability. */
    orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
  } = {},
): Promise<CursorPage<T>> {
  const limit = normalizeLimit(params.limit);
  const direction = params.direction ?? 'desc';
  const soft = params.softDelete !== false ? { deletedAt: null } : undefined;
  const where = mergeWhere(
    soft,
    mergeWhere(params.where, cursorWhereClause(params.cursor, direction)),
  );

  const orderBy = params.orderBy
    ? ([
        ...(Array.isArray(params.orderBy) ? params.orderBy : [params.orderBy]),
        { id: direction },
      ] as Array<Record<string, CursorDirection>>)
    : ([{ createdAt: direction }, { id: direction }] as Array<
        Record<string, CursorDirection>
      >);

  const rows = await findMany({
    where,
    take: limit + 1,
    orderBy,
    ...(params.include ? { include: params.include } : {}),
    ...(params.select ? { select: params.select } : {}),
  });

  return buildCursorPage(rows, limit);
}
