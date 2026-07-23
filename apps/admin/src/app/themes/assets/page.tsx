import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ThemeAssetForm } from '@/components/theme-asset-form';

type ThemeRow = { id: string; name: string; isDefault: boolean };

type ThemeAsset = {
  id: string;
  type: string;
  url: string | null;
  media?: { secureUrl?: string; url?: string } | null;
};

export default async function ThemeAssetsPage() {
  const [activeResult, assetsResult] = await Promise.all([
    apiServerFetch<ThemeRow>('/theme'),
    apiServerFetch<ThemeAsset[]>('/theme/assets'),
  ]);

  const active = activeResult.data;
  const assets = Array.isArray(assetsResult.data) ? assetsResult.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Theme assets"
        description="Logos, favicons, and Open Graph images for the active theme."
        actions={<Badge>{assets.length} assets</Badge>}
      />

      {(activeResult.error || assetsResult.error) && (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load assets</CardTitle>
            <CardDescription>
              {[activeResult.error, assetsResult.error].filter(Boolean).join(' · ')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {active ? <ThemeAssetForm themeId={active.id} /> : null}

      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">URL</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3 font-mono text-xs">{asset.type}</td>
                <td className="px-4 py-3 truncate max-w-xl text-[var(--varnarc-subtle)]">
                  {asset.url || asset.media?.secureUrl || asset.media?.url || '—'}
                </td>
              </tr>
            ))}
            {!assets.length ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No theme assets yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
