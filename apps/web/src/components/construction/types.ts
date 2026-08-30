import type { ReactNode } from 'react';

export type ConstructionCrumb = {
  label: string;
  href?: string;
};

export type ConstructionLinkItem = {
  href: string;
  label: string;
  description?: string | null;
};

export type ConstructionFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type ConstructionMetric = {
  id?: string;
  label: string;
  value: ReactNode;
  hint?: string;
};

export type ConstructionBreakdownRow = {
  id?: string;
  label: string;
  value: ReactNode;
  hint?: string;
};

export type ConstructionAssumption = {
  id?: string;
  label: string;
  value: string;
};

export type UnitOption = {
  value: string;
  label: string;
};
