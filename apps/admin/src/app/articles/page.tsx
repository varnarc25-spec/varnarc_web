import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch, fetchPublicCategoryTree } from '@/lib/api';
import { ArticlesEditorSection } from '@/components/articles-editor-section';
import {
  ArticlesDataTable,
  type ArticleTableRow,
} from '@/components/articles-data-table';
import type {
  CategoryTreeNode,
  EditorialSuggestion,
} from '@/components/article-trending-suggestions';

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  category?: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  } | null;
};

function toTableRow(article: ArticleRow): ArticleTableRow {
  const category = article.category;
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    status: article.status,
    updatedAt: article.updatedAt,
    categoryName: category?.parent?.name ?? category?.name ?? '—',
    subcategoryName: category?.parent ? category.name : '—',
  };
}

export default async function ArticlesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '100' });
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<ArticleRow[]>(`/articles/manage?${qs.toString()}`);
  const [suggestionsResult, categoryTree] = await Promise.all([
    apiServerFetch<EditorialSuggestion[]>('/articles/editorial-suggestions?limit=12&source=all'),
    fetchPublicCategoryTree<CategoryTreeNode[]>(),
  ]);
  const articles = Array.isArray(result.data) ? result.data : [];
  const suggestions = Array.isArray(suggestionsResult.data) ? suggestionsResult.data : [];
  const tableRows = articles.map(toTableRow);

  return (
    <div>
      <PageHeader
        title="Articles"
        description="Blog posts with draft/publish workflow and revision history on publish."
        actions={<Badge>{articles.length} loaded</Badge>}
      />

      <ArticlesEditorSection
        initialSuggestions={suggestions}
        initialCategoryTree={categoryTree}
      />

      <form className="mb-6 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search articles…"
          className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status || ''}
          className="h-10 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load articles</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ArticlesDataTable rows={tableRows} />
      )}
    </div>
  );
}
