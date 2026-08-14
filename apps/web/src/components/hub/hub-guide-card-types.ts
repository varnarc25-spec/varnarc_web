export type HubGuideItem = {
  slug: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  readMinutes?: number | null;
  imageUrl?: string | null;
  href: string;
};
