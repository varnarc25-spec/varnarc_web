import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ThemeCreateForm } from '@/components/theme-create-form';
import { ThemePresetActions } from '@/components/theme-preset-actions';

type ThemeRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isDefault: boolean;
  updatedAt?: string;
};

export default async function ThemePresetsPage() {
  const result = await apiServerFetch<ThemeRow[]>('/theme/presets?limit=50');
  const presets = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Theme presets"
        description="Switch, publish, and manage predefined theme presets."
        actions={<Badge>{presets.length} presets</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load presets</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ThemeCreateForm />

      <div className="space-y-3">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex flex-col gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{preset.name}</h3>
                {preset.isDefault ? <Badge>Active</Badge> : null}
              </div>
              <p className="text-sm text-[var(--varnarc-subtle)]">
                {preset.description || preset.slug}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link className="text-sm text-[var(--varnarc-brand)] underline" href={`/themes/${preset.id}`}>
                Edit
              </Link>
              <ThemePresetActions id={preset.id} isDefault={preset.isDefault} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
