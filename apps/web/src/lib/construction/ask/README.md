# Ask Varnarc Construction

Deterministic natural-language navigation for Construction queries.

## Files

| Path                                                      | Role                                       |
| --------------------------------------------------------- | ------------------------------------------ |
| `lib/construction/ask/parser.ts`                          | Intent + value extraction                  |
| `lib/construction/ask/router.ts`                          | Prefill URLs + confidence gate             |
| `lib/construction/ask/catalog.ts`                         | Static tools/materials/guides autocomplete |
| `lib/construction/ask/fuzzy.ts`                           | Typo tolerance                             |
| `components/construction/ask/ask-construction-search.tsx` | Hero search UI                             |
| `app/construction/ask/page.tsx`                           | Low-confidence results (noindex)           |

## Intents

`calculator` · `comparison` · `material` · `price` · `location` · `guide` · `cost` · `unknown`

## Extracted values

`area` · `length` · `width` · `height` · `location` · `material` · `unit` · `floorCount` · `bhk` / `bedrooms`

## Routing rule

- Confidence ≥ **0.72** and known intent → navigate with query prefill
- Otherwise → `/construction/ask?q=…` (noindex) with ranked suggestions

Never invent material UUID compare ids. Never expose arbitrary DB search.

## Analytics

`ask_search_performed` — intent, category, result_count_bucket, auto_routed, query_length_bucket  
`ask_result_clicked` — intent, result_type

Raw query text is never sent.
