-- Application-hosted media files (when GCS is not configured).

CREATE TABLE IF NOT EXISTS "media_asset_blobs" (
    "asset_id" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    CONSTRAINT "media_asset_blobs_pkey" PRIMARY KEY ("asset_id")
);

ALTER TABLE "media_asset_blobs"
  DROP CONSTRAINT IF EXISTS "media_asset_blobs_asset_id_fkey";

ALTER TABLE "media_asset_blobs"
  ADD CONSTRAINT "media_asset_blobs_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
