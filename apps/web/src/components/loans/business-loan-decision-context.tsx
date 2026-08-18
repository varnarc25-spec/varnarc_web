'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EmiResult } from '@/lib/emi';
import {
  BUSINESS_LOAN_DEFAULT_EXISTING_DEBT,
  BUSINESS_LOAN_DEFAULT_FUNDING,
  BUSINESS_LOAN_DEFAULT_OP_EXPENSES,
  BUSINESS_LOAN_DEFAULT_REVENUE,
  BUSINESS_LOAN_DEFAULT_TENURE_YEARS,
  BUSINESS_LOAN_DEFAULT_VINTAGE_YEARS,
  BUSINESS_LOAN_ILLUSTRATIVE_RATE,
  BUSINESS_LOAN_PLANNER_LIMITS,
  assessBusinessCashFlow,
  clampBusinessFunding,
  clampBusinessRate,
  clampBusinessTenureYears,
  clampContributionMarginPercent,
  clampNonNegative,
  estimateBusinessLoanEmi,
  facilityHintForPurpose,
  type BusinessEntityType,
  type BusinessFundingPurpose,
  type BusinessSecurityMode,
  type BusinessCashFlowResult,
} from '@/lib/business-loan-page';

type BusinessLoanDecisionContextValue = {
  purpose: BusinessFundingPurpose;
  fundingRequired: number;
  tenureYears: number;
  entityType: BusinessEntityType;
  vintageYears: number;
  ratePercent: number;
  monthlyRevenue: number;
  monthlyOpExpenses: number;
  existingMonthlyDebt: number;
  otherCommitments: number;
  securityMode: BusinessSecurityMode;
  annualTurnover: number;
  contributionMarginPercent: number;
  emi: EmiResult | null;
  cashFlow: BusinessCashFlowResult | null;
  facilityHint: ReturnType<typeof facilityHintForPurpose>;
  setPurpose: (p: BusinessFundingPurpose) => void;
  setFundingRequired: (n: number) => void;
  setTenureYears: (n: number) => void;
  setEntityType: (t: BusinessEntityType) => void;
  setVintageYears: (n: number) => void;
  setRatePercent: (n: number) => void;
  setMonthlyRevenue: (n: number) => void;
  setMonthlyOpExpenses: (n: number) => void;
  setExistingMonthlyDebt: (n: number) => void;
  setOtherCommitments: (n: number) => void;
  setSecurityMode: (m: BusinessSecurityMode) => void;
  setAnnualTurnover: (n: number) => void;
  setContributionMarginPercent: (n: number) => void;
};

const BusinessLoanDecisionContext = createContext<BusinessLoanDecisionContextValue | null>(null);

