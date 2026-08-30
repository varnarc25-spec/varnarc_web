/** Shared masonry wall / unit (brick or block) calculation types. */

export type MasonryCalcMode = 'forward' | 'reverse';

export type MasonrySizeMm = {
  length: number;
  width: number;
  height: number;
  label: string;
};

export type MasonryOpeningInput = {
  openingArea?: number | null;
  openingAreaUnit?: 'm2' | 'ft2';
  openingCount?: number | null;
  openingWidth?: number | null;
  openingHeight?: number | null;
  openingWidthUnit?: string;
  openingHeightUnit?: string;
};

export type MasonryJointMaterialInput =
  | {
      kind: 'mortar';
      cementParts: number;
      sandParts: number;
    }
  | {
      kind: 'adhesive';
      /** Bulk density of thin-bed adhesive for volume → kg (indicative). */
      densityKgPerM3: number;
      /** Optional bag size for bag count. */
      bagSizeKg?: number;
    };

export type MasonryJointMaterialEstimate = {
  kind: 'mortar' | 'adhesive';
  jointVolumeM3: number;
  dryVolumeM3: number | null;
  cementKg: number | null;
  sandVolumeM3: number | null;
  adhesiveKg: number | null;
  adhesiveBags: number | null;
  mixLabel: string;
};

export type MasonryUnitQuantityInput = {
  mode: MasonryCalcMode;
  wallLength?: number;
  wallHeight?: number;
  wallThickness: number;
  wallLengthUnit?: string;
  wallHeightUnit?: string;
  wallThicknessUnit?: string;
  openings?: MasonryOpeningInput;
  unit: MasonrySizeMm;
  jointMm: number;
  wastagePercent: number;
  availableUnits?: number;
  pricePerUnitInr?: number | null;
  includeJointMaterial?: boolean;
  jointMaterial?: MasonryJointMaterialInput;
  /** Noun for steps, e.g. "brick" or "AAC block" */
  unitNoun: string;
  version: string;
  disclaimer: string;
};

export type MasonryUnitQuantityResult = {
  mode: MasonryCalcMode;
  unitLabel: string;
  unitSizeMm: { length: number; width: number; height: number };
  modularSizeMm: { length: number; width: number; height: number };
  modularUnitVolumeM3: number;
  solidUnitVolumeM3: number;
  jointMm: number;
  grossWallAreaM2: number | null;
  openingAreaM2: number | null;
  netWallAreaM2: number | null;
  netWallVolumeM3: number | null;
  wallThicknessM: number;
  unitsBeforeWastage: number;
  wastageUnits: number;
  unitsRequired: number;
  buildableAreaM2: number | null;
  buildableVolumeM3: number | null;
  jointMaterial: MasonryJointMaterialEstimate | null;
  estimatedCostInr: number | null;
  pricePerUnitInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
