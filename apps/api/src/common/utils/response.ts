export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return meta ? { success: true as const, data, meta } : { success: true as const, data };
}

export function okPage<T>(data: T[], meta: Record<string, unknown>) {
  return { success: true as const, data, meta };
}

export function okCursor<T>(page: {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  limit: number;
}) {
  return {
    success: true as const,
    data: page.items,
    meta: {
      nextCursor: page.nextCursor,
      prevCursor: page.prevCursor,
      hasMore: page.hasMore,
      limit: page.limit,
    },
  };
}
