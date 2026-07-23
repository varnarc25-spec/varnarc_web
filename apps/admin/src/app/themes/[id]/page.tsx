import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ThemeEditor, type ThemeEditorValue } from '@/components/theme-editor';

type ThemeRow = ThemeEditorValue;

export default async function ThemeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<ThemeRow>(`/theme/presets/${id}`);
  const theme = result.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={theme?.name ?? 'Theme editor'}
        description="Edit branding, colors, typography, and layout tokens with live preview."
        actions={
          <Link className="text-sm text-[var(--varnarc-brand)] underline" href="/themes">
            Back to themes
          </Link>
        }
      />

      {result.error || !theme ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load theme</CardTitle>
            <CardDescription>{result.error || 'Theme not found.'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge>{theme.slug}</Badge>
            {theme.isDefault ? <Badge>Active</Badge> : null}
          </div>
          <ThemeEditor theme={theme} />
        </>
      )}
    </div>
  );
}
