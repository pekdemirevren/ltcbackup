import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AttrKey,
    SessionMetrics,
    MainCard,
    MainCardState,
    RunContext,
    MainCardGains
} from '../types/mainCard';

const MAIN_CARD_STATE_PREFIX = 'main_card_state_';

const softcap = (x: number, cap: number) => cap * (1 - Math.exp(-x / cap));

/**
 * Calculates raw session metrics from workout data
 */
export function calcSessionMetrics(input: {
    weightKg?: number;
    completedSets?: number;
    completedReps?: number;
    elapsedSec?: number;
    activeSec?: number;
    restSec?: number;
}): SessionMetrics {
    const w = Math.max(0, input.weightKg ?? 0);
    const sets = Math.max(0, input.completedSets ?? 0);
    const reps = Math.max(0, input.completedReps ?? 0);
    const elapsed = Math.max(1, input.elapsedSec ?? 1);
    const active = Math.max(0, input.activeSec ?? 0);
    const rest = Math.max(0, input.restSec ?? 0);

    const volumeKg = w * sets * reps;
    const enduranceMin = Math.round(elapsed / 60);
    const cadenceSecPerRep = reps > 0 ? +(active / reps).toFixed(1) : 0;
    const intensityRatio = active > 0 ? +(rest / active).toFixed(1) : 1;
    const densityPct = elapsed > 0 ? Math.round((active / elapsed) * 100) : 0;

    return { volumeKg, enduranceMin, cadenceSecPerRep, intensityRatio, densityPct };
}

/**
 * Maps session metrics to attribute points based on soft-capped formulas
 */
export function metricsToAttr(m: SessionMetrics): Record<AttrKey, number> {
    const STR = softcap(m.volumeKg / 250, 12) + softcap(m.intensityRatio, 4);
    const VOL = softcap(m.volumeKg / 180, 15);
    const END = softcap(m.enduranceMin / 6, 10);

    // TMP: 2.0–4.0 s/rep is "controlled" tempo range
    const tempoScore = m.cadenceSecPerRep === 0 ? 0 : Math.max(0, 1 - Math.abs(m.cadenceSecPerRep - 3.0) / 2.0);
    const TMP = softcap(tempoScore * 10, 8);

    const PHY = softcap(m.densityPct / 12, 10);
    const HYP = softcap((m.volumeKg / 220) * (0.6 + 0.4 * tempoScore), 14);

    return { STR, VOL, TMP, END, PHY, HYP };
}

/**
 * Gets the current state for a main card
 */
export async function getMainCardState(cardId: string): Promise<MainCardState> {
    try {
        const saved = await AsyncStorage.getItem(`${MAIN_CARD_STATE_PREFIX}${cardId}`);
        if (saved) return JSON.parse(saved);

        // Default initial state
        return {
            id: cardId,
            level: 0,
            xp: 0,
            gains: { STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 },
            shards: {},
            unlockedSecondaries: [],
            currentAttemptId: null
        };
    } catch (e) {
        console.error('Failed to get main card state:', e);
        return {
            id: cardId,
            level: 0,
            xp: 0,
            gains: { STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 },
            shards: {},
            unlockedSecondaries: [],
            currentAttemptId: null
        };
    }
}

/**
 * Processes a completed run for a main card
 */
export async function processMainCardRun(
    card: MainCard,
    workoutMetrics: SessionMetrics[],
    ctx: RunContext
): Promise<{
    state: MainCardState,
    leveledUp: boolean,
    gainsFromRun: MainCardGains,
    shardsGained: Record<string, number>
}> {
    const state = await getMainCardState(card.id);

    // Requirement: At least 70% of workouts in the package completed
    const completionRate = ctx.completedWorkoutCount / card.workoutIds.length;
    if (completionRate < 0.7) {
        return { state, leveledUp: false, gainsFromRun: { STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 }, shardsGained: {} };
    }

    // 1. Calculate base attribute gains from all workouts in this run
    const runAttrTotals: MainCardGains = { STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 };

    workoutMetrics.forEach(m => {
        const attr = metricsToAttr(m);
        (Object.keys(attr) as AttrKey[]).forEach(key => {
            runAttrTotals[key] += attr[key];
        });
    });

    // 2. Apply card-specific weights to the gains
    const gainsFromRun: MainCardGains = { STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 };
    (Object.keys(runAttrTotals) as AttrKey[]).forEach(key => {
        gainsFromRun[key] = +(runAttrTotals[key] * card.weights[key]).toFixed(2);
        state.gains[key] = +(state.gains[key] + gainsFromRun[key]).toFixed(2);
    });

    // 3. Update XP and Level
    state.xp += 1;
    let leveledUp = false;
    if (state.level < card.requiredRuns) {
        state.level += 1;
        leveledUp = true;
    }

    // 4. Award Shards
    const shardsGained: Record<string, number> = {};
    card.secondaryUnlocks.forEach(rule => {
        // For simplicity, we use the average metrics of the run for shard formulas
        const avgMetrics: SessionMetrics = {
            volumeKg: workoutMetrics.reduce((acc, m) => acc + m.volumeKg, 0) / workoutMetrics.length,
            enduranceMin: workoutMetrics.reduce((acc, m) => acc + m.enduranceMin, 0) / workoutMetrics.length,
            cadenceSecPerRep: workoutMetrics.reduce((acc, m) => acc + m.cadenceSecPerRep, 0) / workoutMetrics.length,
            intensityRatio: workoutMetrics.reduce((acc, m) => acc + m.intensityRatio, 0) / workoutMetrics.length,
            densityPct: workoutMetrics.reduce((acc, m) => acc + m.densityPct, 0) / workoutMetrics.length,
        };

        const count = rule.shardFormula(avgMetrics, ctx);
        if (count > 0) {
            state.shards[rule.icon] = (state.shards[rule.icon] || 0) + count;
            shardsGained[rule.icon] = count;

            // Auto-unlock if shard threshold reached
            if (state.shards[rule.icon] >= rule.shardsToUnlock && !state.unlockedSecondaries.includes(rule.icon)) {
                state.unlockedSecondaries.push(rule.icon);
            }
        }
    });

    // Save state
    await AsyncStorage.setItem(`${MAIN_CARD_STATE_PREFIX}${card.id}`, JSON.stringify(state));

    return { state, leveledUp, gainsFromRun, shardsGained };
}
