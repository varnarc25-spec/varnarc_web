# Construction rate sources

Registry rows are **documents**, not invented prices.

| Authority  | Document                   | URL                  | Coverage        | Imported numeric rates?                                      |
| ---------- | -------------------------- | -------------------- | --------------- | ------------------------------------------------------------ |
| CPWD       | Schedule of Rates          | https://cpwd.gov.in/ | India (central) | No — ingest a dated extract before publishing official rates |
| CPWD       | Analysis of Rates          | https://cpwd.gov.in/ | India           | No                                                           |
| State PWDs | State SOR / market surveys | State portals        | State           | No until a verified extract exists                           |
| Varnarc    | National planning baseline | n/a                  | India           | Yes — `ESTIMATED_FALLBACK`, confidence LOW                   |

Last checked: 2026-09-08.

Do not seed fictional CPWD bag/kg prices. When an official PDF/CSV is available, import via `ConstructionRateImportBatch` with `sourceType = OFFICIAL_SOR`.
