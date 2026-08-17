'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { calculateEmi, type EmiResult } from '@/lib/emi';
import {
  CAR_LOAN_DEFAULT_DOWN_PAYMENT,
  CAR_LOAN_DEFAULT_TENURE_YEARS,
  CAR_LOAN_DEFAULT_VEHICLE_PRICE,
  CAR_LOAN_ILLUSTRATIVE_RATE,
  carLoanFinancingPercent,
  carLoanRequirement,
  clampCarLoanDownPayment,
  type CarVehicleCondition,
} from '@/lib/car-loan-page';

type CarLoanDecisionContextValue = {
  vehiclePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanRequirement: number;
  financingPercent: number | null;
  vehicleCondition: CarVehicleCondition;
  tenureYears: number;
  tenureMonths: number;
  ratePercent: number;
  emiResult: EmiResult | null;
  setVehiclePrice: (n: number) => void;
  setDownPayment: (n: number) => void;
  setDownPaymentFromPercent: (percent: number) => void;
  setVehicleCondition: (v: CarVehicleCondition) => void;
  setTenureYears: (n: number) => void;
  setRatePercent: (n: number) => void;
};

const CarLoanDecisionContext = createContext<CarLoanDecisionContextValue | null>(null);

export { CAR_LOAN_ILLUSTRATIVE_RATE };

export function CarLoanDecisionProvider({
  children,
  initialVehiclePrice = CAR_LOAN_DEFAULT_VEHICLE_PRICE,
  initialDownPayment = CAR_LOAN_DEFAULT_DOWN_PAYMENT,
  initialTenureYears = CAR_LOAN_DEFAULT_TENURE_YEARS,
  initialRate = CAR_LOAN_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialVehiclePrice?: number;
  initialDownPayment?: number;
  initialTenureYears?: number;
  initialRate?: number;
}) {
  const [vehiclePrice, setVehiclePriceState] = useState(initialVehiclePrice);
  const [downPayment, setDownPaymentState] = useState(
    clampCarLoanDownPayment(initialVehiclePrice, initialDownPayment),
  );
  const [vehicleCondition, setVehicleCondition] = useState<CarVehicleCondition>('new');
  const [tenureYears, setTenureYears] = useState(initialTenureYears);
  const [ratePercent, setRatePercent] = useState(initialRate);

  const setVehiclePrice = useCallback((n: number) => {
    if (!Number.isFinite(n) || n <= 0) return;
    setVehiclePriceState((prevPrice) => {
      setDownPaymentState((prevDp) => {
        const pct = prevPrice > 0 ? Math.min(100, Math.max(0, (prevDp / prevPrice) * 100)) : 20;
        return clampCarLoanDownPayment(n, Math.round((n * pct) / 100));
      });
      return n;
    });
  }, []);

  const setDownPayment = useCallback(
    (n: number) => {
      setDownPaymentState(clampCarLoanDownPayment(vehiclePrice, n));
    },
    [vehiclePrice],
  );

  const setDownPaymentFromPercent = useCallback(
    (percent: number) => {
      if (!Number.isFinite(percent) || percent < 0) return;
      const amount = Math.round((vehiclePrice * Math.min(100, percent)) / 100);
      setDownPaymentState(clampCarLoanDownPayment(vehiclePrice, amount));
    },
    [vehiclePrice],
  );

  const loanRequirement = carLoanRequirement(vehiclePrice, downPayment);
  const downPaymentPercent =
    vehiclePrice > 0
      ? (clampCarLoanDownPayment(vehiclePrice, downPayment) / vehiclePrice) * 100
      : 0;
  const financingPercent = carLoanFinancingPercent(vehiclePrice, loanRequirement);
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

  const value = useMemo<CarLoanDecisionContextValue>(
    () => ({
      vehiclePrice,
      downPayment: clampCarLoanDownPayment(vehiclePrice, downPayment),
      downPaymentPercent,
      loanRequirement,
      financingPercent,
      vehicleCondition,
      tenureYears,
      tenureMonths,
      ratePercent,
      emiResult,
      setVehiclePrice,
      setDownPayment,
      setDownPaymentFromPercent,
      setVehicleCondition,
      setTenureYears,
      setRatePercent,
    }),
    [
      vehiclePrice,
      downPayment,
      downPaymentPercent,
      loanRequirement,
      financingPercent,
      vehicleCondition,
      tenureYears,
      tenureMonths,
      ratePercent,
      emiResult,
      setVehiclePrice,
      setDownPayment,
      setDownPaymentFromPercent,
    ],
  );

  return (
    <CarLoanDecisionContext.Provider value={value}>{children}</CarLoanDecisionContext.Provider>
  );
}

export function useCarLoanDecision() {
  const ctx = useContext(CarLoanDecisionContext);
  if (!ctx) throw new Error('useCarLoanDecision must be used within CarLoanDecisionProvider');
  return ctx;
}
