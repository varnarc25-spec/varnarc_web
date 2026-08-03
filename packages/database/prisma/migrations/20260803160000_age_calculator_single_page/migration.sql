-- Age calculator: replace wizard year/month inputs with date of birth + end date

UPDATE calculators
SET
  formula = '{"type":"age","outputs":{"ageYears":"ageYears","ageMonths":"ageMonths","ageDays":"ageDays","totalDays":"totalDays","nextBirthdayDays":"nextBirthdayDays"}}',
  result_template = '{
    "cards": [
      {"key": "ageYears", "label": "Age (years)", "format": "number"},
      {"key": "ageMonths", "label": "Age (months)", "format": "number"},
      {"key": "ageDays", "label": "Age (days)", "format": "number"},
      {"key": "totalDays", "label": "Total days", "format": "number"}
    ],
    "table": {
      "title": "Summary",
      "rows": [
        {"label": "Age (years)", "key": "ageYears", "format": "number"},
        {"label": "Age (months)", "key": "ageMonths", "format": "number"},
        {"label": "Age (days)", "key": "ageDays", "format": "number"},
        {"label": "Total days", "key": "totalDays", "format": "number"}
      ]
    },
    "chart": {
      "title": "Visual breakdown",
      "keys": ["ageYears", "ageMonths"],
      "labels": {"ageYears": "Age (years)", "ageMonths": "Age (months)"}
    },
    "breakdown": {
      "title": "Details",
      "items": [
        {"label": "Age (years)", "key": "ageYears", "format": "number"},
        {"label": "Age (months)", "key": "ageMonths", "format": "number"},
        {"label": "Age (days)", "key": "ageDays", "format": "number"},
        {"label": "Total days", "key": "totalDays", "format": "number"}
      ]
    },
    "recommendations": true
  }'::jsonb,
  settings = (COALESCE(settings, '{}'::jsonb) || '{
    "layout": "single",
    "faq": [
      {
        "q": "How is age calculated?",
        "a": "We compare your date of birth to the end date and return years, months, and days between them."
      },
      {
        "q": "What end date should I use?",
        "a": "Today is selected by default. Change it to calculate age as of any past or future date."
      }
    ]
  }'::jsonb) - 'mode' - 'steps',
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'age' AND deleted_at IS NULL;

DELETE FROM calculator_fields
WHERE calculator_id IN (
  SELECT id FROM calculators WHERE slug = 'age' AND deleted_at IS NULL
);

INSERT INTO calculator_fields (
  id,
  calculator_id,
  key,
  label,
  field_type,
  default_value,
  sort_order,
  required,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  c.id,
  f.key,
  f.label,
  f.field_type,
  f.default_value,
  f.sort_order,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM calculators c
CROSS JOIN (
  VALUES
    ('dateOfBirth', 'Date of birth', 'date', '1990-06-15', 0),
    ('endDate', 'End date', 'date', NULL::text, 1)
) AS f(key, label, field_type, default_value, sort_order)
WHERE c.slug = 'age' AND c.deleted_at IS NULL;
