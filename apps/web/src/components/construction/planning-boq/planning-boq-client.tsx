'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PLANNING_BOQ_DISCLAIMER,
  PLANNING_BOQ_SECTIONS,
  PLANNING_BOQ_VERSION,
  addCustomBoqItem,
  calculatePlanningBoq,
  createPlanningBoq,
  duplicateBoqItem,
  isPlanningBoqSectionId,
  parsePlannerHandoffQuery,
  patchBoqItem,
  plannerToolHref,
  removeBoqItem,
  type Boq,
  type BoqItem,
  type PlanningBoqSectionId,
} from '@varnarc/validation';
import { CalculatorShell, MethodologyPanel } from '@/components/construction/calculator';
import { ConstructionRelatedSection } from '@/components/construction/construction-related-section';
import { ConstructionReportActions, reportFromPlanningBoq } from '@/components/construction/report';
import { ConstructionScrollTable } from '@/components/construction/construction-scroll-table';
import { cn, cx } from '@/components/construction/styles';
import { csvEscape, downloadCsv } from '@/lib/construction/export';
import {
  trackBoqGenerated,
  trackCalculationAddedToProject,
  trackExcelExport,
  trackPdfExport,
} from '@/lib/construction/analytics';
import { persistPlannerHandoff, readPlannerHandoff } from '@/lib/construction/planner-handoff';
import { publishConstructionCalculationSave } from '@/lib/construction/save-calculation/publish';
import { PLANNING_BOQ_FAQS } from './content';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function sectionFromCategory(category: string): PlanningBoqSectionId {
  const n = category.toLowerCase();
  if (
    n.includes('rcc') ||
    n.includes('steel') ||
    n.includes('pcc') ||
    n.includes('reinforc') ||
    n.includes('formwork')
  ) {
    return 'rcc';
  }
  if (n.includes('mason') || n.includes('plaster') || n.includes('brick')) return 'masonry';
  if (n.includes('floor') || n.includes('tile')) return 'flooring';
  if (n.includes('elec')) return 'electrical';
  if (n.includes('plumb') || n.includes('sanitar')) return 'plumbing';
  if (n.includes('paint')) return 'painting';
  if (n.includes('door') || n.includes('window') || n.includes('carpent')) return 'doors';
  if (n.includes('external')) return 'external';
  return 'civil';
}

