-- Seed allowlisted construction cities for the Prices hub (no thin price rows).
-- Price observations must be published separately with LIVE/VERIFIED freshness for SEO landings.

INSERT INTO construction_locations (id, type, name, slug, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'CITY', 'Hyderabad', 'hyderabad', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Bengaluru', 'bengaluru', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Chennai', 'chennai', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Mumbai', 'mumbai', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Pune', 'pune', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Delhi NCR', 'delhi', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Ahmedabad', 'ahmedabad', NOW(), NOW()),
  (gen_random_uuid(), 'CITY', 'Kolkata', 'kolkata', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  updated_at = NOW(),
  deleted_at = NULL;
