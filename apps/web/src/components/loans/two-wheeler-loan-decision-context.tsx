'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { calculateEmi, type EmiResult } from '@/lib/emi';
import {
  TW_DEFAULT_DOWN_PAYMENT,
  TW_DEFAULT_TENURE_YEARS,
  TW_DEFAULT_VEHICLE_PRICE,
  TW_ILLUSTRATIVE_RATE,
  clampTwoWheelerDownPayment,
  twoWheelerLoanRequirement,
  twoWheelerFinancingPercent,
  type TwoWheelerVehicleType,
  type TwoWheelerVehicleCondition,
} from '@/lib/two-wheeler-loan-page';

type TwoWheelerDecisionContextValue = {
  vehiclePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanRequirement: number;
  financingPercent: number | null;
  vehicleCondition: TwoWheelerVehicleCondition;
  vehicleType: TwoWheelerVehicleType;
  tenureYears: number;
  tenureMonths: number;
  ratePercent: number;
  emiResult: EmiResult | null;
  setVehiclePrice: (n: number) => void;
  setDownPayment: (n: number) => void;
  setDownPaymentFromPercent: (percent: number) => void;
  setVehicleCondition: (v: TwoWheelerVehicleCondition) => void;
  setVehicleType: (v: TwoWheelerVehicleType) => void;
  setTenureYears: (n: number) => void;
  setRatePercent: (n: number) => void;
};

const TwoWheelerDecisionContext = createContext<TwoWheelerDecisionContextValue | null>(null);

export { TW_ILLUSTRATIVE_RATE };

export function TwoWheelerDecisionProvider({
  children,
  initialVehiclePrice = TW_DEFAULT_VEHICLE_PRICE,
  initialDownPayment = TW_DEFAULT_DOWN_PAYMENT,
  initialTenureYears = TW_DEFAULT_TENURE_YEARS,
  initialRate = TW_ILLUSTRATIVE_RATE,
}: {
  children: ReactNode;
  initialVehiclePrice?: number;
  initialDownPayment?: number;
  initialTenureYears?: number;
  initialRate?: number;
}) {
  const [vehiclePrice, setVehiclePriceState] = useState(initialVehiclePrice);
  const [downPayment, setDownPaymentState] = useState(
    clampTwoWheelerDownPayment(initialVehiclePrice, initialDownPayment),
  );
  const [vehicleCondition, setVehicleCondition] = useState<TwoWheelerVehicleCondition>('new');
  const [vehicleType, setVehicleType] = useState<TwoWheelerVehicleType>('motorcycle');
  const [tenureYears, setTenureYears] = useState(initialTenureYears);
  const [ratePercent, setRatePercent] = useState(initialRate);

  const setVehiclePrice = useCallback((n: number) => {
    if (!Number.isFinite(n) || n <= 0) return;
    setVehiclePriceState((prevPrice) => {
      setDownPaymentState((prevDp) => {
        const pct = prevPrice > 0 ? Math.min(100, Math.max(0, (prevDp / prevPrice) * 100)) : 20;
        return clampTwoWheelerDownPayment(n, Math.round((n * pct) / 100));
      });
      return n;
    });
  }, []);

  const setDownPayment = useCallback(
    (n: number) => {
      setDownPaymentState(clampTwoWheelerDownPayment(vehiclePrice, n));
    },
    [vehiclePrice],
  );

  const setDownPaymentFromPercent = useCallback(
    (percent: number) => {
      if (!Number.isFinite(percent) || percent < 0) return;
      const amount = Math.round((vehiclePrice * Math.min(100, percent)) / 100);
      setDownPaymentState(clampTwoWheelerDownPayment(vehiclePrice, amount));
    },
    [vehiclePrice],
  );

  const loanRequirement = twoWheelerLoanRequirement(vehiclePrice, downPayment);
  const downPaymentPercent =
    vehiclePrice > 0
      ? (clampTwoWheelerDownPayment(vehiclePrice, downPayment) / vehiclePrice) * 100
      : 0;
  const financingPercent = twoWheelerFinancingPercent(vehiclePrice, loanRequirement);
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

  const value = useMemo<TwoWheelerDecisionContextValue>(
    () => ({
      vehiclePrice,
      downPayment: clampTwoWheelerDownPayment(vehiclePrice, downPayment),
      downPaymentPercent,
      loanRequirement,
      financingPercent,
      vehicleCondition,
      vehicleType,
      tenureYears,
      tenureMonths,
      ratePercent,
      emiResult,
      setVehiclePrice,
      setDownPayment,
      setDownPaymentFromPercent,
      setVehicleCondition,
      setVehicleType,
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
      vehicleType,
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
    <TwoWheelerDecisionContext.Provider value={value}>
      {children}
    </TwoWheelerDecisionContext.Provider>
  );
}

export function useTwoWheelerDecision() {
  const ctx = useContext(TwoWheelerDecisionContext);
  if (!ctx) throw new Error('useTwoWheelerDecision must be used within TwoWheelerDecisionProvider');
  return ctx;
}
