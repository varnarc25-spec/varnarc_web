/** Timeline planner schemas & result types. */

import { z } from 'zod';
import { TIMELINE_CONSTRUCTION_TYPES, TIMELINE_UI_STATUSES } from './rates';

export const timelineUiStatusSchema = z.enum(TIMELINE_UI_STATUSES);
export const timelineConstructionTypeSchema = z.enum(TIMELINE_CONSTRUCTION_TYPES);

export const timelinePhaseInputSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  /** Whole weeks — labelled estimate in UI */
  durationWeeks: z.number().finite().min(0).max(520),
  durationIsEstimate: z.boolean().default(true),
  plannedStart: z.string().min(1).max(32), // ISO date YYYY-MM-DD
  plannedEnd: z.string().min(1).max(32),
  status: timelineUiStatusSchema.default('not_started'),
  progress: z.number().min(0).max(100).default(0),
  notes: z.string().max(2000).optional().nullable(),
  /** Optional dependency: id of another phase that should finish first */
  dependsOnId: z.string().max(64).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const timelinePlannerInputSchema = z.object({
  projectStartDate: z.string().min(1).max(32),
  builtUpAreaSqft: z.number().positive().max(5_000_000),
  floors: z.number().positive().max(100).default(1),
  constructionType: timelineConstructionTypeSchema.default('house-construction'),
  phases: z.array(timelinePhaseInputSchema).min(0).max(100),
});

export const timelineGenerateSchema = z.object({
  projectStartDate: z.string().min(1).max(32),
  builtUpAreaSqft: z.number().positive().max(5_000_000),
  floors: z.number().positive().max(100).default(1),
  constructionType: timelineConstructionTypeSchema.default('house-construction'),
});

export type TimelinePhaseInput = z.input<typeof timelinePhaseInputSchema>;
export type TimelinePlannerInput = z.input<typeof timelinePlannerInputSchema>;
export type TimelineGenerateInput = z.input<typeof timelineGenerateSchema>;

export type TimelinePhaseResult = {
  id: string;
  name: string;
  durationWeeks: number;
  durationIsEstimate: boolean;
  plannedStart: string;
  plannedEnd: string;
  status: z.infer<typeof timelineUiStatusSchema>;
  progress: number;
  notes: string | null;
  dependsOnId: string | null;
  sortOrder: number;
  /** True when status is delayed or past planned end while incomplete */
  isDelayed: boolean;
};

export type TimelinePlannerResult = {
  projectStartDate: string;
  builtUpAreaSqft: number;
  floors: number;
  constructionType: z.infer<typeof timelineConstructionTypeSchema>;
  phases: TimelinePhaseResult[];
  estimatedCompletionDate: string | null;
  overallProgress: number;
  delayedPhases: Array<{ id: string; name: string; reason: string }>;
  totalEstimatedWeeks: number;
  assumptions: string[];
  qualification: string;
  version: string;
};
