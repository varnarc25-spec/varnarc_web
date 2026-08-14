'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { calculateEmi, type EmiResult } from '@/lib/emi';

/** Clearly labeled illustrative default — not a market or lender offer. */
export const PERSONAL_LOAN_ILLUSTRATIVE_RATE = 11;

export type PersonalLoanDecisionState = {
  amount: number;
  tenureYears: number;
  ratePercent: number;
  employmentType: '' | 'salaried' | 'self-employed' | 'other';
  setAmount: (amount: number) => void;
  setTenureYears: (years: number) => void;
  setRatePercent: (rate: number) => void;
  setEmploymentType: (value: '' | 'salaried' | 'self-employed' | 'other') => void;
  emiResult: EmiResult | null;
  tenureMonths: number;
};

const PersonalLoanDecisionContext = createContext<PersonalLoanDecisionState | null>(null);

export function PersonalLoanDecisionProvider({
  children,
  initialAmount = 5_00_000,
  initialTenureYears = 5,
  initialRate = PERSONAL_LOAN_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialAmount?: number;
  initialTenureYears?: number;
  initialRate?: number;
}) {
  const [amount, setAmountState] = useState(initialAmount);
  const [tenureYears, setTenureYearsState] = useState(initialTenureYears);
  const [ratePercent, setRatePercentState] = useState(initialRate);
  const [employmentType, setEmploymentType] = useState<'' | 'salaried' | 'self-employed' | 'other'>(
    '',
  );

  const setAmount = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setAmountState(Math.round(value));
  }, []);

  const setTenureYears = useCallback((years: number) => {
    if (!Number.isFinite(years) || years <= 0) return;
    setTenureYearsState(years);
  }, []);

  const setRatePercent = useCallback((rate: number) => {
    if (!Number.isFinite(rate) || rate < 0) return;
    setRatePercentState(rate);
  }, []);

  const tenureMonths = Math.round(tenureYears * 12);
  const emiResult = useMemo(
    () =>
      calculateEmi({
        principal: amount,
        annualRatePercent: ratePercent,
        tenureMonths,
      }),
    [amount, ratePercent, tenureMonths],
  );

  const value = useMemo(
    () => ({
      amount,
      tenureYears,
      ratePercent,
      employmentType,
      setAmount,
      setTenureYears,
      setRatePercent,
      setEmploymentType,
      emiResult,
      tenureMonths,
    }),
    [
      amount,
      tenureYears,
      ratePercent,
      employmentType,
      setAmount,
      setTenureYears,
      setRatePercent,
      emiResult,
      tenureMonths,
    ],
  );

  return (
    <PersonalLoanDecisionContext.Provider value={value}>
      {children}
    </PersonalLoanDecisionContext.Provider>
  );
}

export function usePersonalLoanDecision(): PersonalLoanDecisionState {
  const ctx = useContext(PersonalLoanDecisionContext);
  if (!ctx) {
    throw new Error('usePersonalLoanDecision must be used within PersonalLoanDecisionProvider');
  }
  return ctx;
}
