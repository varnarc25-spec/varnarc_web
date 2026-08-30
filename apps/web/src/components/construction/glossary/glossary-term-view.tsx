import Link from 'next/link';
import {
  constructionEntityIdFromGlossarySlug,
  type ConstructionGlossaryTermLanding,
} from '@varnarc/validation';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
import { cn, cx } from '@/components/construction/styles';

export function ConstructionGlossaryTermView({
  landing,
}: {
  landing: ConstructionGlossaryTermLanding;
}) {
  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {landing.categoryLabel}
          {landing.alsoKnownAs?.length ? ` · Also: ${landing.alsoKnownAs.join(', ')}` : ''}
        </p>
        <p className="text-base font-semibold leading-relaxed text-[#0b1f3a]">
          {landing.simpleDefinition}
        </p>
        <p className="text-xs text-slate-500">{landing.qualification}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Technical explanation</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.technicalExplanation}</p>
      </section>

      <section className={cn(cx.card, 'space-y-2 p-4 sm:p-5')}>
        <h2 className="text-lg font-bold text-[#0b1f3a]">Example</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.example}</p>
      </section>

      {landing.units.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Relevant units</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Unit</th>
                  <th className="px-3 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {landing.units.map((u) => (
                  <tr key={u.unit} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold tabular-nums text-slate-800">
                      {u.unit}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{u.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Take the next step</h2>
        <ul className="flex flex-wrap gap-2">
          {landing.relatedCalculator ? (
            <li>
              <Link href={landing.relatedCalculator.href} className={cx.primaryBtn}>
                {landing.relatedCalculator.label}
              </Link>
            </li>
          ) : null}
          {landing.nextActions.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className={cx.secondaryBtn}>
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {landing.relatedMaterials.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related materials</h2>
          <ul className="flex flex-wrap gap-2">
            {landing.relatedMaterials.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className={cx.secondaryBtn}>
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {landing.relatedTerms.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related glossary terms</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {landing.relatedTerms.map((t) => (
              <li key={t.slug}>
                <Link
                  href={t.href}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#f97316]/40"
                >
                  <p className="font-bold text-[#0b1f3a]">{t.term}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-3">
                    {t.simpleDefinition}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(() => {
        const entityId = constructionEntityIdFromGlossarySlug(landing.slug);
        if (!entityId) return null;
        return (
          <ConstructionRelatedSection
            entityId={entityId}
            surface="glossary"
            relations={['related_calculators', 'related_materials', 'related_guides']}
          />
        );
      })()}

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">How we write glossary pages</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.methodology}</p>
        <p className="text-xs text-slate-500">Glossary {landing.version}</p>
      </section>

      {landing.faqs.length > 0 ? (
        <ConstructionFAQ
          title={`${landing.term} — FAQs`}
          faqs={landing.faqs.map((f, i) => ({ id: `faq-${i}`, ...f }))}
        />
      ) : null}

      <p className="text-sm">
        <Link href="/construction/glossary" className="font-semibold text-[#f97316]">
          ← All glossary terms
        </Link>
      </p>
    </div>
  );
}
