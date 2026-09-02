import { probeImageDimensions } from './image-dimensions';
import type { MediaResourceType } from './media-storage.types';

export function publicApiBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.API_URL ||
    'http://localhost:4000/api/v1';
  return raw.replace(/\/$/, '');
}

export function appMediaPublicUrl(assetId: string) {
  return `${publicApiBaseUrl()}/media/public/${assetId}`;
}

export function extFromUpload(file: Express.Multer.File, mime: string) {
  const fromName = file.originalname
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return fromName || mime.split('/')[1] || 'bin';
}

export function imageDims(
  file: Express.Multer.File,
  mime: string,
  resourceType: MediaResourceType,
) {
  return resourceType === 'IMAGE' ? probeImageDimensions(file.buffer, mime) : null;
}
