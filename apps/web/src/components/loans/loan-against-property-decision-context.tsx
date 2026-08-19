'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EmiResult } from '@/lib/emi';
import {
  LAP_DEFAULT_EXISTING_EMIS,
  LAP_DEFAULT_ILLUSTRATIVE_LTV,
  LAP_DEFAULT_MONTHLY_INCOME,
  LAP_DEFAULT_PROPERTY_VALUE,
  LAP_DEFAULT_REQUIRED,
  LAP_DEFAULT_TENURE_YEARS,
  LAP_ILLUSTRATIVE_RATE,
  LAP_MAX_PROPERTY_VALUE,
  LAP_MAX_REQUIRED_LOAN,
  clampNonNegative,
  clampPercent,
  estimateLapBorrowingCapacity,
  estimateLapEmi,
  estimateLapIncomeCapacity,
  estimateLapObligationRatio,
  lapLtvPercent,
  type LapApplicantType,
  type LapBorrowingCapacity,
  type LapIncomeCapacity,
  type LapObligationResult,
  type LapOwnership,
  type LapPropertyType,
} from '@/lib/loan-against-property-page';

type LapDecisionContextValue = {
  propertyValue: number;
  requiredLoan: number;
  illustrativeLtvPercent: number;
  tenureYears: number;
  ratePercent: number;
  propertyType: LapPropertyType;
  applicantType: LapApplicantType;
  ownership: LapOwnership;
  monthlyIncome: number;
  existingEmis: number;
  otherObligations: number;
  capacity: LapBorrowingCapacity | null;
  ltv: number | null;
  emi: EmiResult | null;
  incomeCapacity: LapIncomeCapacity | null;
  obligation: LapObligationResult | null;
  setPropertyValue: (n: number) => void;
  setRequiredLoan: (n: number) => void;
  setIllustrativeLtvPercent: (n: number) => void;
  setTenureYears: (n: number) => void;
  setRatePercent: (n: number) => void;
  setPropertyType: (t: LapPropertyType) => void;
  setApplicantType: (t: LapApplicantType) => void;
  setOwnership: (o: LapOwnership) => void;
  setMonthlyIncome: (n: number) => void;
  setExistingEmis: (n: number) => void;
  setOtherObligations: (n: number) => void;
};

const LapDecisionContext = createContext<LapDecisionContextValue | null>(null);

