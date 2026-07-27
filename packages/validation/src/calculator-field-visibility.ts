export type FieldVisibilityMap = Record<string, Record<string, string[]>>;

/** Whether a calculator field should be shown / validated for the current inputs. */
export function isCalculatorFieldVisible(
  fieldKey: string,
  inputs: Record<string, unknown>,
  map?: FieldVisibilityMap | null,
): boolean {
  const constraints = map?.[fieldKey];
  if (!constraints) return true;
  return Object.entries(constraints).every(([depField, allowed]) =>
    allowed.includes(String(inputs[depField] ?? '')),
  );
}
