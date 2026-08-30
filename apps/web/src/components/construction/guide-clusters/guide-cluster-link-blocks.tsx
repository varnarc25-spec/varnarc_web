import Link from 'next/link';
import type { ConstructionGuideClusterLanding } from '@varnarc/validation';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';

/**
 * Renders taxonomy-driven internal link blocks for a guide cluster pillar.
 * Sections already respect editorial overrides from the resolver.
 */
export function GuideClusterLinkBlocks({
  landing,
  showSourceHints = false,
}: {
  landing: ConstructionGuideClusterLanding;
  /** Dev/editorial: show whether a section is auto vs override */
  showSourceHints?: boolean;
}) {
  const calculators =
    landing.sections.find((s) => s.key === 'calculators')?.items.map(toItem) ?? [];
  const materials = landing.sections.find((s) => s.key === 'materials')?.items.map(toItem) ?? [];
  const comparisons =
    landing.sections.find((s) => s.key === 'comparisons')?.items.map(toItem) ?? [];
  const prices =
    landing.sections
      .find((s) => s.key === 'prices')
      ?.items.map((i) => ({
        href: i.href,
        label: i.label,
      })) ?? [];
  const guides =
    landing.sections.find((s) => s.key === 'supportingGuides')?.items.map(toItem) ?? [];

  const glossary = landing.sections.find((s) => s.key === 'glossary')?.items ?? [];
  const calcLandings = landing.sections.find((s) => s.key === 'calcLandings')?.items ?? [];
  const hubs = landing.sections.find((s) => s.key === 'hubs')?.items ?? [];

  return (
    <div className="space-y-10">
      <ConstructionRelatedLinks
        calculators={calculators}
        materials={materials}
        comparisons={comparisons}
        cityPages={prices}
        guides={guides}
      />

      {glossary.length ? (
        <section className="space-y-3">
          <SectionHeading
            title="Glossary"
            source={landing.sections.find((s) => s.key === 'glossary')?.source}
            showSourceHints={showSourceHints}
          />
          <ul className="flex flex-wrap gap-2">
            {glossary.map((g) => (
              <li key={g.id}>
                <Link href={g.href} className={cx.secondaryBtn}>
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {calcLandings.length ? (
        <section className="space-y-3">
          <SectionHeading
            title="Size & quantity landings"
            source={landing.sections.find((s) => s.key === 'calcLandings')?.source}
            showSourceHints={showSourceHints}
          />
          <ul className="flex flex-wrap gap-2">
            {calcLandings.map((g) => (
              <li key={g.id}>
                <Link href={g.href} className={cx.secondaryBtn}>
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hubs.length ? (
        <section className="space-y-3">
          <SectionHeading
            title="Related hubs"
            source={landing.sections.find((s) => s.key === 'hubs')?.source}
            showSourceHints={showSourceHints}
          />
          <ul className="flex flex-wrap gap-2">
            {hubs.map((g) => (
              <li key={g.id}>
                <Link href={g.href} className={cx.secondaryBtn}>
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function toItem(i: { href: string; label: string }) {
  return { href: i.href, label: i.label };
}

function SectionHeading({
  title,
  source,
  showSourceHints,
}: {
  title: string;
  source?: string;
  showSourceHints?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <h2 className="text-lg font-bold text-[#0b1f3a]">{title}</h2>
      {showSourceHints && source ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {source}
        </span>
      ) : null}
    </div>
  );
}

export function GuideClusterPillarView({ landing }: { landing: ConstructionGuideClusterLanding }) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">{landing.pillarIntro}</p>
        <p className="text-xs text-slate-500">{landing.qualification}</p>
      </section>

      <GuideClusterLinkBlocks landing={landing} />

      {landing.relatedClusters.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Other topic hubs</h2>
          <ul className="flex flex-wrap gap-2">
            {landing.relatedClusters.map((c) => (
              <li key={c.slug}>
                <Link href={c.href} className={cx.secondaryBtn}>
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className={cn('text-xs text-slate-400')}>
        Taxonomy {landing.version} · Unpublished supporting guides are held in the catalog but not
        auto-linked until editorial publish.
      </p>
    </div>
  );
}
