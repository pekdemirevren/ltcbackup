import { DEFAULT_BODY_WEIGHT_KG, parseStoredBodyWeight } from '../src/constants/bodyWeight';
import { calculateDSI, calculateStrengthRatio } from '../src/utils/StrengthCalculator';

describe('Body Weight persistence and default integrity', () => {
  test.each([
    ['75', 75],
    ['75.5', 75.5],
    ['80.25', 80.25],
  ])('parses stored body weight %s into %s', (storedValue, expected) => {
    expect(parseStoredBodyWeight(storedValue)).toBe(expected);
  });

  it('returns the default body weight when the stored value is missing', () => {
    expect(parseStoredBodyWeight(null)).toBe(DEFAULT_BODY_WEIGHT_KG);
    expect(parseStoredBodyWeight(undefined)).toBe(DEFAULT_BODY_WEIGHT_KG);
    expect(parseStoredBodyWeight('')).toBe(DEFAULT_BODY_WEIGHT_KG);
  });

  it('preserves decimal precision through a string round trip', () => {
    const original = 75.5;
    const stored = String(original);
    expect(parseStoredBodyWeight(stored)).toBe(original);
  });

  it('returns the default body weight for an invalid stored value', () => {
    expect(parseStoredBodyWeight('abc')).toBe(DEFAULT_BODY_WEIGHT_KG);
  });

  it('preserves zero as a valid numeric value according to current calculator behavior', () => {
    expect(parseStoredBodyWeight('0')).toBe(0);
  });

  it('keeps the existing default-based strength ratio behavior unchanged', () => {
    expect(calculateStrengthRatio(150)).toBe(2);
  });

  it('keeps the existing default-based DSI behavior unchanged', () => {
    const lifts = [{ weight: 100, reps: 5 }];
    const expected = (100 * (1 + 5 / 30)) / DEFAULT_BODY_WEIGHT_KG;
    expect(calculateDSI(lifts)).toBeCloseTo(expected, 10);
  });
});
