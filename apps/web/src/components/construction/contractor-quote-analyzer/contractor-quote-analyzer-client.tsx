'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CONTRACTOR_QUOTE_CATEGORIES,
  CONTRACTOR_QUOTE_QUALIFICATION,
  analyzeContractorQuotes,
  csvTemplateHeaders,
  emptyQuote,
  newQuoteLineId,
  parseQuoteCsv,
  type AnalyzeContractorQuotesInput,
  type ContractorQuoteInput,
  type QuoteCategoryKey,
  type QuoteCompareResult,
  type QuoteLineInput,
} from '@varnarc/validation';
import {
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import { downloadCsv, printConstructionPage, csvEscape } from '@/lib/construction/export';
import { QUOTE_ANALYZER_FAQS, QUOTE_ANALYZER_RELATED } from './content';

function money(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

type Mapping = NonNullable<AnalyzeContractorQuotesInput['mappings']>[number];

type Props = {
  initialProjectId?: string;
};

export function ContractorQuoteAnalyzerClient({ initialProjectId }: Props) {
  const [quotes, setQuotes] = useState<ContractorQuoteInput[]>(() => [
    emptyQuote(1),
    emptyQuote(2),
  ]);
  const [activeQuote, setActiveQuote] = useState(0);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [result, setResult] = useState<QuoteCompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [csvWarning, setCsvWarning] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectId, setProjectId] = useState(initialProjectId ?? '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [mapFrom, setMapFrom] = useState<{ quoteId: string; itemId: string } | null>(null);
  const [mapToQuoteId, setMapToQuoteId] = useState('');
  const [mapToItemId, setMapToItemId] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as Array<{ id: string; name: string }>;
        if (!cancelled && Array.isArray(list)) {
          setProjects(list.map((p) => ({ id: p.id, name: p.name || 'Untitled project' })));
        }
      } catch {
        /* guest */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runCompare = useCallback(() => {
    setError(null);
    setActionMsg(null);
    try {
      const filled = quotes.filter((q) => q.items.length > 0);
      if (filled.length < 1) {
        setError('Add at least one line item to a quote.');
        setResult(null);
        return;
      }
      if (filled.length > 3) {
        setError('Compare up to 3 quotes.');
        return;
      }
      const next = analyzeContractorQuotes({
        quotes: filled,
        mappings,
      });
      setResult(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Comparison failed.');
      setResult(null);
    }
  }, [quotes, mappings]);

  function updateQuote(index: number, patch: Partial<ContractorQuoteInput>) {
    setQuotes((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateItem(qi: number, itemId: string, patch: Partial<QuoteLineInput>) {
    setQuotes((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        return {
          ...q,
          items: q.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        };
      }),
    );
  }

  function addItem(qi: number) {
    setQuotes((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        return {
          ...q,
          items: [
            ...q.items,
            {
              id: newQuoteLineId(),
              description: '',
              category: 'other' as QuoteCategoryKey,
              unit: '',
              quantity: null,
              unitRate: null,
              amount: null,
            },
          ],
        };
      }),
    );
  }

  function removeItem(qi: number, itemId: string) {
    setQuotes((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, items: q.items.filter((it) => it.id !== itemId) } : q,
      ),
    );
  }

  function addQuoteSlot() {
    if (quotes.length >= 3) return;
    const slot = (quotes.length + 1) as 1 | 2 | 3;
    setQuotes((prev) => [...prev, emptyQuote(slot)]);
    setActiveQuote(quotes.length);
  }

  function removeQuoteSlot(index: number) {
    if (quotes.length <= 1) return;
    setQuotes((prev) => prev.filter((_, i) => i !== index));
    setActiveQuote(0);
    setMappings([]);
    setResult(null);
  }

  async function onCsvUpload(file: File, qi: number) {
    setCsvWarning(null);
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      setCsvWarning(
        'PDF and Excel (.xlsx) parsing are not supported in this version. Export your sheet as CSV, or enter lines manually.',
      );
      return;
    }
    const text = await file.text();
    const { rows, warnings } = parseQuoteCsv(text);
    if (warnings.length) setCsvWarning(warnings.join(' '));
    if (!rows.length) return;
    const items: QuoteLineInput[] = rows.map((r) => ({
      id: newQuoteLineId(),
      description: r.description,
      category: r.category ?? 'other',
      unit: r.unit,
      quantity: r.quantity,
      unitRate: r.unitRate,
      amount: r.amount,
    }));
    updateQuote(qi, { items: [...quotes[qi]!.items, ...items] });
    setActionMsg(`Imported ${items.length} line(s) into ${quotes[qi]!.label}.`);
  }

  function downloadTemplate() {
    downloadCsv('varnarc-quote-template.csv', [
      csvTemplateHeaders(),
      'RCC M20 slab,rcc,m3,10,6200,62000',
    ]);
  }

  function applyManualMap() {
    if (!mapFrom || !mapToQuoteId || !mapToItemId) return;
    if (mapFrom.quoteId === mapToQuoteId) {
      setError('Map items across different quotes.');
      return;
    }
    setMappings((prev) => [
      ...prev.filter(
        (m) =>
          !(
            (m.fromQuoteId === mapFrom.quoteId && m.fromItemId === mapFrom.itemId) ||
            (m.toQuoteId === mapToQuoteId && m.toItemId === mapToItemId)
          ),
      ),
      {
        fromQuoteId: mapFrom.quoteId,
        fromItemId: mapFrom.itemId,
        toQuoteId: mapToQuoteId,
        toItemId: mapToItemId,
      },
    ]);
    setMapFrom(null);
    setMapToItemId('');
    setActionMsg('Mapping saved. Re-run compare to refresh flags.');
  }

  async function saveToProject() {
    if (!projectId) {
      setActionMsg('Choose a saved project to attach this comparison.');
      return;
    }
    const analysis =
      result ?? analyzeContractorQuotes({ quotes: quotes.filter((q) => q.items.length), mappings });
    if (!analysis.quotes.length) {
      setActionMsg('Add quote lines before saving.');
      return;
    }
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const lines = analysis.quotes.flatMap((q) =>
        q.items.map((it, index) => ({
          name: `${q.label}: ${it.description}`.slice(0, 150),
          description: [
            `Quote comparison line`,
            it.categoryLabel,
            it.unit ? `Unit ${it.unit}` : null,
          ]
            .filter(Boolean)
            .join(' · ')
            .slice(0, 2000),
          unit: it.unit || 'LS',
          quantity: it.quantity ?? 1,
          unitRate: it.unitRate ?? it.amount,
          sortOrder: index,
          metadata: {
            source: 'contractor_quote_analyzer',
            quoteId: q.id,
            quoteLabel: q.label,
            category: it.category,
            analyzerVersion: analysis.version,
          },
        })),
      );

      const notes = [
        CONTRACTOR_QUOTE_QUALIFICATION,
        `Totals: ${analysis.quoteTotals.map((t) => `${t.label}=${t.total}`).join('; ')}`,
        analysis.missingItems.length ? `Missing-item flags: ${analysis.missingItems.length}` : null,
        'No market benchmarks invented.',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch(`/api/construction/projects/${projectId}/boqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Quote comparison (${analysis.quotes.map((q) => q.label).join(' vs ')})`.slice(
            0,
            150,
          ),
          currency: 'INR',
          status: 'DRAFT',
          contingencyPercent: 0,
          taxPercent: 0,
          notes: notes.slice(0, 2000),
          items: lines,
        }),
      });
      if (res.status === 401) {
        setActionMsg('Sign in to save this comparison to a project.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Save failed');
      }
      setActionMsg('Comparison saved to project as a draft BOQ.');
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  function exportComparisonCsv() {
    if (!result) return;
    const lines = [
      ['quote', 'category', 'description', 'unit', 'quantity', 'unitRate', 'amount']
        .map(csvEscape)
        .join(','),
    ];
    for (const q of result.quotes) {
      for (const it of q.items) {
        lines.push(
          [
            q.label,
            it.categoryLabel,
            it.description,
            it.unit ?? '',
            it.quantity ?? '',
            it.unitRate ?? '',
            it.amount,
          ]
            .map(csvEscape)
            .join(','),
        );
      }
    }
    downloadCsv('varnarc-quote-comparison.csv', lines);
  }

  const q = quotes[activeQuote]!;

  const mapToItems = useMemo(() => {
    if (!mapToQuoteId) return [];
    return quotes.find((x) => x.id === mapToQuoteId)?.items ?? [];
  }, [mapToQuoteId, quotes]);

  const formNode = (
    <div className="space-y-4 print:hidden">
      <p className="text-sm leading-relaxed text-slate-600">{CONTRACTOR_QUOTE_QUALIFICATION}</p>

      <div className="flex flex-wrap gap-2">
        {quotes.map((quote, i) => (
          <button
            key={quote.id}
            type="button"
            onClick={() => setActiveQuote(i)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold',
              activeQuote === i ? 'bg-[#0b1f3a] text-white' : 'border border-slate-200 bg-white',
            )}
          >
            {quote.label}
          </button>
        ))}
        {quotes.length < 3 ? (
          <button type="button" className={cx.secondaryBtn} onClick={addQuoteSlot}>
            + Quote
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CalculatorInput
          id="cq-label"
          label="Quote label"
          value={q.label}
          onChange={(e) => updateQuote(activeQuote, { label: e.target.value })}
        />
        <CalculatorInput
          id="cq-contractor"
          label="Contractor name (optional)"
          value={q.contractorName ?? ''}
          onChange={(e) => updateQuote(activeQuote, { contractorName: e.target.value || null })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <label className={cn(cx.secondaryBtn, 'cursor-pointer')}>
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onCsvUpload(f, activeQuote);
              e.target.value = '';
            }}
          />
        </label>
        <button type="button" className={cx.secondaryBtn} onClick={downloadTemplate}>
          CSV template
        </button>
        {quotes.length > 1 ? (
          <button
            type="button"
            className="text-sm font-semibold text-red-600"
            onClick={() => removeQuoteSlot(activeQuote)}
          >
            Remove this quote
          </button>
        ) : null}
      </div>
      {csvWarning ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {csvWarning}
        </p>
      ) : null}

      <div className="space-y-3">
        {q.items.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-6"
          >
            <CalculatorInput
              id={`desc-${item.id}`}
              label="Description"
              value={item.description}
              onChange={(e) => updateItem(activeQuote, item.id, { description: e.target.value })}
              className="sm:col-span-2"
            />
            <CalculatorSelect
              id={`cat-${item.id}`}
              label="Category"
              value={item.category}
              onChange={(e) =>
                updateItem(activeQuote, item.id, {
                  category: e.target.value as QuoteCategoryKey,
                })
              }
              options={CONTRACTOR_QUOTE_CATEGORIES.map((c) => ({
                value: c.key,
                label: c.label,
              }))}
            />
            <CalculatorInput
              id={`unit-${item.id}`}
              label="Unit"
              value={item.unit ?? ''}
              onChange={(e) => updateItem(activeQuote, item.id, { unit: e.target.value })}
            />
            <CalculatorInput
              id={`qty-${item.id}`}
              label="Qty"
              type="number"
              value={item.quantity ?? ''}
              onChange={(e) =>
                updateItem(activeQuote, item.id, {
                  quantity: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
            <CalculatorInput
              id={`rate-${item.id}`}
              label="Unit rate"
              type="number"
              value={item.unitRate ?? ''}
              onChange={(e) =>
                updateItem(activeQuote, item.id, {
                  unitRate: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
            <CalculatorInput
              id={`amt-${item.id}`}
              label="Amount"
              type="number"
              value={item.amount ?? ''}
              onChange={(e) =>
                updateItem(activeQuote, item.id, {
                  amount: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="sm:col-span-2"
            />
            <button
              type="button"
              className="text-left text-xs font-semibold text-red-600 sm:col-span-4"
              onClick={() => removeItem(activeQuote, item.id)}
            >
              Remove line
            </button>
          </div>
        ))}
        <button type="button" className={cx.secondaryBtn} onClick={() => addItem(activeQuote)}>
          + Add line
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-[#0b1f3a]">Manually map unmatched items</h3>
        <p className="mt-1 text-xs text-slate-500">
          If two lines describe the same work differently, link them here. Missing items are still
          flagged as missing until mapped — never assumed included.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <CalculatorSelect
            id="map-from"
            label="From item"
            value={mapFrom ? `${mapFrom.quoteId}::${mapFrom.itemId}` : ''}
            onChange={(e) => {
              const [quoteId, itemId] = e.target.value.split('::');
              if (quoteId && itemId) setMapFrom({ quoteId, itemId });
              else setMapFrom(null);
            }}
            options={[
              { value: '', label: 'Select…' },
              ...quotes.flatMap((qq) =>
                qq.items
                  .filter((it) => it.description.trim())
                  .map((it) => ({
                    value: `${qq.id}::${it.id}`,
                    label: `${qq.label}: ${it.description}`,
                  })),
              ),
            ]}
          />
          <CalculatorSelect
            id="map-to-quote"
            label="To quote"
            value={mapToQuoteId}
            onChange={(e) => {
              setMapToQuoteId(e.target.value);
              setMapToItemId('');
            }}
            options={[
              { value: '', label: 'Select…' },
              ...quotes
                .filter((qq) => qq.id !== mapFrom?.quoteId)
                .map((qq) => ({ value: qq.id, label: qq.label })),
            ]}
          />
          <CalculatorSelect
            id="map-to-item"
            label="To item"
            value={mapToItemId}
            onChange={(e) => setMapToItemId(e.target.value)}
            options={[
              { value: '', label: 'Select…' },
              ...mapToItems
                .filter((it) => it.description.trim())
                .map((it) => ({ value: it.id, label: it.description })),
            ]}
            className="sm:col-span-2"
          />
        </div>
        <button type="button" className={cn(cx.secondaryBtn, 'mt-3')} onClick={applyManualMap}>
          Save mapping
        </button>
        {mappings.length ? (
          <p className="mt-2 text-xs text-slate-500">{mappings.length} mapping(s) active.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={cx.primaryBtn} onClick={runCompare}>
          Compare quotes
        </button>
        <button type="button" className={cx.secondaryBtn} onClick={() => printConstructionPage()}>
          Print
        </button>
        <button
          type="button"
          className={cx.secondaryBtn}
          disabled={!result}
          onClick={exportComparisonCsv}
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto]">
        <CalculatorSelect
          id="save-project"
          label="Save to project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={[
            {
              value: '',
              label: projects.length ? 'Select project…' : 'Sign in / create a project',
            },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <div className="flex items-end">
          <button
            type="button"
            className={cx.primaryBtn}
            disabled={saveLoading}
            onClick={() => void saveToProject()}
          >
            {saveLoading ? 'Saving…' : 'Save comparison'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {actionMsg ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {actionMsg}
        </p>
      ) : null}
    </div>
  );

  const resultNode = result ? (
    <div className="space-y-5 print:space-y-3" id="quote-compare-result">
      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950">
        Comparison only — no contractor good/bad labels and no invented market benchmarks.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {result.quoteTotals.map((t) => (
          <div key={t.quoteId} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{t.label}</p>
            <p className="mt-1 text-lg font-semibold text-[#0b1f3a]">{money(t.total)}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#0b1f3a]">Category totals</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">Category</th>
                {result.quotes.map((qq) => (
                  <th key={qq.id} className="py-2 pr-3">
                    {qq.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.categoryMatrix
                .filter((row) => row.amounts.some((a) => a.present || a.amount > 0))
                .map((row) => (
                  <tr key={row.key} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{row.label}</td>
                    {row.amounts.map((a) => (
                      <td key={a.quoteId} className="py-2 pr-3">
                        {a.present ? money(a.amount) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.missingCategories.length ? (
        <FlagList
          title="Missing categories"
          items={result.missingCategories.map((m) => m.message)}
        />
      ) : null}

      {result.missingItems.length ? (
        <FlagList
          title="Missing items"
          items={result.missingItems.map(
            (m) => `${m.message}: “${m.itemDescription}” (present in ${m.presentQuoteLabel})`,
          )}
        />
      ) : null}

      {result.largeDifferences.filter((d) => d.scope === 'total' || d.scope === 'category')
        .length ? (
        <FlagList
          title="Large differences"
          items={result.largeDifferences
            .filter((d) => d.scope === 'total' || d.scope === 'category')
            .map(
              (d) =>
                `${d.message}: ${d.values.map((v) => `${v.quoteLabel} ${money(v.amount)}`).join(' · ')}`,
            )}
        />
      ) : null}

      {result.unitRateDifferences.length ? (
        <FlagList
          title="Unit-rate differences (where comparable)"
          items={result.unitRateDifferences.map(
            (u) =>
              `${u.message}: ${u.rates
                .filter((r) => r.unitRate != null)
                .map((r) => `${r.quoteLabel} ${money(r.unitRate!)}`)
                .join(' · ')}`,
          )}
        />
      ) : null}

      <p className="text-xs text-slate-500">{result.qualification}</p>
    </div>
  ) : (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      Enter or upload up to 3 quotes, then compare. Missing items are flagged as missing — not
      assumed included elsewhere.
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Contractor Quote Analyzer' },
        ]}
        title="Contractor Quote Analyzer"
        description="Compare up to 3 contractor quotes by category. Manual entry or CSV upload — no PDF/OCR in this version. Never labels contractors good or bad."
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        methodology={
          <MethodologyPanel
            title="How comparison works"
            steps={[
              'Normalize line items into RCC, masonry, plaster, flooring, painting, electrical, plumbing, doors/windows, waterproofing, labour, or other.',
              'Match items by normalized description + unit, or by your manual mappings.',
              'Flag items missing from a quote explicitly (e.g. “Item missing from Quote B”).',
              'Highlight large total/category/unit-rate differences — without inventing market benchmarks.',
            ]}
          />
        }
        faqs={QUOTE_ANALYZER_FAQS}
        relatedTools={QUOTE_ANALYZER_RELATED}
      />
      <div className="site-container pb-12 print:hidden">
        <ConstructionRelatedLinks calculators={QUOTE_ANALYZER_RELATED} />
        <p className="mt-4 text-sm text-slate-600">
          Looking for market references later?{' '}
          <Link href="/construction/prices" className="font-semibold text-[#f97316]">
            Construction prices
          </Link>{' '}
          stays separate — this tool does not invent benchmarks.
        </p>
      </div>
    </>
  );
}

function FlagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <h3 className="text-sm font-semibold text-[#0b1f3a]">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
