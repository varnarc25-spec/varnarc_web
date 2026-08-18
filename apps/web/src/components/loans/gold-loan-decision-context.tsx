'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EmiResult } from '@/lib/emi';
import {
  GOLD_LOAN_DEFAULT_ILLUSTRATIVE_LTV,
  GOLD_LOAN_DEFAULT_KARAT,
  GOLD_LOAN_DEFAULT_REFERENCE_RATE_PER_G,
  GOLD_LOAN_DEFAULT_REQUIRED,
  GOLD_LOAN_DEFAULT_TENURE_MONTHS,
  GOLD_LOAN_DEFAULT_WEIGHT_G,
  GOLD_LOAN_ILLUSTRATIVE_RATE,
  clampNonNegative,
  clampPercent,
  estimateBorrowingCapacity,
  estimateGoldLoanEmi,
  estimateGoldRequired,
  estimateGoldValue,
  type GoldBorrowingCapacity,
  type GoldPurityPreset,
  type GoldRepaymentMode,
  type GoldValuationResult,
} from '@/lib/gold-loan-page';

type GoldLoanDecisionContextValue = {
  requiredLoan: number;
  weightG: number;
  karat: number;
  purityPreset: GoldPurityPreset;
  referenceRatePerG: number;
  illustrativeLtvPercent: number;
  tenureMonths: number;
  ratePercent: number;
  repaymentMode: GoldRepaymentMode;
  eligibleWeightFraction: number;
  valuation: GoldValuationResult | null;
  capacity: GoldBorrowingCapacity | null;
  goldRequiredG: number | null;
  emi: EmiResult | null;
  setRequiredLoan: (n: number) => void;
  setWeightG: (n: number) => void;
  setKarat: (n: number) => void;
  setPurityPreset: (p: GoldPurityPreset) => void;
  setReferenceRatePerG: (n: number) => void;
  setIllustrativeLtvPercent: (n: number) => void;
  setTenureMonths: (n: number) => void;
  setRatePercent: (n: number) => void;
  setRepaymentMode: (m: GoldRepaymentMode) => void;
  setEligibleWeightFraction: (n: number) => void;
};

const GoldLoanDecisionContext = createContext<GoldLoanDecisionContextValue | null>(null);

export function GoldLoanDecisionProvider({
  children,
  initialRate = GOLD_LOAN_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialRate?: number;
}) {
  const [requiredLoan, setRequiredLoanState] = useState(GOLD_LOAN_DEFAULT_REQUIRED);
  const [weightG, setWeightGState] = useState(GOLD_LOAN_DEFAULT_WEIGHT_G);
  const [karat, setKaratState] = useState(GOLD_LOAN_DEFAULT_KARAT);
  const [purityPreset, setPurityPresetState] = useState<GoldPurityPreset>(22);
  const [referenceRatePerG, setReferenceRatePerGState] = useState(
    GOLD_LOAN_DEFAULT_REFERENCE_RATE_PER_G,
  );
  const [illustrativeLtvPercent, setIllustrativeLtvPercentState] = useState(
    GOLD_LOAN_DEFAULT_ILLUSTRATIVE_LTV,
  );
  const [tenureMonths, setTenureMonthsState] = useState(GOLD_LOAN_DEFAULT_TENURE_MONTHS);
  const [ratePercent, setRatePercentState] = useState(initialRate);
  const [repaymentMode, setRepaymentMode] = useState<GoldRepaymentMode>('emi');
  const [eligibleWeightFraction, setEligibleWeightFractionState] = useState(1);

  const setRequiredLoan = useCallback(
    (n: number) => setRequiredLoanState(Math.min(10_00_00_000, clampNonNegative(n))),
    [],
  );
  const setWeightG = useCallback(
    (n: number) => setWeightGState(Math.min(50_000, clampNonNegative(n))),
    [],
  );
  const setKarat = useCallback((n: number) => {
    const k = Math.min(24, Math.max(1, Number.isFinite(n) ? n : GOLD_LOAN_DEFAULT_KARAT));
    setKaratState(k);
  }, []);
  const setPurityPreset = useCallback((p: GoldPurityPreset) => {
    setPurityPresetState(p);
    if (p !== 'custom') setKaratState(p);
  }, []);
  const setReferenceRatePerG = useCallback(
    (n: number) => setReferenceRatePerGState(Math.min(1_00_000, clampNonNegative(n))),
    [],
  );
  const setIllustrativeLtvPercent = useCallback(
    (n: number) => setIllustrativeLtvPercentState(clampPercent(n)),
    [],
  );
  const setTenureMonths = useCallback((n: number) => {
    const m = Math.floor(n);
    setTenureMonthsState(Math.max(1, Math.min(84, Number.isFinite(m) ? m : 12)));
  }, []);
  const setRatePercent = useCallback((n: number) => {
    if (!Number.isFinite(n) || n < 0) {
      setRatePercentState(0);
      return;
    }
    setRatePercentState(Math.min(50, n));
  }, []);
  const setEligibleWeightFraction = useCallback(
    (n: number) => setEligibleWeightFractionState(clampPercent(n, 1)),
    [],
  );

  const valuation = useMemo(
    () =>
      estimateGoldValue({
        grossWeightG: weightG,
        karat,
        referenceRatePerG,
        eligibleWeightFraction,
      }),
    [weightG, karat, referenceRatePerG, eligibleWeightFraction],
  );

  const capacity = useMemo(() => {
    if (!valuation) return null;
    return estimateBorrowingCapacity({
      estimatedGoldValue: valuation.estimatedGoldValue,
      illustrativeLtvPercent,
      requestedLoan: requiredLoan,
    });
  }, [valuation, illustrativeLtvPercent, requiredLoan]);

  const goldRequiredG = useMemo(
    () =>
      estimateGoldRequired({
        requiredLoan,
        karat,
        referenceRatePerG,
        illustrativeLtvPercent,
      }),
    [requiredLoan, karat, referenceRatePerG, illustrativeLtvPercent],
  );

  const emi = useMemo(
    () =>
      estimateGoldLoanEmi({
        loanAmount: requiredLoan,
        annualRatePercent: ratePercent,
        tenureMonths,
      }),
    [requiredLoan, ratePercent, tenureMonths],
  );

  const value: GoldLoanDecisionContextValue = {
    requiredLoan,
    weightG,
    karat,
    purityPreset,
    referenceRatePerG,
    illustrativeLtvPercent,
    tenureMonths,
    ratePercent,
    repaymentMode,
    eligibleWeightFraction,
    valuation,
    capacity,
    goldRequiredG,
    emi,
    setRequiredLoan,
    setWeightG,
    setKarat,
    setPurityPreset,
    setReferenceRatePerG,
    setIllustrativeLtvPercent,
    setTenureMonths,
    setRatePercent,
    setRepaymentMode,
    setEligibleWeightFraction,
  };

  return (
    <GoldLoanDecisionContext.Provider value={value}>{children}</GoldLoanDecisionContext.Provider>
  );
}

export function useGoldLoanDecision(): GoldLoanDecisionContextValue {
  const ctx = useContext(GoldLoanDecisionContext);
  if (!ctx) {
    throw new Error('useGoldLoanDecision must be used within GoldLoanDecisionProvider');
  }
  return ctx;
}