export function PlanningBoqClient() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const boqIdParam = searchParams.get('boqId');
  const [boq, setBoq] = useState<Boq>(() =>
    createPlanningBoq({
      handoff: parsePlannerHandoffQuery({
        location: searchParams.get('location') ?? undefined,
        builtUpArea: searchParams.get('builtUpArea') ?? undefined,
        area: searchParams.get('area') ?? undefined,
        areaUnit: searchParams.get('areaUnit') ?? undefined,
        floors: searchParams.get('floors') ?? undefined,
        quality: searchParams.get('quality') ?? undefined,
        structureType: searchParams.get('structureType') ?? undefined,
        foundationType: searchParams.get('foundationType') ?? undefined,
      }),
    }),
  );
  const [activeSection, setActiveSection] = useState<PlanningBoqSectionId | 'all'>('all');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [savedBoqId, setSavedBoqId] = useState<string | null>(boqIdParam);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const hydrated = useRef(false);

  const totals = useMemo(() => calculatePlanningBoq(boq), [boq]);
  const visibleItems = useMemo(
    () =>
      activeSection === 'all'
        ? totals.items
        : totals.items.filter((i) => i.sectionId === activeSection),
    [activeSection, totals.items],
  );

  useEffect(() => {
    persistPlannerHandoff({
      location: boq.location,
      builtUpArea: boq.builtUpArea,
      areaUnit: boq.areaUnit,
      floors: boq.floors,
      quality: boq.quality,
    });
    publishConstructionCalculationSave({
      calculatorSlug: 'boq',
      methodologyVersionLabel: PLANNING_BOQ_VERSION,
      inputs: {
        title: boq.title,
        builtUpArea: boq.builtUpArea,
        floors: boq.floors,
        quality: boq.quality,
        location: boq.location,
      },
      outputs: totals,
      assumptions: [PLANNING_BOQ_DISCLAIMER],
      sourcePath: '/construction/boq',
    });
  }, [boq, totals]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as Array<{ id: string; name?: string }>;
        if (!cancelled && Array.isArray(list)) {
          setProjects(list.map((p) => ({ id: p.id, name: p.name || 'Untitled project' })));
        }
      } catch {
        /* guests */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated.current || boqIdParam) return;
    hydrated.current = true;
    const url = parsePlannerHandoffQuery({
      location: searchParams.get('location') ?? undefined,
      builtUpArea: searchParams.get('builtUpArea') ?? undefined,
      floors: searchParams.get('floors') ?? undefined,
      quality: searchParams.get('quality') ?? undefined,
    });
    if (url.builtUpArea) return;
    const stored = readPlannerHandoff();
    if (stored.builtUpArea) {
      setBoq(createPlanningBoq({ handoff: stored, title: boq.title }));
    }
  }, [boq.title, boqIdParam, searchParams]);

  useEffect(() => {
    if (!boqIdParam) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/construction/boqs/${boqIdParam}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const saved = json?.data ?? json;
        if (cancelled || !saved?.id) return;
        setSavedBoqId(saved.id);
        setProjectId(saved.projectId ?? projectIdParam);
        const items = (saved.items ?? []) as Array<{
          id: string;
          name: string;
          description?: string | null;
          unit: string;
          quantity: number | string;
          unitRate: number | string;
          metadata?: {
            sectionId?: string;
            category?: string;
            source?: BoqItem['source'];
            notes?: string;
            isIncluded?: boolean;
            isCustom?: boolean;
            code?: string;
          } | null;
        }>;
        const notes = String(saved.notes ?? '');
        const contMatch = notes.match(/contingencyPercent=([\d.]+)/);
        const taxMatch = notes.match(/taxPercent=([\d.]+)/);
        const displayNotes = notes
          .split('\n')
          .filter(
            (line) =>
              !line.startsWith('contingencyPercent=') &&
              !line.startsWith('taxPercent=') &&
              !line.startsWith('source=') &&
              !line.startsWith('qualification='),
          )
          .join('\n')
          .trim();
        setBoq({
          id: saved.id,
          title: saved.name || 'Planning BOQ',
          currency: 'INR',
          notes: displayNotes || PLANNING_BOQ_DISCLAIMER,
          contingencyPercent: Number(saved.contingencyPercent ?? contMatch?.[1]) || 5,
          includeTax: Boolean(saved.taxPercent ?? taxMatch),
          taxPercent:
            saved.taxPercent != null
              ? Number(saved.taxPercent)
              : taxMatch
                ? Number(taxMatch[1])
                : null,
          items: items.map((item, i) => {
            const rawSection = String(item.metadata?.sectionId ?? '');
            const sectionId: PlanningBoqSectionId = isPlanningBoqSectionId(rawSection)
              ? rawSection
              : sectionFromCategory(item.metadata?.category ?? '');
            const rawSource = String(item.metadata?.source ?? 'saved');
            const source: BoqItem['source'] =
              rawSource === 'template' ||
              rawSource === 'material_quantity' ||
              rawSource === 'custom' ||
              rawSource === 'saved'
                ? rawSource
                : 'saved';
            return {
              id: item.id || `saved-${i}`,
              sectionId,
              code: item.metadata?.code,
              description: item.name,
              unit: item.unit,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.unitRate) || 0,
              isIncluded: item.metadata?.isIncluded !== false,
              source,
              notes: item.metadata?.notes || item.description || '',
              isCustom: Boolean(item.metadata?.isCustom),
            };
          }),
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boqIdParam, projectIdParam]);

  const updateItem = useCallback((id: string, patch: Partial<BoqItem>) => {
    setBoq((prev) => patchBoqItem(prev, id, patch));
  }, []);

  function exportSpreadsheet() {
    const lines = [
      '#,Section,Item,Unit,Quantity,Rate,Amount,Status,Notes',
      ...totals.items.map((row, i) =>
        [
          i + 1,
          csvEscape(PLANNING_BOQ_SECTIONS.find((s) => s.id === row.sectionId)?.label),
          csvEscape(row.description),
          csvEscape(row.unit),
          row.quantity,
          row.rate,
          row.amount,
          row.status,
          csvEscape(row.notes),
        ].join(','),
      ),
      '',
      'Section,Amount,Included_count',
      ...totals.sectionSubtotals.map((s) => `${csvEscape(s.label)},${s.amount},${s.includedCount}`),
      `Subtotal,,,${totals.subtotal}`,
      `Contingency_${totals.contingencyPercent}%,,,${totals.contingencyAmount}`,
      totals.taxAmount != null ? `Tax_${totals.taxPercent}%,,,${totals.taxAmount}` : '',
      `Grand_total,,,${totals.grandTotal}`,
      `NOTE,${csvEscape(PLANNING_BOQ_DISCLAIMER)}`,
    ].filter(Boolean);
    downloadCsv('varnarc-planning-boq.csv', lines);
    trackExcelExport();
    trackBoqGenerated({
      logged_in: Boolean(projectId),
      item_count_bucket: totals.items.length <= 10 ? 'few' : 'many',
    });
    setActionMsg('Spreadsheet downloaded.');
  }

  async function downloadPdf() {
    if (!savedBoqId) {
      setActionMsg('Save the BOQ first to download a PDF from the project copy.');
      return;
    }
    try {
      const res = await fetch(`/api/construction/boqs/${savedBoqId}/report-pdf`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('pdf');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'varnarc-planning-boq.pdf';
      a.click();
      URL.revokeObjectURL(url);
      trackPdfExport();
    } catch {
      setActionMsg('PDF download failed. You can still print the report.');
    }
  }

  async function saveToProject() {
    if (!projectId) {
      setActionMsg('Choose a project to save this BOQ.');
      return;
    }
    const saveItems = totals.items.filter((item) => item.isIncluded && item.quantity > 0);
    if (!saveItems.length) {
      setActionMsg(
        'Enter at least one quantity before saving. Empty template rows are not stored.',
      );
      return;
    }
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/construction/projects/${projectId}/boqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: boq.title.slice(0, 150),
          currency: 'INR',
          status: 'DRAFT',
          contingencyPercent: totals.contingencyPercent,
          taxPercent: totals.taxPercent,
          notes: boq.notes || PLANNING_BOQ_DISCLAIMER,
          items: saveItems.map((item, index) => ({
            name: item.description,
            description: item.notes ? item.notes.slice(0, 2000) : null,
            unit: item.unit === 'litre' ? 'liter' : item.unit,
            quantity: item.quantity,
            unitRate: item.rate,
            sortOrder: index,
            metadata: {
              sectionId: item.sectionId,
              source: item.source,
              notes: item.notes,
              isIncluded: item.isIncluded,
              isCustom: item.isCustom,
              code: item.code,
            },
          })),
        }),
      });
      if (res.status === 401) {
        setActionMsg('Sign in to save this BOQ to a project.');
        return;
      }
      if (!res.ok) {
        setActionMsg('Could not save BOQ.');
        return;
      }
      const json = await res.json();
      const saved = json?.data ?? json;
      if (saved?.id) setSavedBoqId(saved.id);
      trackCalculationAddedToProject({ calculator_type: 'boq_generator' });
      setActionMsg('BOQ saved to project.');
    } catch {
      setActionMsg('Could not save BOQ.');
    } finally {
      setSaveLoading(false);
    }
  }

  const costHref = plannerToolHref('/construction/cost-calculator', {
    location: boq.location,
    builtUpArea: boq.builtUpArea,
    areaUnit: boq.areaUnit,
    floors: boq.floors,
    quality: boq.quality,
  });
  const qtyHref = plannerToolHref('/construction/material-calculator', {
    location: boq.location,
    builtUpArea: boq.builtUpArea,
    areaUnit: boq.areaUnit,
    floors: boq.floors,
    quality: boq.quality,
  });

  const formNode = (
    <div className="space-y-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {PLANNING_BOQ_DISCLAIMER}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className={cx.label}>BOQ title</span>
          <input
            className={cx.input}
            value={boq.title}
            onChange={(e) => setBoq({ ...boq, title: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className={cx.label}>Save to project</span>
          <select
            className={cx.input}
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">No project selected</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className={cx.label}>Contingency %</span>
          <input
            className={cx.input}
            type="number"
            min={0}
            max={50}
            value={boq.contingencyPercent}
            onChange={(e) => setBoq({ ...boq, contingencyPercent: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={boq.includeTax}
            onChange={(e) => setBoq({ ...boq, includeTax: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-[#f97316]"
          />
          Apply tax
        </label>
        {boq.includeTax ? (
          <label className="block text-sm">
            <span className={cx.label}>Tax %</span>
            <input
              className={cx.input}
              type="number"
              min={0}
              max={50}
              value={boq.taxPercent ?? ''}
              onChange={(e) =>
                setBoq({ ...boq, taxPercent: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
        ) : null}
        <label className="block text-sm sm:col-span-2">
          <span className={cx.label}>Notes</span>
          <textarea
            className={cn(cx.input, 'min-h-20 py-2')}
            value={boq.notes}
            onChange={(e) => setBoq({ ...boq, notes: e.target.value })}
          />
        </label>
      </div>
    </div>
  );

  const workspace = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={activeSection === 'all' ? cx.accentBtn : cx.secondaryBtn}
          onClick={() => setActiveSection('all')}
        >
          All
        </button>
        {PLANNING_BOQ_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? cx.accentBtn : cx.secondaryBtn}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className={cn(cx.card, 'p-0')}>
        <ConstructionScrollTable
          minWidthClass="min-w-[960px]"
          caption="Swipe sideways to edit all BOQ columns."
          className="p-0"
        >
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Item description</th>
                <th className="px-3 py-2.5">Unit</th>
                <th className="px-3 py-2.5">Quantity</th>
                <th className="px-3 py-2.5">Rate</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, index) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      className={cx.input}
                      aria-label="Item description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    />
                    {item.notes ? (
                      <p className="mt-1 text-[11px] text-slate-500">{item.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cn(cx.input, 'w-24')}
                      aria-label="Unit"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cn(cx.input, 'w-28')}
                      type="number"
                      min={0}
                      aria-label="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, { quantity: Number(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cn(cx.input, 'w-28')}
                      type="number"
                      min={0}
                      aria-label="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold tabular-nums">{formatInr(item.amount)}</td>
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={item.isIncluded}
                        onChange={(e) => updateItem(item.id, { isIncluded: e.target.checked })}
                      />
                      {item.isIncluded ? 'Included' : 'Excluded'}
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className={cx.link}
                        onClick={() => setBoq((prev) => duplicateBoqItem(prev, item.id))}
                      >
                        Duplicate
                      </button>
                      {item.isCustom ? (
                        <button
                          type="button"
                          className={cx.link}
                          onClick={() => setBoq((prev) => removeBoqItem(prev, item.id))}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConstructionScrollTable>
      </div>
      <button
        type="button"
        className={cx.secondaryBtn}
        onClick={() =>
          setBoq((prev) =>
            addCustomBoqItem(prev, activeSection === 'all' ? 'civil' : activeSection),
          )
        }
      >
        Add custom item
      </button>
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'BOQ' },
        ]}
        title="Construction BOQ generator"
        description="Project → material quantities → planning bill of quantities. Edit quantities and rates; amounts update automatically."
        lastUpdated="September 2026"
        relatedTools={[
          { label: 'Construction cost calculator', href: costHref },
          { label: 'Material quantity calculator', href: qtyHref },
        ]}
        form={formNode}
        workspace={workspace}
        result={
          <aside className={cn(cx.card, 'space-y-3 p-4')}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Grand total
            </p>
            <p className="text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
              {formatInr(totals.grandTotal)}
            </p>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatInr(totals.subtotal)}</span>
              </li>
              <li className="flex justify-between">
                <span>Contingency ({totals.contingencyPercent}%)</span>
                <span className="tabular-nums">{formatInr(totals.contingencyAmount)}</span>
              </li>
              {totals.taxAmount != null ? (
                <li className="flex justify-between">
                  <span>Tax ({totals.taxPercent}%)</span>
                  <span className="tabular-nums">{formatInr(totals.taxAmount)}</span>
                </li>
              ) : (
                <li className="text-xs text-slate-500">Tax not applied</li>
              )}
            </ul>
            <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              {totals.sectionSubtotals
                .filter((s) => s.itemCount > 0)
                .map((s) => (
                  <div key={s.sectionId} className="flex justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="tabular-nums">{formatInr(s.amount)}</span>
                  </div>
                ))}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className={cx.primaryBtn}
                disabled={saveLoading}
                onClick={() => void saveToProject()}
              >
                {saveLoading ? 'Saving…' : 'Save BOQ'}
              </button>
              <ConstructionReportActions
                data={reportFromPlanningBoq({ title: boq.title, totals })}
                label="Print"
              />
              <button type="button" className={cx.secondaryBtn} onClick={() => void downloadPdf()}>
                Download PDF
              </button>
              <button type="button" className={cx.secondaryBtn} onClick={exportSpreadsheet}>
                Export Excel
              </button>
              <Link href="/construction/suppliers" className={cx.secondaryBtn}>
                Get supplier quotes
              </Link>
            </div>
            {actionMsg ? <p className="text-xs text-slate-600">{actionMsg}</p> : null}
          </aside>
        }
        methodology={
          <MethodologyPanel
            title="How this BOQ is calculated"
            formula="amount = included ? quantity × rate : 0 · grand total = subtotal + contingency (+ tax only if enabled)"
            lastUpdated={PLANNING_BOQ_VERSION}
            steps={[
              'Start from a planning template of typical work items.',
              'Fill quantities from the Material Quantity Calculator when you arrive with project values.',
              'Leave civil/RCC take-offs empty unless you enter them — this tool does not invent structural quantities.',
              'Exclude, duplicate or add custom items as needed.',
            ]}
          />
        }
        faqs={PLANNING_BOQ_FAQS}
        stickyCta={{
          primary: { label: 'Save BOQ', onClick: () => void saveToProject() },
          secondary: { label: 'Get quotes', href: '/construction/suppliers' },
        }}
      />
      <div className="site-container pb-12 print:hidden">
        <ConstructionRelatedSection entityId="calc:boq" surface="boq" />
      </div>
    </>
  );
}
