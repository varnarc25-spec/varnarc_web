import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { probeImageDimensions } from './image-dimensions';
import { SettingsService } from '../settings/settings.service';

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

type ResolvedGcs = {
  bucket: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  publicBaseUrl: string | null;
  makePublic: boolean;
};

/**
 * Google Cloud Storage backend for the Media Library.
 * Admin Settings (database) take precedence over environment variables.
 */
@Injectable()
export class GcsStorageService {
  private readonly logger = new Logger(GcsStorageService.name);

  constructor(private readonly settings: SettingsService) {}

  private throwUploadError(err: unknown, bucket: string): never {
    const raw = err as { message?: string; code?: number | string; errors?: { reason?: string }[] };
    const msg = (raw.message ?? String(err))
      .replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, '[redacted]')
      .slice(0, 800);
    this.logger.error(
      `GCS upload failed (bucket=${bucket} code=${String(raw.code ?? '')}): ${msg}`,
    );

    const lower = msg.toLowerCase();
    let message =
      `Could not write to Google Cloud Storage bucket "${bucket}". ` +
      'Confirm the Cloud Run service account has Storage Object Admin on that bucket.';

    if (
      lower.includes('could not load the default credentials') ||
      lower.includes('no such file')
    ) {
      message =
        'Google Cloud credentials are not available on this API. On Cloud Run, attach a runtime service account (no JSON key). Locally, run gcloud auth application-default login.';
    } else if (raw.code === 404 || lower.includes('notfound') || lower.includes('not found')) {
      message = `GCS bucket "${bucket}" was not found. Check the bucket name and GCP project ID in Admin → Settings → Cloud Storage.`;
    } else if (
      raw.code === 403 ||
      lower.includes('forbidden') ||
      lower.includes('access denied') ||
      lower.includes('permission')
    ) {
      message = `The Cloud Run service account is not allowed to write to bucket "${bucket}". Grant Storage Object Admin on that bucket to the varmarc-api runtime service account.`;
    } else if (raw.code === 401 || lower.includes('unauthenticated')) {
      message =
        'GCS rejected authentication. Use Application Default Credentials on Cloud Run; leave the private key empty in Admin.';
    }

