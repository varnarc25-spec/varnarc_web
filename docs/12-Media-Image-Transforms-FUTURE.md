# 12 — Media Image Transforms (Future)

> Status: **Not implemented**  
> Current storage: **Google Cloud Storage (GCS)** — originals only  
> Owner: Media Library module

This document is the implementation plan for a custom JS image pipeline that replaces Cloudinary-style transforms.

---

## Goal

Add first-party image optimization on top of GCS:

* Automatic resizing
* WebP / AVIF encoding
* Thumbnails and responsive variants
* Optional on-the-fly transforms via URL (phase 2)

Postgres continues to store **metadata only**. Binary files stay in GCS.

---

## Why not now

GCS already covers secure storage and CDN-friendly delivery. Transforms can be added later without changing Media Library APIs or admin UX.

Today the upload path stores:

* One original object in GCS
* One `media_asset_versions` row with label `original`
* `thumbnailUrl` = original URL for images (placeholder until variants exist)

---

## Recommended approach (phase 1)

**Upload-time variants with Sharp** (Node.js).

On `POST /media/upload` for images:

1. Save original to GCS (`…/original.ext`)
2. Generate variants with Sharp
3. Upload each variant to GCS
4. Persist rows in `media_asset_versions`
5. Set `thumbnailUrl` to the thumbnail variant URL
6. Optionally store width/height/format on `media_assets`

### Suggested variant set

| Label | Width | Crop | Formats |
|-------|-------|------|---------|
| `thumbnail` | 150×150 | cover/fill | webp (+ jpeg fallback optional) |
| `small` | 320 | inside/limit | webp, avif |
| `medium` | 768 | inside/limit | webp, avif |
| `large` | 1280 | inside/limit | webp, avif |
| `original` | — | — | source format |

Skip SVG (serve as-is). Skip non-image resource types.

### Package

```bash
pnpm add sharp --filter @varnarc/api
```

### Suggested module layout

```
apps/api/src/modules/media/
  gcs-storage.service.ts          # existing — object put/delete/URL
  image-transform.service.ts      # NEW — Sharp pipeline
  media.service.ts                # call transform after GCS original upload
```

### Pseudocode

```ts
// image-transform.service.ts
async generateVariants(buffer: Buffer, publicIdBase: string) {
  const pipeline = sharp(buffer).rotate(); // honor EXIF
  const meta = await pipeline.metadata();

  const specs = [
    { label: 'thumbnail', width: 150, height: 150, fit: 'cover' },
    { label: 'small', width: 320 },
    { label: 'medium', width: 768 },
    { label: 'large', width: 1280 },
  ];

  const outputs = [];
  for (const spec of specs) {
    let img = sharp(buffer).rotate();
    if (spec.height) img = img.resize(spec.width, spec.height, { fit: spec.fit ?? 'inside' });
    else img = img.resize({ width: spec.width, withoutEnlargement: true });

    const webp = await img.webp({ quality: 80 }).toBuffer();
    // upload webp to GCS at `${publicIdBase}/${spec.label}.webp`
    outputs.push({ label: spec.label, url, width, height });
  }
  return { meta, outputs };
}
```

Wire into `GcsStorageService.upload` or `MediaService.uploadFile` after the original is saved.

---

## Phase 2 (optional): on-the-fly URL transforms

Only if arbitrary sizes are needed beyond the fixed variant set.

Options:

1. **NestJS transform route** (simplest, higher CPU cost)
   - `GET /media/transform?publicId=…&w=400&f=webp`
   - Fetch original from GCS → Sharp → stream response
   - Cache via CDN / Cloud CDN / Cache-Control

2. **imgproxy** in front of GCS (recommended for production scale)
   - Signed URLs, aggressive caching, less NestJS CPU

Do **not** expose unbounded width/height without auth or signed URLs (abuse risk).

---

## Public / admin consumption

After phase 1:

* Admin asset detail already lists `versions` — will show real variants
* Theme / CMS / ads keep using `secureUrl` or pick `thumbnail` / `medium` from versions
* Add a small web helper later:

```ts
function mediaSrcSet(versions: { label: string; url: string; width?: number }[]) {
  return versions
    .filter((v) => v.width)
    .map((v) => `${v.url} ${v.width}w`)
    .join(', ');
}
```

---

## Env / config (future)

```env
# Existing
GCS_BUCKET=
GCS_PROJECT_ID=
GCS_PUBLIC_BASE_URL=

# Future transform flags
MEDIA_TRANSFORMS_ENABLED=true
MEDIA_GENERATE_AVIF=true
MEDIA_GENERATE_WEBP=true
MEDIA_VARIANT_WIDTHS=320,768,1280
MEDIA_THUMBNAIL_SIZE=150
```

---

## Acceptance criteria

- [ ] Image upload creates thumbnail / small / medium / large objects in GCS
- [ ] `media_asset_versions` populated with labels and dimensions
- [ ] `thumbnailUrl` points at thumbnail variant
- [ ] Non-image uploads unchanged (original only)
- [ ] Failed variant generation does not orphan DB rows (transaction or compensating delete)
- [ ] SVG and animated GIF policy documented (pass-through vs first-frame)
- [ ] Admin UI shows variant links
- [ ] Docs (`12-Media-Library.md`) updated to GCS + Sharp (not Cloudinary)

---

## Out of scope (for now)

* AI alt-text / OCR / duplicate detection
* Video transcoding
* Antivirus scanning
* Switching storage providers again (Cloudinary, etc.)

---

## Implementation checklist when ready

1. Add `sharp` dependency to `@varnarc/api`
2. Create `ImageTransformService`
3. Extend upload flow to write variants to GCS
4. Persist versions + dimensions
5. Backfill job (optional) for existing originals
6. Update public image components to prefer WebP/AVIF + `srcset`
7. (Optional) Add signed on-the-fly transform endpoint or imgproxy
