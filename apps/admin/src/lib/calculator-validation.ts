import {
  isCalculatorFieldVisible,
  LOAN_CALCULATOR_FIELD_VISIBILITY,
  LOAN_CALCULATOR_SLUG,
} from '@varnarc/validation';

export type CalculatorField = {
  key: string;
  label: string;
  fieldType: string;
  defaultValue?: string | null;
  required?: boolean;
  options?: unknown;
};

export type CalculatorValidationTarget = {
  id: string;
  slug: string;
  name: string;
  status: string;
  settings?: { fieldVisibility?: Record<string, Record<string, string[]>> } | null;
  fields?: CalculatorField[];
};

export type CalculatorValidationResult = {
  id: string;
  slug: string;
  name: string;
  ok: boolean;
  message: string;
  loadOk?: boolean;
  calculateOk?: boolean;
};

const NUMERIC_FALLBACK = 100;
const TEXT_FALLBACK = '1';

function firstSelectOption(options: unknown): string | null {
  if (!Array.isArray(options) || !options.length) return null;
  const first = options[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'value' in first) {
    return String((first as { value: unknown }).value);
  }
  return null;
}

export function buildCalculatorTestInputs(
  calc: Pick<CalculatorValidationTarget, 'slug' | 'settings' | 'fields'>,
): Record<string, string | number> {
  const fields = calc.fields ?? [];
  const inputs: Record<string, string | number> = {};

  if (calc.slug === LOAN_CALCULATOR_SLUG) {
    inputs.loanType = 'home';
  }

  const visibility =
    calc.slug === LOAN_CALCULATOR_SLUG
      ? LOAN_CALCULATOR_FIELD_VISIBILITY
      : (calc.settings?.fieldVisibility ?? null);

  for (const field of fields) {
    if (!isCalculatorFieldVisible(field.key, inputs, visibility)) continue;

    if (field.defaultValue != null && field.defaultValue !== '') {
      inputs[field.key] =
        field.fieldType === 'number' ||
        field.fieldType === 'slider' ||
        field.fieldType === 'currency' ||
        field.fieldType === 'percentage'
          ? Number(field.defaultValue)
          : field.defaultValue;
      continue;
    }

    if (field.fieldType === 'checkbox') {
      inputs[field.key] = 0;
      continue;
    }

    if (field.fieldType === 'select' || field.fieldType === 'radio') {
      const option = firstSelectOption(field.options);
      if (option != null) inputs[field.key] = option;
      continue;
    }

    if (
      field.fieldType === 'number' ||
      field.fieldType === 'slider' ||
      field.fieldType === 'currency' ||
      field.fieldType === 'percentage'
    ) {
      inputs[field.key] = NUMERIC_FALLBACK;
      continue;
    }

    if (field.required !== false) {
      inputs[field.key] = TEXT_FALLBACK;
    }
  }

  return inputs;
}

export async function validateCalculatorOnApi(
  apiUrl: string,
  calc: CalculatorValidationTarget,
): Promise<CalculatorValidationResult> {
  const base: CalculatorValidationResult = {
    id: calc.id,
    slug: calc.slug,
    name: calc.name,
    ok: false,
    message: 'Unknown error',
  };

  if (calc.status !== 'PUBLISHED') {
    return { ...base, ok: true, message: 'Skipped (not published)' };
  }

  let detail = calc;
  if (!detail.fields?.length) {
    try {
      const res = await fetch(`${apiUrl}/calculators/slug/${encodeURIComponent(calc.slug)}`, {
        cache: 'no-store',
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: CalculatorValidationTarget;
        error?: { message?: string };
      };
      if (!res.ok || json.success === false || !json.data) {
        return {
          ...base,
          loadOk: false,
          message: json.error?.message || `Failed to load slug (${res.status})`,
        };
      }
      detail = { ...calc, ...json.data };
    } catch (error) {
      return {
        ...base,
        loadOk: false,
        message: error instanceof Error ? error.message : 'Failed to load calculator',
      };
    }
  }

  if (!detail.fields?.length) {
    return { ...base, loadOk: false, message: 'No fields configured' };
  }

  const inputs = buildCalculatorTestInputs(detail);

  try {
    const res = await fetch(`${apiUrl}/calculators/${detail.id}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs }),
      cache: 'no-store',
    });
    const json = (await res.json()) as {
      success?: boolean;
      data?: { outputs?: Record<string, unknown> };
      error?: { message?: string };
    };
    if (!res.ok || json.success === false) {
      return {
        ...base,
        loadOk: true,
        calculateOk: false,
        message: json.error?.message || `Calculate failed (${res.status})`,
      };
    }
    if (!json.data?.outputs || !Object.keys(json.data.outputs).length) {
      return {
        ...base,
        loadOk: true,
        calculateOk: false,
        message: 'Calculate returned no outputs',
      };
    }
    return {
      ...base,
      ok: true,
      loadOk: true,
      calculateOk: true,
      message: 'OK',
    };
  } catch (error) {
    return {
      ...base,
      loadOk: true,
      calculateOk: false,
      message: error instanceof Error ? error.message : 'Calculate request failed',
    };
  }
}

export async function validateAllCalculators(
  apiUrl: string,
  calculators: CalculatorValidationTarget[],
  concurrency = 8,
): Promise<CalculatorValidationResult[]> {
  const results: CalculatorValidationResult[] = [];
  for (let i = 0; i < calculators.length; i += concurrency) {
    const batch = calculators.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((calc) => validateCalculatorOnApi(apiUrl, calc)),
    );
    results.push(...batchResults);
  }
  return results;
}
