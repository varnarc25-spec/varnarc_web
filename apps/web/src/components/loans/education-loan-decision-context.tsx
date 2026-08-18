'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EmiResult } from '@/lib/emi';
import {
  EDUCATION_LOAN_DEFAULT_BOOKS,
  EDUCATION_LOAN_DEFAULT_COURSE_YEARS,
  EDUCATION_LOAN_DEFAULT_LIVING,
  EDUCATION_LOAN_DEFAULT_MORATORIUM_MONTHS,
  EDUCATION_LOAN_DEFAULT_OTHER,
  EDUCATION_LOAN_DEFAULT_OWN_CONTRIBUTION,
  EDUCATION_LOAN_DEFAULT_REPAYMENT_YEARS,
  EDUCATION_LOAN_DEFAULT_SCHOLARSHIP,
  EDUCATION_LOAN_DEFAULT_TRAVEL,
  EDUCATION_LOAN_DEFAULT_TUITION,
  EDUCATION_LOAN_ILLUSTRATIVE_RATE,
  clampNonNegative,
  educationLoanRequirement,
  estimateEmiAfterStudy,
  estimateStudyPeriodInterest,
  totalEducationCost,
  type EducationInterestMode,
  type EducationSecurityMode,
  type EducationStudyLocation,
  type StudyPeriodInterestResult,
} from '@/lib/education-loan-page';

type EducationLoanDecisionContextValue = {
  studyLocation: EducationStudyLocation;
  tuition: number;
  living: number;
  books: number;
  travel: number;
  other: number;
  ownContribution: number;
  scholarship: number;
  totalCost: number;
  loanRequired: number;
  courseYears: number;
  courseMonths: number;
  moratoriumMonths: number;
  repaymentYears: number;
  ratePercent: number;
  interestMode: EducationInterestMode;
  securityMode: EducationSecurityMode;
  studyInterest: StudyPeriodInterestResult | null;
  emiAfterStudy: EmiResult | null;
  familyIncome: number;
  meritBasedAdmission: boolean | null;
  qheiEligible: boolean | null;
  setStudyLocation: (v: EducationStudyLocation) => void;
  setTuition: (n: number) => void;
  setLiving: (n: number) => void;
  setBooks: (n: number) => void;
  setTravel: (n: number) => void;
  setOther: (n: number) => void;
  setOwnContribution: (n: number) => void;
  setScholarship: (n: number) => void;
  setCourseYears: (n: number) => void;
  setMoratoriumMonths: (n: number) => void;
  setRepaymentYears: (n: number) => void;
  setRatePercent: (n: number) => void;
  setInterestMode: (m: EducationInterestMode) => void;
  setSecurityMode: (m: EducationSecurityMode) => void;
  setFamilyIncome: (n: number) => void;
  setMeritBasedAdmission: (v: boolean | null) => void;
  setQheiEligible: (v: boolean | null) => void;
};

const EducationLoanDecisionContext = createContext<EducationLoanDecisionContextValue | null>(null);

