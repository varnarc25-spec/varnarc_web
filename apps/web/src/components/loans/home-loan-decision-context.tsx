'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { calculateEmi, type EmiResult } from '@/lib/emi';
import {
  HOME_LOAN_DEFAULT_DOWN_PAYMENT,
  HOME_LOAN_DEFAULT_PROPERTY,
  HOME_LOAN_DEFAULT_TENURE_YEARS,
  HOME_LOAN_ILLUSTRATIVE_RATE,
  clampHomeLoanDownPayment,
  homeLoanLtvPercent,
  homeLoanRequirement,
} from '@/lib/home-loan-page';

export type HomeLoanApplicantType = '' | 'salaried' | 'self-employed' | 'joint';

type HomeLoanDecisionContextValue = {
  propertyValue: number;
  downPayment: number;
  downPaymentPercent: number;
  loanRequirement: number;
  ltvPercent: number | null;
  tenureYears: number;
  tenureMonths: number;
  ratePercent: number;
  applicantType: HomeLoanApplicantType;
  emiResult: EmiResult | null;
  setPropertyValue: (n: number) => void;
  setDownPayment: (n: number) => void;
  setDownPaymentFromPercent: (percent: number) => void;
  setTenureYears: (n: number) => void;
  setRatePercent: (n: number) => void;
  setApplicantType: (v: HomeLoanApplicantType) => void;
};

const HomeLoanDecisionContext = createContext<HomeLoanDecisionContextValue | null>(null);

export function HomeLoanDecisionProvider({
  children,
  initialPropertyValue = HOME_LOAN_DEFAULT_PROPERTY,
  initialDownPayment = HOME_LOAN_DEFAULT_DOWN_PAYMENT,
  initialTenureYears = HOME_LOAN_DEFAULT_TENURE_YEARS,
  initialRate = HOME_LOAN_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialPropertyValue?: number;
  initialDownPayment?: number;
  initialTenureYears?: number;
  initialRate?: number;
}) {
  const [propertyValue, setPropertyValueState] = useState(initialPropertyValue);
  const [downPayment, setDownPaymentState] = useState(
    clampHomeLoanDownPayment(initialPropertyValue, initialDownPayment),
  );
  const [tenureYears, setTenureYears] = useState(initialTenureYears);
  const [ratePercent, setRatePercent] = useState(initialRate);
  const [applicantType, setApplicantType] = useState<HomeLoanApplicantType>('');

  const setPropertyValue = useCallback((n: number) => {
    if (!Number.isFinite(n) || n <= 0) return;
    setPropertyValueState((prevProperty) => {
      setDownPaymentState((prevDp) => {
        const pct =
          prevProperty > 0 ? Math.min(100, Math.max(0, (prevDp / prevProperty) * 100)) : 20;
        return clampHomeLoanDownPayment(n, Math.round((n * pct) / 100));
      });
      return n;
    });
  }, []);

  const setDownPayment = useCallback(
    (n: number) => {
      setDownPaymentState(clampHomeLoanDownPayment(propertyValue, n));
    },
    [propertyValue],
  );

  const setDownPaymentFromPercent = useCallback(
    (percent: number) => {
      if (!Number.isFinite(percent) || percent < 0) return;
      const amount = Math.round((propertyValue * Math.min(100, percent)) / 100);
      setDownPaymentState(clampHomeLoanDownPayment(propertyValue, amount));
    },
    [propertyValue],
  );

  const loanRequirement = homeLoanRequirement(propertyValue, downPayment);
  const downPaymentPercent =
    propertyValue > 0
      ? (clampHomeLoanDownPayment(propertyValue, downPayment) / propertyValue) * 100
      : 0;
  const ltvPercent = homeLoanLtvPercent(propertyValue, loanRequirement);
  const tenureMonths = tenureYears * 12;

  const emiResult = useMemo(
    () =>
      calculateEmi({
        principal: loanRequirement,
        annualRatePercent: ratePercent,
        tenureMonths,
      }),
    [loanRequirement, ratePercent, tenureMonths],
  );

  const value = useMemo<HomeLoanDecisionContextValue>(
    () => ({
      propertyValue,
      downPayment: clampHomeLoanDownPayment(propertyValue, downPayment),
      downPaymentPercent,
      loanRequirement,
      ltvPercent,
      tenureYears,
      tenureMonths,
      ratePercent,
      applicantType,
      emiResult,
      setPropertyValue,
      setDownPayment,
      setDownPaymentFromPercent,
      setTenureYears,
      setRatePercent,
      setApplicantType,
    }),
    [
      propertyValue,
      downPayment,
      downPaymentPercent,
      loanRequirement,
      ltvPercent,
      tenureYears,
      tenureMonths,
      ratePercent,
      applicantType,
      emiResult,
      setPropertyValue,
      setDownPayment,
      setDownPaymentFromPercent,
    ],
  );

  return (
    <HomeLoanDecisionContext.Provider value={value}>{children}</HomeLoanDecisionContext.Provider>
  );
}

export function useHomeLoanDecision(): HomeLoanDecisionContextValue {
  const ctx = useContext(HomeLoanDecisionContext);
  if (!ctx) {
    throw new Error('useHomeLoanDecision must be used within HomeLoanDecisionProvider');
  }
  return ctx;
}

export { HOME_LOAN_ILLUSTRATIVE_RATE };
