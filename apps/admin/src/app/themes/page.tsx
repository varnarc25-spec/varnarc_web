import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ThemeCreateForm } from '@/components/theme-create-form';
import { ThemeImportForm } from '@/components/theme-import-form';
import { ThemeEditor, type ThemeEditorValue } from '@/components/theme-editor';

type ThemeRow = ThemeEditorValue & {
  updatedAt?: string;
};

export default async function ThemesPage() {
  const [activeResult, presetsResult] = await Promise.all([
    apiServerFetch<ThemeRow>('/theme'),
    apiServerFetch<ThemeRow[]>('/theme/presets?limit=50'),
  ]);

  const active = activeResult.data;
  const presets = Array.isArray(presetsResult.data) ? presetsResult.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Theme management"
        description="Branding, colors, typography, layout tokens, presets, and live preview."
        actions={<Badge>{presets.length} presets</Badge>}
      />

      {(activeResult.error || presetsResult.error) && (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load theme data</CardTitle>
            <CardDescription>
              {[activeResult.error, presetsResult.error].filter(Boolean).join(' · ')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {active ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Active theme</h2>
            <Link className="text-sm text-[var(--varnarc-brand)] underline" href={`/themes/${active.id}`}>
              Open full editor
            </Link>
          </div>
          <ThemeEditor theme={active} />
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <ThemeCreateForm />
        <ThemeImportForm />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Presets</h2>
          <Link className="text-sm text-[var(--varnarc-brand)] underline" href="/themes/presets">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                  <td className="px-4 py-3">
                    {row.isDefault ? <Badge>Active</Badge> : <span className="text-[var(--varnarc-subtle)]">Preset</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link className="text-[var(--varnarc-brand)] underline" href={`/themes/${row.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {!presets.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No theme presets yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
