import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  jsonValueSchema,
  mediaResourceTypeSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const MAX_MEDIA_UPLOAD_BYTES = 50 * 1024 * 1024;

const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'image/avif': [[0x00, 0x00, 0x00]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'video/mp4': [[0x00, 0x00, 0x00]],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
};

/** Verify file header matches declared MIME type when a signature is known. */
export function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType.toLowerCase()];
  if (!signatures?.length) return true;
  return signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte),
  );
}

export const mediaListQuerySchema = cursorPaginationQuerySchema.extend({
  folderId: uuidSchema.optional().nullable(),
  resourceType: mediaResourceTypeSchema.optional(),
});

export const mediaSearchQuerySchema = cursorPaginationQuerySchema.extend({
  folderId: uuidSchema.optional().nullable(),
  resourceType: mediaResourceTypeSchema.optional(),
  tagId: uuidSchema.optional(),
});

export const createMediaFolderSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  parentId: uuidSchema.optional().nullable(),
});

export const updateMediaFolderSchema = createMediaFolderSchema.partial();

export const createMediaAssetSchema = z.object({
  publicId: z.string().min(1).max(255),
  url: z.string().url(),
  secureUrl: z.string().url(),
  resourceType: mediaResourceTypeSchema.default('IMAGE'),
  originalName: z.string().max(255).optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(120).optional().nullable(),
  format: z.string().max(40).optional().nullable(),
  bytes: z.number().int().nonnegative().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  duration: z.number().int().nonnegative().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  alt: z.string().max(300).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  folderId: uuidSchema.optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
  tagIds: z.array(uuidSchema).default([]),
});

export const updateMediaAssetSchema = createMediaAssetSchema
  .omit({ publicId: true, url: true, secureUrl: true })
  .partial()
  .extend({
    tagIds: z.array(uuidSchema).optional(),
  });

export const createMediaCollectionSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  assetIds: z.array(uuidSchema).default([]),
});

export const updateMediaCollectionSchema = createMediaCollectionSchema.partial().extend({
  assetIds: z.array(uuidSchema).optional(),
});

export const bulkDeleteMediaSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
});

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
export type MediaSearchQuery = z.infer<typeof mediaSearchQuerySchema>;
export type CreateMediaAssetInput = z.infer<typeof createMediaAssetSchema>;
export type UpdateMediaAssetInput = z.infer<typeof updateMediaAssetSchema>;
export type CreateMediaFolderInput = z.infer<typeof createMediaFolderSchema>;
export type UpdateMediaFolderInput = z.infer<typeof updateMediaFolderSchema>;
export type CreateMediaCollectionInput = z.infer<typeof createMediaCollectionSchema>;
export type UpdateMediaCollectionInput = z.infer<typeof updateMediaCollectionSchema>;
