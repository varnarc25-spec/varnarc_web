export type ArticleSponsorInfo = {
  sponsored: boolean;
  name: string | null;
  url: string | null;
  disclosure: string;
};

export function parseArticleSponsor(metadata: unknown): ArticleSponsorInfo {
  const root = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  const sponsor =
    root.sponsor && typeof root.sponsor === 'object'
      ? (root.sponsor as Record<string, unknown>)
      : {};
  return {
    sponsored: Boolean(root.sponsored),
    name: typeof sponsor.name === 'string' && sponsor.name ? sponsor.name : null,
    url: typeof sponsor.url === 'string' && sponsor.url ? sponsor.url : null,
    disclosure:
      typeof sponsor.disclosure === 'string' && sponsor.disclosure
        ? sponsor.disclosure
        : 'Sponsored content',
  };
}
