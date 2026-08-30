'use client';

import { printConstructionPage } from '@/lib/construction/export';
import { cx } from '@/components/construction/styles';
import { PrintableConstructionReport } from './printable-construction-report';
import type { ConstructionCalculationReportData } from './types';

/**
 * Print button + off-screen printable report document.
 * Browser print / “Save as PDF” uses the report layout; site chrome is hidden via print CSS.
 */
export function ConstructionReportActions({
  data,
  label = 'Print report',
  className,
}: {
  data: ConstructionCalculationReportData;
  label?: string;
  className?: string;
}) {
  return (
    <>
      <button
        type="button"
        className={className ?? cx.secondaryBtn}
        onClick={() => printConstructionPage()}
      >
        {label}
      </button>
      <PrintableConstructionReport data={data} mode="print-only" />
    </>
  );
}