export function BusinessLoanDecisionProvider({
  children,
  initialRate = BUSINESS_LOAN_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialRate?: number;
}) {
  const [purpose, setPurpose] = useState<BusinessFundingPurpose>('working_capital');
  const [fundingRequired, setFundingRequiredState] = useState(BUSINESS_LOAN_DEFAULT_FUNDING);
  const [tenureYears, setTenureYearsState] = useState(BUSINESS_LOAN_DEFAULT_TENURE_YEARS);
  const [entityType, setEntityType] = useState<BusinessEntityType>('proprietorship');
  const [vintageYears, setVintageYearsState] = useState(BUSINESS_LOAN_DEFAULT_VINTAGE_YEARS);
  const [ratePercent, setRatePercentState] = useState(initialRate);
  const [monthlyRevenue, setMonthlyRevenueState] = useState(BUSINESS_LOAN_DEFAULT_REVENUE);
  const [monthlyOpExpenses, setMonthlyOpExpensesState] = useState(
    BUSINESS_LOAN_DEFAULT_OP_EXPENSES,
  );
  const [existingMonthlyDebt, setExistingMonthlyDebtState] = useState(
    BUSINESS_LOAN_DEFAULT_EXISTING_DEBT,
  );
  const [otherCommitments, setOtherCommitmentsState] = useState(0);
  const [securityMode, setSecurityMode] = useState<BusinessSecurityMode>('unsure');
  const [annualTurnover, setAnnualTurnoverState] = useState(1_00_00_000);
  const [contributionMarginPercent, setContributionMarginPercentState] = useState(25);

  const setFundingRequired = useCallback(
    (n: number) => setFundingRequiredState(clampBusinessFunding(n)),
    [],
  );
  const setTenureYears = useCallback(
    (n: number) => setTenureYearsState(clampBusinessTenureYears(n)),
    [],
  );
  const setRatePercent = useCallback((n: number) => setRatePercentState(clampBusinessRate(n)), []);
  const setVintageYears = useCallback(
    (n: number) =>
      setVintageYearsState(
        Math.min(BUSINESS_LOAN_PLANNER_LIMITS.vintageYearsMax, clampNonNegative(n)),
      ),
    [],
  );
  const setMonthlyRevenue = useCallback(
    (n: number) =>
      setMonthlyRevenueState(
        Math.min(BUSINESS_LOAN_PLANNER_LIMITS.revenueMax, clampNonNegative(n)),
      ),
    [],
  );
  const setMonthlyOpExpenses = useCallback(
    (n: number) =>
      setMonthlyOpExpensesState(
        Math.min(BUSINESS_LOAN_PLANNER_LIMITS.revenueMax, clampNonNegative(n)),
      ),
    [],
  );
  const setExistingMonthlyDebt = useCallback(
    (n: number) =>
      setExistingMonthlyDebtState(
        Math.min(BUSINESS_LOAN_PLANNER_LIMITS.revenueMax, clampNonNegative(n)),
      ),
    [],
  );
  const setOtherCommitments = useCallback(
    (n: number) =>
      setOtherCommitmentsState(
        Math.min(BUSINESS_LOAN_PLANNER_LIMITS.revenueMax, clampNonNegative(n)),
      ),
    [],
  );
  const setAnnualTurnover = useCallback(
    (n: number) =>
      setAnnualTurnoverState(
        Math.min(BUSINESS_LOAN_PLANNER_LIMITS.revenueMax, clampNonNegative(n)),
      ),
    [],
  );
  const setContributionMarginPercent = useCallback(
    (n: number) => setContributionMarginPercentState(clampContributionMarginPercent(n)),
    [],
  );

  const emi = useMemo(
    () =>
      estimateBusinessLoanEmi({
        loanAmount: fundingRequired,
        annualRatePercent: ratePercent,
        tenureYears,
      }),
    [fundingRequired, ratePercent, tenureYears],
  );

  const cashFlow = useMemo(() => {
    if (!emi) return null;
    return assessBusinessCashFlow({
      monthlyRevenue,
      monthlyOperatingExpenses: monthlyOpExpenses,
      existingMonthlyDebt,
      proposedMonthlyEmi: emi.monthlyEmi,
      otherCommitments,
    });
  }, [emi, monthlyRevenue, monthlyOpExpenses, existingMonthlyDebt, otherCommitments]);

  const facilityHint = facilityHintForPurpose(purpose);

  const value: BusinessLoanDecisionContextValue = {
    purpose,
    fundingRequired,
    tenureYears,
    entityType,
    vintageYears,
    ratePercent,
    monthlyRevenue,
    monthlyOpExpenses,
    existingMonthlyDebt,
    otherCommitments,
    securityMode,
    annualTurnover,
    contributionMarginPercent,
    emi,
    cashFlow,
    facilityHint,
    setPurpose,
    setFundingRequired,
    setTenureYears,
    setEntityType,
    setVintageYears,
    setRatePercent,
    setMonthlyRevenue,
    setMonthlyOpExpenses,
    setExistingMonthlyDebt,
    setOtherCommitments,
    setSecurityMode,
    setAnnualTurnover,
    setContributionMarginPercent,
  };

  return (
    <BusinessLoanDecisionContext.Provider value={value}>
      {children}
    </BusinessLoanDecisionContext.Provider>
  );
}

export function useBusinessLoanDecision(): BusinessLoanDecisionContextValue {
  const ctx = useContext(BusinessLoanDecisionContext);
  if (!ctx) {
    throw new Error('useBusinessLoanDecision must be used within BusinessLoanDecisionProvider');
  }
  return ctx;
}
