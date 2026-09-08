# Construction Intelligence admin

Path: `/construction/intelligence` (also linked from Construction overview).

Reuse:

- Existing materials / brands / categories CRUD
- CSV toolbar on materials
- Audit logs (`/audit`) for platform-wide events; rate-specific rows go to `construction_rate_audit_logs`

Permissions:

- `construction.view` / `construction.manage`
- `construction.rates.view` / `manage` / `verify`
- `construction.sources.manage`
- `construction.import`
- `construction.settings.manage`

Rate edits must keep history on `construction_material_prices` (insert new effective row; do not silently overwrite).
