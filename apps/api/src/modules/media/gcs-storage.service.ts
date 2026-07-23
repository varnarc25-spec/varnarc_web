import { BadRequestException, Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_UPLOAD_BYTES,
  validateFileSignature,
} from '@varnarc/validation';
import type {
  MediaResourceType,
  MediaUploadOptions,
  MediaUploadPayload,
} from './media-storage.types';

const MIME_TO_RESOURCE: Record<string, MediaResourceType> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/svg+xml': 'IMAGE',
  'image/avif': 'IMAGE',
  'application/pdf': 'DOCUMENT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENT',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOCUMENT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'DOCUMENT',
  'text/plain': 'DOCUMENT',
  'video/mp4': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'video/webm': 'VIDEO',
};

/**
 * Google Cloud Storage backend for the Media Library.
 * Image resize / WebP / AVIF / on-the-fly transforms are deferred —
 * see docs/12-Media-Image-Transforms-FUTURE.md
 */
@Injectable()
export class GcsStorageService {
  private readonly configured: boolean;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string | null;
  private readonly storage: Storage | null;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET?.trim() ?? '';
    this.publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL?.trim() || null;

    const projectId = process.env.GCS_PROJECT_ID?.trim() || undefined;
    const clientEmail = process.env.GCS_CLIENT_EMAIL?.trim();
    const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

    this.configured = Boolean(this.bucketName);

    if (!this.configured) {
      this.storage = null;
      return;
    }

    if (clientEmail && privateKey) {
      this.storage = new Storage({
        projectId,
        credentials: { client_email: clientEmail, private_key: privateKey },
      });
    } else if (keyFilename) {
      this.storage = new Storage({ projectId, keyFilename });
    } else {
      // Application Default Credentials (Cloud Run / gcloud auth)
      this.storage = new Storage({ projectId });
    }
  }

  isConfigured() {
    return this.configured && Boolean(this.storage);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'GCS_NOT_CONFIGURED',
          message:
            'Google Cloud Storage is not configured. Set GCS_BUCKET (and credentials via GCS_CLIENT_EMAIL/GCS_PRIVATE_KEY, GOOGLE_APPLICATION_CREDENTIALS, or ADC).',
        },
      });
    }
  }

  validateUpload(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_FILE', message: 'No file uploaded.' },
      });
    }
    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
      throw new BadRequestException({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum upload size.' },
      });
    }
    const mime = file.mimetype?.toLowerCase();
    if (!mime || !ALLOWED_MEDIA_MIME_TYPES.includes(mime as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])) {
      throw new BadRequestException({
        success: false,
        error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported file type: ${mime ?? 'unknown'}` },
      });
    }
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const blocked = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'html'];
    if (ext && blocked.includes(ext)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'UNSUPPORTED_TYPE', message: 'Executable uploads are not allowed.' },
      });
    }
    if (!validateFileSignature(file.buffer, mime)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_FILE_SIGNATURE',
          message: 'File content does not match the declared file type.',
        },
      });
    }
    return { mime, resourceType: MIME_TO_RESOURCE[mime] ?? 'RAW' };
  }

  async upload(
    file: Express.Multer.File,
    options: MediaUploadOptions = {},
  ): Promise<MediaUploadPayload> {
    this.assertConfigured();
    const storage = this.storage!;
    const { mime, resourceType } = this.validateUpload(file);

    const ext = file.originalname.includes('.')
      ? file.originalname.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
      : mime.split('/')[1] || 'bin';
    const safeName = file.originalname
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'asset';

    const folder = options.folderPath
      ? options.folderPath.replace(/^\/+|\/+$/g, '')
      : 'uploads';
    const objectId = options.publicId ?? `${folder}/${safeName}-${randomUUID().slice(0, 8)}.${ext}`;
    const publicId = objectId.replace(/^\/+/, '');

    const bucket = storage.bucket(this.bucketName);
    const gcsFile = bucket.file(publicId);

    await gcsFile.save(file.buffer, {
      resumable: false,
      contentType: mime,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          originalName: file.originalname,
          resourceType,
        },
      },
    });

    const makePublic = process.env.GCS_MAKE_PUBLIC === 'true';
    if (makePublic) {
      await gcsFile.makePublic().catch(() => undefined);
    }

    const secureUrl = this.buildPublicUrl(publicId);
    const format = ext || null;

    return {
      publicId,
      url: secureUrl,
      secureUrl,
      resourceType,
      format,
      bytes: file.size,
      width: null,
      height: null,
      duration: null,
      thumbnailUrl: resourceType === 'IMAGE' ? secureUrl : null,
      versions: [{ label: 'original', url: secureUrl, width: null, height: null }],
    };
  }

  async destroy(publicId: string, _resourceType: MediaResourceType) {
    this.assertConfigured();
    const storage = this.storage!;
    await storage.bucket(this.bucketName).file(publicId).delete({ ignoreNotFound: true });
  }

  buildPublicUrl(publicId: string) {
    const path = publicId.replace(/^\/+/, '');
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${path}`;
    }
    return `https://storage.googleapis.com/${this.bucketName}/${path}`;
  }
}