export function EducationLoanDecisionProvider({
  children,
  initialRate = EDUCATION_LOAN_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialRate?: number;
}) {
  const [studyLocation, setStudyLocation] = useState<EducationStudyLocation>('india');
  const [tuition, setTuitionState] = useState(EDUCATION_LOAN_DEFAULT_TUITION);
  const [living, setLivingState] = useState(EDUCATION_LOAN_DEFAULT_LIVING);
  const [books, setBooksState] = useState(EDUCATION_LOAN_DEFAULT_BOOKS);
  const [travel, setTravelState] = useState(EDUCATION_LOAN_DEFAULT_TRAVEL);
  const [other, setOtherState] = useState(EDUCATION_LOAN_DEFAULT_OTHER);
  const [ownContribution, setOwnContributionState] = useState(
    EDUCATION_LOAN_DEFAULT_OWN_CONTRIBUTION,
  );
  const [scholarship, setScholarshipState] = useState(EDUCATION_LOAN_DEFAULT_SCHOLARSHIP);
  const [courseYears, setCourseYears] = useState(EDUCATION_LOAN_DEFAULT_COURSE_YEARS);
  const [moratoriumMonths, setMoratoriumMonths] = useState(
    EDUCATION_LOAN_DEFAULT_MORATORIUM_MONTHS,
  );
  const [repaymentYears, setRepaymentYears] = useState(EDUCATION_LOAN_DEFAULT_REPAYMENT_YEARS);
  const [ratePercent, setRatePercent] = useState(initialRate);
  const [interestMode, setInterestMode] = useState<EducationInterestMode>('capitalize');
  const [securityMode, setSecurityMode] = useState<EducationSecurityMode>('unsure');
  const [familyIncome, setFamilyIncomeState] = useState(0);
  const [meritBasedAdmission, setMeritBasedAdmission] = useState<boolean | null>(null);
  const [qheiEligible, setQheiEligible] = useState<boolean | null>(null);

  const setTuition = useCallback((n: number) => setTuitionState(clampNonNegative(n)), []);
  const setLiving = useCallback((n: number) => setLivingState(clampNonNegative(n)), []);
  const setBooks = useCallback((n: number) => setBooksState(clampNonNegative(n)), []);
  const setTravel = useCallback((n: number) => setTravelState(clampNonNegative(n)), []);
  const setOther = useCallback((n: number) => setOtherState(clampNonNegative(n)), []);
  const setOwnContribution = useCallback(
    (n: number) => setOwnContributionState(clampNonNegative(n)),
    [],
  );
  const setScholarship = useCallback((n: number) => setScholarshipState(clampNonNegative(n)), []);
  const setFamilyIncome = useCallback((n: number) => setFamilyIncomeState(clampNonNegative(n)), []);

  const totalCost = totalEducationCost({ tuition, living, books, travel, other });
  const loanRequired = educationLoanRequirement({
    totalCost,
    ownContribution,
    scholarship,
  });
  const courseMonths = Math.round(courseYears * 12);

  const studyInterest = useMemo(
    () =>
      estimateStudyPeriodInterest({
        loanAmount: loanRequired,
        annualRatePercent: ratePercent,
        courseMonths,
        moratoriumMonths,
        mode: interestMode,
      }),
    [loanRequired, ratePercent, courseMonths, moratoriumMonths, interestMode],
  );

  const emiAfterStudy = useMemo(() => {
    const balance = studyInterest?.balanceAtRepaymentStart ?? loanRequired;
    return estimateEmiAfterStudy({
      balanceAtRepaymentStart: balance,
      annualRatePercent: ratePercent,
      repaymentYears,
    });
  }, [studyInterest, loanRequired, ratePercent, repaymentYears]);

  const value = useMemo<EducationLoanDecisionContextValue>(
    () => ({
      studyLocation,
      tuition,
      living,
      books,
      travel,
      other,
      ownContribution,
      scholarship,
      totalCost,
      loanRequired,
      courseYears,
      courseMonths,
      moratoriumMonths,
      repaymentYears,
      ratePercent,
      interestMode,
      securityMode,
      studyInterest,
      emiAfterStudy,
      familyIncome,
      meritBasedAdmission,
      qheiEligible,
      setStudyLocation,
      setTuition,
      setLiving,
      setBooks,
      setTravel,
      setOther,
      setOwnContribution,
      setScholarship,
      setCourseYears,
      setMoratoriumMonths,
      setRepaymentYears,
      setRatePercent,
      setInterestMode,
      setSecurityMode,
      setFamilyIncome,
      setMeritBasedAdmission,
      setQheiEligible,
    }),
    [
      studyLocation,
      tuition,
      living,
      books,
      travel,
      other,
      ownContribution,
      scholarship,
      totalCost,
      loanRequired,
      courseYears,
      courseMonths,
      moratoriumMonths,
      repaymentYears,
      ratePercent,
      interestMode,
      securityMode,
      studyInterest,
      emiAfterStudy,
      familyIncome,
      meritBasedAdmission,
      qheiEligible,
      setTuition,
      setLiving,
      setBooks,
      setTravel,
      setOther,
      setOwnContribution,
      setScholarship,
      setFamilyIncome,
    ],
  );

  return (
    <EducationLoanDecisionContext.Provider value={value}>
      {children}
    </EducationLoanDecisionContext.Provider>
  );
}

export function useEducationLoanDecision(): EducationLoanDecisionContextValue {
  const ctx = useContext(EducationLoanDecisionContext);
  if (!ctx) {
    throw new Error('useEducationLoanDecision must be used within EducationLoanDecisionProvider');
  }
  return ctx;
}
