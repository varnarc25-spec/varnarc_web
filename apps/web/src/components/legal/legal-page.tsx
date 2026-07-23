import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export function LegalPage({
  title,
  description,
  sections,
  breadcrumbLabel,
}: {
  title: string;
  description: string;
  sections: ReadonlyArray<{ heading: string; body: string }>;
  breadcrumbLabel: string;
}) {
  return (
    <main className="site-container py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: breadcrumbLabel }]} />
      <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">{title}</h1>
      <p className="mt-4 text-[var(--varnarc-subtle)]">{description}</p>
      <div className="prose prose-slate mt-10 max-w-3xl text-sm leading-relaxed">
        {sections.map((section) => (
          <section key={section.heading} className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--varnarc-ink)]">{section.heading}</h2>
            <p className="mt-2 text-[var(--varnarc-subtle)]">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
