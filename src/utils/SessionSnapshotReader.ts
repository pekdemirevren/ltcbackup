import { calculate1RM, calculateDSI, LiftData } from './StrengthCalculator';
import { getSessionCalories } from './SnapshotCalorieReader';
import { parseStoredBodyWeight } from '../constants/bodyWeight';

/**
 * SessionSnapshotReader
 *
 * Small, focused reader helpers that enforce snapshot-first precedence for historical metrics.
 * Precedence for each reader: persisted snapshot -> recorded session data -> null (insufficient)
 *
 * Return shape: { value, source }
 */

type ReaderResult<T> = { value: T | null; source: string };

function getAverageFiniteNumber(values: number[] | undefined): number | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const finiteValues = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (finiteValues.length === 0) return null;
  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
}

export function getCalories(session: any): ReaderResult<number> {
  // Reuse existing snapshot helper semantics: if session.calories is finite use it.
  const value = getSessionCalories(session?.calories, {
    workoutId: session?.workoutId || session?.workoutType || 'Strength',
    durationSeconds: session?.elapsedTime || 0,
    bodyWeightKg: session?.bodyWeightKg ?? undefined,
    liftedWeightKg: undefined,
    reps: session?.completedReps || 0,
  });

  const source = (typeof session?.calories === 'number' && Number.isFinite(session.calories)) ? 'snapshot' : 'computed';
  return { value, source };
}

export function getTotalVolume(session: any): ReaderResult<number> {
  if (typeof session?.totalVolume === 'number' && Number.isFinite(session.totalVolume)) {
    return { value: session.totalVolume, source: 'snapshot' };
  }

  if (Array.isArray(session?.exerciseLifts) && session.exerciseLifts.length > 0) {
    let sum = 0;
    for (const e of session.exerciseLifts) {
      const sets = e.sets || 0;
      const reps = e.reps || 0;
      const weight = e.weightKg || e.weight || 0;
      if (sets > 0 && reps > 0 && weight > 0) {
        sum += sets * reps * weight;
      }
    }
    return { value: sum || null, source: 'recorded_exerciseLifts' };
  }

  if (typeof session?.liftedWeightKg === 'number' && Number.isFinite(session.liftedWeightKg) && (session?.completedSets || session?.completedReps)) {
    const sets = session.completedSets || 0;
    const reps = session.completedReps || 0;
    const weight = session.liftedWeightKg;
    if (sets > 0 && reps > 0 && weight > 0) {
      return { value: sets * reps * weight, source: 'recorded_session_fields' };
    }
  }

  return { value: null, source: 'insufficient' };
}

export function getBodyWeight(session: any): ReaderResult<number> {
  if (typeof session?.bodyWeightKg === 'number' && Number.isFinite(session.bodyWeightKg)) {
    return { value: session.bodyWeightKg, source: 'snapshot' };
  }
  return { value: null, source: 'insufficient' };
}

export function get1RM(session: any, exerciseId?: string): ReaderResult<number> {
  if (Array.isArray(session?.exerciseLifts) && session.exerciseLifts.length > 0) {
    let lifts = session.exerciseLifts;
    if (exerciseId) lifts = session.exerciseLifts.filter((l: any) => l.exerciseId === exerciseId);
    let max1RM = 0;
    for (const l of lifts) {
      const weight = l.weightKg || l.weight || 0;
      const reps = l.reps || 0;
      if (weight > 0 && reps > 0) {
        const oneRM = calculate1RM(weight, reps);
        if (oneRM > max1RM) max1RM = oneRM;
      }
    }
    return { value: max1RM > 0 ? max1RM : null, source: 'recorded_exerciseLifts' };
  }

  if (typeof session?.liftedWeightKg === 'number' && Number.isFinite(session.liftedWeightKg) && session?.completedReps) {
    const oneRM = calculate1RM(session.liftedWeightKg, session.completedReps);
    return { value: oneRM > 0 ? oneRM : null, source: 'recorded_session_fields' };
  }

  return { value: null, source: 'insufficient' };
}

export function getDSIForSession(session: any): ReaderResult<number> {
  if (!Array.isArray(session?.exerciseLifts) || session.exerciseLifts.length === 0) return { value: null, source: 'insufficient_lifts' };
  if (typeof session?.bodyWeightKg !== 'number' || !Number.isFinite(session.bodyWeightKg) || session.bodyWeightKg <= 0) return { value: null, source: 'insufficient_bodyWeight' };

  const lifts: LiftData[] = session.exerciseLifts.map((l: any) => ({ weight: l.weightKg || l.weight || 0, reps: l.reps || 0 }));
  const dsi = calculateDSI(lifts, session.bodyWeightKg);
  return { value: dsi > 0 ? dsi : null, source: 'computed_from_exerciseLifts' };
}

export function getActiveTime(session: any): ReaderResult<number> {
  if (typeof session?.activeTime === 'number' && Number.isFinite(session.activeTime)) return { value: session.activeTime, source: 'activeTime' };
  if (typeof session?.avgGreenLoopTime === 'number' && Number.isFinite(session.avgGreenLoopTime)) return { value: session.avgGreenLoopTime, source: 'avgGreenLoopTime' };
  const averageGreenLoopTime = getAverageFiniteNumber(session?.greenLoopTimes);
  if (averageGreenLoopTime !== null) {
    return { value: averageGreenLoopTime, source: 'greenLoopTimes' };
  }
  const elapsedTime = typeof session?.elapsedTime === 'number' && Number.isFinite(session.elapsedTime) ? session.elapsedTime : null;
  const restTimeResult = getRestTime(session);
  if (elapsedTime !== null && restTimeResult.value !== null) return { value: elapsedTime - restTimeResult.value, source: 'elapsed_minus_rest' };
  return { value: null, source: 'insufficient' };
}

export function getRestTime(session: any): ReaderResult<number> {
  if (typeof session?.restTime === 'number' && Number.isFinite(session.restTime)) return { value: session.restTime, source: 'restTime' };
  if (typeof session?.avgRedLoopTime === 'number' && Number.isFinite(session.avgRedLoopTime)) return { value: session.avgRedLoopTime, source: 'avgRedLoopTime' };
  const averageRedLoopTime = getAverageFiniteNumber(session?.redLoopTimes);
  if (averageRedLoopTime !== null) {
    return { value: averageRedLoopTime, source: 'redLoopTimes' };
  }
  return { value: null, source: 'insufficient' };
}
