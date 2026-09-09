import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainCardAttempt, MainCardState } from '../types/mainCard';
import { getMainCardState, processMainCardRun, calcSessionMetrics } from './MainCardEngine';
import { MAIN_CARDS } from '../constants/mainCards';

const ATTEMPT_PREFIX = 'main_card_attempt_';

/**
 * Starts a new attempt for a main card
 */
export async function startMainCardAttempt(cardId: string): Promise<MainCardAttempt> {
    const card = MAIN_CARDS.find(c => c.id === cardId);
    if (!card) throw new Error(`Card ${cardId} not found`);

    const state = await getMainCardState(cardId);

    const attempt: MainCardAttempt = {
        id: `${cardId}_${Date.now()}`,
        mainCardId: cardId,
        workoutIds: card.workoutIds,
        completedWorkouts: [],
        startedAt: new Date().toISOString(),
        isCompleted: false,
    };

    await AsyncStorage.setItem(`${ATTEMPT_PREFIX}${attempt.id}`, JSON.stringify(attempt));

    // Update state with current attempt
    state.currentAttemptId = attempt.id;
    await AsyncStorage.setItem(`main_card_state_${cardId}`, JSON.stringify(state));

    return attempt;
}

/**
 * Gets the current attempt for a card
 */
export async function getCurrentAttempt(cardId: string): Promise<MainCardAttempt | null> {
    const state = await getMainCardState(cardId);
    if (!state.currentAttemptId) return null;

    const saved = await AsyncStorage.getItem(`${ATTEMPT_PREFIX}${state.currentAttemptId}`);
    return saved ? JSON.parse(saved) : null;
}

/**
 * Updates an attempt with a completed workout
 */
export async function recordWorkoutInAttempt(
    cardId: string,
    workoutId: string,
    sessionData: Parameters<typeof calcSessionMetrics>[0]
): Promise<{ attempt: MainCardAttempt, runProcessed: boolean }> {
    const attempt = await getCurrentAttempt(cardId);
    if (!attempt || attempt.isCompleted) return { attempt: attempt!, runProcessed: false };

    // Determine if this is the first time we're recording this workout for the attempt
    const isNewCompletion = !attempt.completedWorkouts.includes(workoutId);

    // Add to completed if not already there
    if (isNewCompletion) {
        attempt.completedWorkouts.push(workoutId);
    }

    // Save partial session data for this workout only once to avoid duplicate metrics
    const metricsKey = `${ATTEMPT_PREFIX}${attempt.id}_metrics`;
    const savedMetrics = await AsyncStorage.getItem(metricsKey);
    let metricsList = savedMetrics ? JSON.parse(savedMetrics) : [];

    if (isNewCompletion) {
        metricsList.push(calcSessionMetrics(sessionData));
        await AsyncStorage.setItem(metricsKey, JSON.stringify(metricsList));
    }

    let runProcessed = false;
    if (attempt.completedWorkouts.length === attempt.workoutIds.length) {
        attempt.isCompleted = true;
        const card = MAIN_CARDS.find(c => c.id === cardId);
        if (card) {
            const ctx = {
                runIndex: (await getMainCardState(cardId)).level + 1,
                completedWorkoutCount: attempt.completedWorkouts.length,
                dayKey: new Date().toISOString().split('T')[0],
                attemptId: attempt.id,
            };
            await processMainCardRun(card, metricsList, ctx);
            runProcessed = true;
        }
    }

    await AsyncStorage.setItem(`${ATTEMPT_PREFIX}${attempt.id}`, JSON.stringify(attempt));

    return { attempt, runProcessed };
}
