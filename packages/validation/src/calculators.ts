import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  jsonValueSchema,
  publishStatusSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const calculatorFieldTypeSchema = z.enum([
  'number',
  'currency',
  'percentage',
  'slider',
  'dropdown',
  'radio',
  'checkbox',
  'date',
  'month',
  'year',
  'text',
  'hidden',
  'computed',
]);

export const calculatorFieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(150),
  fieldType: calculatorFieldTypeSchema.or(z.string().min(1).max(40)),
  defaultValue: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
  required: z.boolean().default(true),
  options: jsonValueSchema.optional().nullable(),
  validation: jsonValueSchema.optional().nullable(),
});

export const createCalculatorCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateCalculatorCategorySchema = createCalculatorCategorySchema.partial();

export const createCalculatorSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(120).optional().nullable(),
  categoryId: uuidSchema.optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  formula: z.string().max(20000).optional().nullable(),
  resultTemplate: jsonValueSchema.optional().nullable(),
  settings: jsonValueSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  fields: z.array(calculatorFieldSchema).default([]),
});

export const updateCalculatorSchema = createCalculatorSchema.partial();

export const calculatorListQuerySchema = cursorPaginationQuerySchema.extend({
  categoryId: uuidSchema.optional(),
  status: publishStatusSchema.optional(),
});

export const runCalculatorSchema = z.object({
  inputs: z.record(z.unknown()),
  sessionId: z.string().max(120).optional().nullable(),
  device: z.string().max(80).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
});

export const saveCalculationSchema = z.object({
  calculatorId: uuidSchema,
  name: z.string().min(1).max(150),
  inputs: z.record(z.unknown()),
  outputs: z.record(z.unknown()).optional().nullable(),
});

export const cloneCalculatorSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  slug: slugSchema.optional(),
});

export const relatedArticlesQuerySchema = z.object({
  topic: z.string().min(1).max(60).optional(),
});

export type CalculatorFieldInput = z.infer<typeof calculatorFieldSchema>;
export type CreateCalculatorInput = z.infer<typeof createCalculatorSchema>;
export type UpdateCalculatorInput = z.infer<typeof updateCalculatorSchema>;
export type CreateCalculatorCategoryInput = z.infer<typeof createCalculatorCategorySchema>;
export type UpdateCalculatorCategoryInput = z.infer<typeof updateCalculatorCategorySchema>;
export type CalculatorListQuery = z.infer<typeof calculatorListQuerySchema>;
export type RunCalculatorInput = z.infer<typeof runCalculatorSchema>;
export type SaveCalculationInput = z.infer<typeof saveCalculationSchema>;
export type CloneCalculatorInput = z.infer<typeof cloneCalculatorSchema>;
export type RelatedArticlesQuery = z.infer<typeof relatedArticlesQuerySchema>;