    throw new BadRequestException({
      success: false,
      error: {
        code: 'GCS_UPLOAD_FAILED',
        message,
        details: {
          bucket: bucket || null,
          providerCode: raw.code ?? null,
          providerReason: raw.errors?.[0]?.reason ?? null,
          providerMessage: msg,
        },
      },
    });
  }

  private envConfig(): ResolvedGcs | null {
    const bucket = process.env.GCS_BUCKET?.trim() ?? '';
    if (!bucket) return null;
    return {
      bucket,
      projectId: process.env.GCS_PROJECT_ID?.trim() || undefined,
      clientEmail: process.env.GCS_CLIENT_EMAIL?.trim() || undefined,
      privateKey: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n') || undefined,
      publicBaseUrl: process.env.GCS_PUBLIC_BASE_URL?.trim() || null,
      makePublic: process.env.GCS_MAKE_PUBLIC === 'true',
    };
  }

  async resolveConfig(): Promise<ResolvedGcs | null> {
    const db = await this.settings.getGcsRaw().catch(() => null);
    if (db?.enabled && db.bucket?.trim()) {
      return {
        bucket: db.bucket.trim(),
        projectId: db.projectId?.trim() || undefined,
        clientEmail: db.clientEmail?.trim() || undefined,
        privateKey: db.privateKey?.replace(/\\n/g, '\n') || undefined,
        publicBaseUrl: db.publicBaseUrl?.trim() || null,
        makePublic: Boolean(db.makePublic),
      };
    }
    return this.envConfig();
  }

  async isConfigured() {
    return Boolean(await this.resolveConfig());
  }

  async assertConfigured() {
    if (!(await this.isConfigured())) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'GCS_NOT_CONFIGURED',
          message:
            'Google Cloud Storage is not configured. Add it under Admin → Settings → Cloud Storage, or set GCS_BUCKET in the environment.',
        },
      });
    }
  }

  private createClient(cfg: ResolvedGcs) {
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (cfg.clientEmail && cfg.privateKey) {
      return new Storage({
        projectId: cfg.projectId,
        credentials: { client_email: cfg.clientEmail, private_key: cfg.privateKey },
      });
    }
    if (keyFilename) {
      return new Storage({ projectId: cfg.projectId, keyFilename });
    }
    return new Storage({ projectId: cfg.projectId });
  }

  private async requireClient() {
    const cfg = await this.resolveConfig();
    if (!cfg) {
      await this.assertConfigured();
      throw new BadRequestException({
        success: false,
        error: { code: 'GCS_NOT_CONFIGURED', message: 'Google Cloud Storage is not configured.' },
      });
    }
    return { cfg, storage: this.createClient(cfg) };
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
    if (
      !mime ||
      !ALLOWED_MEDIA_MIME_TYPES.includes(mime as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])
    ) {
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
    let bucketName = '';
    let cfg: ResolvedGcs;
    let storage: Storage;
    try {
      const client = await this.requireClient();
      cfg = client.cfg;
      storage = client.storage;
      bucketName = cfg.bucket;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.throwUploadError(err, bucketName || 'unknown');
    }
    const { mime, resourceType } = this.validateUpload(file);

    const ext = file.originalname.includes('.')
      ? file.originalname
          .split('.')
          .pop()!
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
      : mime.split('/')[1] || 'bin';
    const safeName =
      file.originalname
        .replace(/\.[^.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'asset';

    const folder = options.folderPath ? options.folderPath.replace(/^\/+|\/+$/g, '') : 'uploads';
    const objectId = options.publicId ?? `${folder}/${safeName}-${randomUUID().slice(0, 8)}.${ext}`;
    const publicId = objectId.replace(/^\/+/, '');

    const bucket = storage.bucket(cfg.bucket);
    const gcsFile = bucket.file(publicId);

    try {
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
    } catch (err) {
      this.throwUploadError(err, cfg.bucket);
    }

    if (cfg.makePublic) {
      await gcsFile.makePublic().catch(() => undefined);
    }

    const secureUrl = this.buildPublicUrl(publicId, cfg);
    const format = ext || null;
    const dims = resourceType === 'IMAGE' ? probeImageDimensions(file.buffer, mime) : null;

    return {
      publicId,
      url: secureUrl,
      secureUrl,
      resourceType,
      format,
      bytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      duration: null,
      thumbnailUrl: resourceType === 'IMAGE' ? secureUrl : null,
      versions: [
        {
          label: 'original',
          url: secureUrl,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
        },
      ],
    };
  }

  async destroy(publicId: string, _resourceType: MediaResourceType) {
    const { cfg, storage } = await this.requireClient();
    await storage.bucket(cfg.bucket).file(publicId).delete({ ignoreNotFound: true });
  }

  /**
   * Short-lived signed URL for private objects.
   * Prefer streaming via Nest after auth for construction vault downloads.
   */
  async getSignedUrl(publicId: string, expiresMinutes = 15): Promise<string> {
    const { cfg, storage } = await this.requireClient();
    const [url] = await storage
      .bucket(cfg.bucket)
      .file(publicId.replace(/^\/+/, ''))
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + Math.max(1, expiresMinutes) * 60_000,
      });
    return url;
  }

  async downloadBuffer(publicId: string): Promise<{ buffer: Buffer; contentType?: string }> {
    const { cfg, storage } = await this.requireClient();
    const file = storage.bucket(cfg.bucket).file(publicId.replace(/^\/+/, ''));
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata().catch(() => [null]);
    return {
      buffer,
      contentType: metadata?.contentType as string | undefined,
    };
  }

  buildPublicUrl(publicId: string, cfg?: ResolvedGcs | null) {
    const path = publicId.replace(/^\/+/, '');
    const publicBaseUrl = (cfg?.publicBaseUrl ?? process.env.GCS_PUBLIC_BASE_URL?.trim()) || null;
    const bucket = cfg?.bucket ?? process.env.GCS_BUCKET?.trim() ?? '';
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/+$/, '')}/${path}`;
    }
    return `https://storage.googleapis.com/${bucket}/${path}`;
  }
}
