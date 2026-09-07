import { describe, expect, it } from 'vitest';
import { resolvePublicCmsMediaUrl } from '@/lib/cms-media-url';
import { getApiBaseUrl } from '@/lib/runtime-public-env';

describe('resolvePublicCmsMediaUrl', () => {
  it('rebuilds media/public URLs onto the current API origin', () => {
    const id = 'c0000001-0000-4000-8000-000000000099';
    const src = resolvePublicCmsMediaUrl(`http://localhost:4000/api/v1/media/public/${id}`, id);
    expect(src).toBe(`${getApiBaseUrl()}/media/public/${id}`);
  });

  it('keeps a public GCS URL', () => {
    const gcs = 'https://storage.googleapis.com/bucket/hero.jpg';
    expect(resolvePublicCmsMediaUrl(gcs, null)).toBe(gcs);
  });
});
