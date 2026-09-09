export const DEFAULT_BODY_WEIGHT_KG = 75;

export const parseStoredBodyWeight = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_BODY_WEIGHT_KG;
  }

  const normalized = typeof value === 'string' ? value.trim() : String(value);
  if (normalized === '') {
    return DEFAULT_BODY_WEIGHT_KG;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BODY_WEIGHT_KG;
  }

  return parsed;
};
