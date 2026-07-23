import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ThemeImportForm } from '@/components/theme-import-form';

type MarketplaceTheme = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  season?: string | null;
  marketplaceListed?: boolean;
};

export default async function ThemeMarketplacePage() {
  // Marketplace is public on API; admin still uses auth token via apiServerFetch.
  const result = await apiServerFetch<MarketplaceTheme[]>('/theme/marketplace?limit=50');
  const themes = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Theme marketplace"
        description="Browse shared theme presets and import them into your workspace."
        actions={<Badge>{themes.length} listed</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load marketplace</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ThemeImportForm />

      <div className="grid gap-3 md:grid-cols-2">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme.name}
                {theme.season ? <Badge>{theme.season}</Badge> : null}
              </CardTitle>
              <CardDescription>{theme.description || theme.slug}</CardDescription>
              <Link className="text-sm text-[var(--varnarc-brand)] underline" href={`/themes/${theme.id}`}>
                Open preset
              </Link>
            </CardHeader>
          </Card>
        ))}
        {!themes.length ? (
          <p className="text-sm text-[var(--varnarc-subtle)] md:col-span-2">
            No marketplace themes listed yet. Enable “List in theme marketplace” on a preset.
          </p>
        ) : null}
      </div>
    </div>
  );
}