export function LapDecisionProvider({
  children,
  initialRate = LAP_ILLUSTRATIVE_RATE,
  initialAmount,
  initialTenureYears,
}: {
  children: ReactNode;
  initialRate?: number;
  initialAmount?: number;
  initialTenureYears?: number;
}) {
  const [propertyValue, setPropertyValueState] = useState(LAP_DEFAULT_PROPERTY_VALUE);
  const [requiredLoan, setRequiredLoanState] = useState(() => {
    const seed = initialAmount ?? LAP_DEFAULT_REQUIRED;
    return Math.min(LAP_MAX_REQUIRED_LOAN, clampNonNegative(seed));
  });
  const [illustrativeLtvPercent, setIllustrativeLtvPercentState] = useState(
    LAP_DEFAULT_ILLUSTRATIVE_LTV,
  );
  const [tenureYears, setTenureYearsState] = useState(() => {
    const y = Math.floor(initialTenureYears ?? LAP_DEFAULT_TENURE_YEARS);
    return Math.max(1, Math.min(25, Number.isFinite(y) ? y : LAP_DEFAULT_TENURE_YEARS));
  });
  const [ratePercent, setRatePercentState] = useState(initialRate);
  const [propertyType, setPropertyType] = useState<LapPropertyType>('residential');
  const [applicantType, setApplicantType] = useState<LapApplicantType>('salaried');
  const [ownership, setOwnership] = useState<LapOwnership>('sole');
  const [monthlyIncome, setMonthlyIncomeState] = useState(LAP_DEFAULT_MONTHLY_INCOME);
  const [existingEmis, setExistingEmisState] = useState(LAP_DEFAULT_EXISTING_EMIS);
  const [otherObligations, setOtherObligationsState] = useState(0);

  const setPropertyValue = useCallback(
    (n: number) => setPropertyValueState(Math.min(LAP_MAX_PROPERTY_VALUE, clampNonNegative(n))),
    [],
  );
  const setRequiredLoan = useCallback(
    (n: number) => setRequiredLoanState(Math.min(LAP_MAX_REQUIRED_LOAN, clampNonNegative(n))),
    [],
  );
  const setIllustrativeLtvPercent = useCallback(
    (n: number) => setIllustrativeLtvPercentState(clampPercent(n)),
    [],
  );
  const setTenureYears = useCallback((n: number) => {
    const y = Math.floor(n);
    setTenureYearsState(
      Math.max(1, Math.min(25, Number.isFinite(y) ? y : LAP_DEFAULT_TENURE_YEARS)),
    );
  }, []);
  const setRatePercent = useCallback((n: number) => {
    if (!Number.isFinite(n) || n < 0) {
      setRatePercentState(0);
      return;
    }
    setRatePercentState(Math.min(50, n));
  }, []);
  const setMonthlyIncome = useCallback(
    (n: number) => setMonthlyIncomeState(Math.min(1_00_00_000, clampNonNegative(n))),
    [],
  );
  const setExistingEmis = useCallback(
    (n: number) => setExistingEmisState(Math.min(1_00_00_000, clampNonNegative(n))),
    [],
  );
  const setOtherObligations = useCallback(
    (n: number) => setOtherObligationsState(Math.min(1_00_00_000, clampNonNegative(n))),
    [],
  );

  const capacity = useMemo(
    () =>
      estimateLapBorrowingCapacity({
        propertyValue,
        illustrativeLtvPercent,
        requestedLoan: requiredLoan,
      }),
    [propertyValue, illustrativeLtvPercent, requiredLoan],
  );

  const ltv = useMemo(
    () => lapLtvPercent(propertyValue, requiredLoan),
    [propertyValue, requiredLoan],
  );

  const tenureMonths = tenureYears * 12;

  const emi = useMemo(
    () =>
      estimateLapEmi({
        loanAmount: requiredLoan,
        annualRatePercent: ratePercent,
        tenureMonths,
      }),
    [requiredLoan, ratePercent, tenureMonths],
  );

  const incomeCapacity = useMemo(
    () =>
      estimateLapIncomeCapacity({
        monthlyIncome,
        existingEmis,
        otherObligations,
        annualRatePercent: ratePercent,
        tenureMonths,
      }),
    [monthlyIncome, existingEmis, otherObligations, ratePercent, tenureMonths],
  );

  const obligation = useMemo(() => {
    if (!emi) return null;
    return estimateLapObligationRatio({
      monthlyIncome,
      existingEmis,
      otherObligations,
      proposedEmi: emi.monthlyEmi,
    });
  }, [emi, monthlyIncome, existingEmis, otherObligations]);

  const value: LapDecisionContextValue = {
    propertyValue,
    requiredLoan,
    illustrativeLtvPercent,
    tenureYears,
    ratePercent,
    propertyType,
    applicantType,
    ownership,
    monthlyIncome,
    existingEmis,
    otherObligations,
    capacity,
    ltv,
    emi,
    incomeCapacity,
    obligation,
    setPropertyValue,
    setRequiredLoan,
    setIllustrativeLtvPercent,
    setTenureYears,
    setRatePercent,
    setPropertyType,
    setApplicantType,
    setOwnership,
    setMonthlyIncome,
    setExistingEmis,
    setOtherObligations,
  };

  return <LapDecisionContext.Provider value={value}>{children}</LapDecisionContext.Provider>;
}

export function useLapDecision(): LapDecisionContextValue {
  const ctx = useContext(LapDecisionContext);
  if (!ctx) {
    throw new Error('useLapDecision must be used within LapDecisionProvider');
  }
  return ctx;
}
