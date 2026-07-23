import type { CreateMediaAssetInput } from '@varnarc/validation';

export type MediaResourceType = CreateMediaAssetInput['resourceType'];

export type MediaUploadPayload = {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: MediaResourceType;
  format?: string | null;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  thumbnailUrl?: string | null;
  versions: Array<{
    label: string;
    url: string;
    width?: number | null;
    height?: number | null;
  }>;
};

export type MediaUploadOptions = {
  folderPath?: string;
  publicId?: string;
};
