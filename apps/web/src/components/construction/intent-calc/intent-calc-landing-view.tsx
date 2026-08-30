import Link from 'next/link';
import type { IntentCalcLanding } from '@varnarc/validation';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { IntentCalcInteractive } from '@/components/construction/intent-calc/intent-calc-interactive';
import { cn, cx } from '@/components/construction/styles';

export function IntentCalcLandingView({ landing }: { landing: IntentCalcLanding }) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">{landing.editorialIntro}</p>
        <p className="text-sm leading-relaxed text-slate-700">{landing.sizeNote}</p>
        <p className="text-sm leading-relaxed text-slate-700">{landing.pairNote}</p>
        <p className="text-xs text-slate-500">{landing.qualification}</p>
      </section>

      <section className={cn(cx.card, 'p-4 sm:p-5')}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {landing.result.primaryLabel}
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#0b1f3a]">
          {landing.result.primaryValue}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {landing.result.secondaryLines.map((line) => (
            <li key={line.label}>
              <span className="font-semibold text-slate-700">{line.label}:</span> {line.value}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Visible assumptions</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <tbody>
              {landing.assumptions.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 first:border-t-0">
                  <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">{a.label}</th>
                  <td className="px-3 py-2 text-slate-800">{a.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <IntentCalcInteractive
        topic={landing.interactiveDefaults.topic}
        areaSqft={landing.interactiveDefaults.areaSqft}
        initialFloors={landing.interactiveDefaults.floors}
        initialQuality={landing.interactiveDefaults.quality}
        calculatorHref={landing.calculatorHref}
        calculatorLabel={landing.calculatorLabel}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Quality scenarios</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {landing.qualityScenarios.map((s) => (
            <div key={s.quality} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold capitalize text-[#0b1f3a]">{s.quality}</p>
              <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">
                {s.primaryValue}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Worked example</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.workedExample}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Methodology</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.methodology}</p>
        <p className="text-xs text-slate-500">
          Landing {landing.version} · Cost engine {landing.costEngineVersion}
        </p>
      </section>

      {landing.relatedHrefs.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related calculations</h2>
          <ul className="flex flex-wrap gap-2">
            {landing.relatedHrefs.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className={cx.secondaryBtn}>
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Useful links</h2>
        <ul className="flex flex-wrap gap-2">
          {landing.internalLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={cx.secondaryBtn}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ConstructionFAQ
        title="Frequently asked questions"
        faqs={landing.faqs.map((f, i) => ({ id: `faq-${i}`, ...f }))}
      />
    </div>
  );
}
