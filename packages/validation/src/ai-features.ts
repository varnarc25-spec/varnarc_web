import { z } from 'zod';

export const summarizeContentSchema = z.object({
  text: z.string().min(20).max(50000),
  style: z.enum(['brief', 'bullets', 'paragraph']).default('brief'),
  maxSentences: z.number().int().min(1).max(10).default(3),
});

export const summarizeBatchSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().max(120).optional(),
        label: z.string().max(200).optional(),
        text: z.string().min(20).max(50000),
      }),
    )
    .min(1)
    .max(20),
  style: z.enum(['brief', 'bullets', 'paragraph']).default('brief'),
  maxSentences: z.number().int().min(1).max(10).default(3),
});

export const editorialEnrichSchema = z.object({
  limit: z.number().int().min(1).max(10).default(5),
});

export const generateAiSeoSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().max(50000).optional().nullable(),
  excerpt: z.string().max(2000).optional().nullable(),
  entityType: z
    .enum(['article', 'page', 'calculator', 'guide', 'product', 'review', 'general'])
    .default('general'),
  path: z.string().max(300).optional().nullable(),
  locale: z.string().max(12).default('en-IN'),
});

export const calculatorAssistMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

export const calculatorAssistSchema = z.object({
  calculatorName: z.string().min(1).max(200),
  calculatorSlug: z.string().max(120).optional().nullable(),
  inputs: z.record(z.union([z.string(), z.number(), z.boolean()])),
  outputs: z.record(z.union([z.string(), z.number(), z.boolean()])),
  question: z.string().max(500).optional().nullable(),
  messages: z.array(calculatorAssistMessageSchema).max(20).optional(),
});

export type SummarizeContentInput = z.infer<typeof summarizeContentSchema>;
export type SummarizeBatchInput = z.infer<typeof summarizeBatchSchema>;
export type EditorialEnrichInput = z.infer<typeof editorialEnrichSchema>;
export type GenerateAiSeoInput = z.infer<typeof generateAiSeoSchema>;
export type CalculatorAssistInput = z.infer<typeof calculatorAssistSchema>;
