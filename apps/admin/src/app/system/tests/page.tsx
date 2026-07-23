import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { SystemNav } from '@/components/system/system-nav';

const suites = [
  {
    name: 'API unit + integration',
    package: '@varnarc/api',
    path: 'apps/api/test/',
    command: 'pnpm --filter @varnarc/api test',
  },
  {
    name: 'Validation schemas',
    package: '@varnarc/validation',
    path: 'packages/validation/tests/',
    command: 'pnpm --filter @varnarc/validation test',
  },
  {
    name: 'Web unit',
    package: '@varnarc/web',
    path: 'apps/web/tests/unit/',
    command: 'pnpm --filter @varnarc/web test',
  },
  {
    name: 'Web E2E (Playwright)',
    package: '@varnarc/web',
    path: 'apps/web/tests/e2e/',
    command: 'pnpm --filter @varnarc/web test:e2e',
  },
];

export default function SystemTestsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Test suite"
        description="Automated tests run in CI and locally. See testing/README.md in the repo."
      />
      <SystemNav active="/system/tests" />

      <Card>
        <CardHeader>
          <CardTitle>CI pipeline</CardTitle>
          <CardDescription>
            GitHub Actions: typecheck → pnpm test → build → Playwright e2e → npm audit (high).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {suites.map((suite) => (
          <Card key={suite.name}>
            <CardHeader>
              <CardDescription>{suite.package}</CardDescription>
              <CardTitle className="text-lg">{suite.name}</CardTitle>
              <CardDescription className="mt-2 space-y-1 font-mono text-xs">
                <span className="block">{suite.path}</span>
                <span className="block text-[var(--varnarc-brand)]">{suite.command}</span>
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E2E coverage</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">Smoke — home, articles, tags, compare</span>
            <span className="block">Accessibility — axe on public routes (serious/critical)</span>
            <span className="block">SEO — robots.txt, title, meta / canonical</span>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
