import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';
import { ArticleThumbnail } from '@/components/articles/article-thumbnail';

export function ArticleCard({
  title,
  excerpt,
  slug,
  href,
  imageUrl,
  categorySlug,
  category,
}: {
  title: string;
  excerpt?: string | null;
  slug: string;
  href?: string;
  imageUrl?: string | null;
  categorySlug?: string | null;
  category?: { slug: string; parent?: { slug: string } | null } | null;
}) {
  return (
    <Link href={href ?? `/articles/${slug}`} className="block transition hover:opacity-95">
      <Card className="h-full overflow-hidden">
        <ArticleThumbnail title={title} imageUrl={imageUrl} categorySlug={categorySlug} category={category} size="md" />
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {excerpt ? <CardDescription className="line-clamp-3">{excerpt}</CardDescription> : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
