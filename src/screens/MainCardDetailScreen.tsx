import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { MainCard, MainCardState, MainCardAttempt } from '../types/mainCard';
import { MAIN_CARDS } from '../constants/mainCards';
import { getMainCardState } from '../utils/MainCardEngine';
import { getCurrentAttempt, startMainCardAttempt } from '../utils/MainCardAttemptManager';
import { collectibleRarityColors } from '../constants/collectibleWorkouts';
import { MainCardCardNew } from '../components/MainCardCardNew';
import { TimerContext } from '../contexts/TimerContext';
import { allWorkouts, findExerciseIcon } from '../constants/workoutData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'MainCardDetail'>;

// We need to add 'MainCardDetail' to RootStackParamList
// I will do that in the next step or assume it exists since I'm implementing it now.

export default function MainCardDetailScreen({ route, navigation }: any) {
    const { cardId } = route.params;
    const card = useMemo(() => MAIN_CARDS.find(c => c.id === cardId), [cardId]);
    const [state, setState] = useState<MainCardState | null>(null);
    const [attempt, setAttempt] = useState<MainCardAttempt | null>(null);
    const timerContext = useContext(TimerContext);

    if (!card) return null;

    const loadData = async () => {
        const [s, a] = await Promise.all([
            getMainCardState(cardId),
            getCurrentAttempt(cardId)
        ]);
        setState(s);
        setAttempt(a);
    };

    useFocusEffect(
        React.useCallback(() => {
            void loadData();
        }, [cardId])
    );

    useEffect(() => {
        void loadData();
    }, [cardId]);

    const rarityConfig = collectibleRarityColors[card.rarity as keyof typeof collectibleRarityColors] || collectibleRarityColors.GOLD;

    const handleStartProgram = async () => {
        let currentAttempt = attempt;
        if (!currentAttempt || currentAttempt.isCompleted) {
            currentAttempt = await startMainCardAttempt(cardId);
            setAttempt(currentAttempt);
        }

        // Find the next workout to do in the package
        const nextWorkoutId = currentAttempt.workoutIds.find(id => !currentAttempt!.completedWorkouts.includes(id))
            || currentAttempt.workoutIds[0];

        const workoutData = allWorkouts.find(w => w.workoutId === nextWorkoutId || w.id === nextWorkoutId);

        if (timerContext && workoutData) {
            // Pass mainCardId and attemptId so the Timer and save flow can record the attempt
            timerContext.startTimerWithWorkoutSettings(
                workoutData.workoutId,
                workoutData.name,
                undefined,
                undefined,
                undefined,
                card.id,
                currentAttempt.id,
            );
        }
    };

    const packageWorkouts = useMemo(() => {
        return card.workoutIds.map(id => {
            const w = allWorkouts.find(aw => aw.workoutId === id || aw.id === id);
            return w;
        }).filter(Boolean);
    }, [card.workoutIds]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="chevron-left" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{card.primary}</Text>
                </View>

                <View style={styles.cardSection}>
                    <MainCardCardNew card={card} fullWidth={true} />
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PROGRAM PROGRESS</Text>
                        <Text style={styles.runsCompletedText}>
                            {state?.level || 0} / {card.requiredRuns} Runs
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${((state?.level || 0) / card.requiredRuns) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    {state && (Object.entries(state.gains) as [string, number][]).map(([key, val]) => (
                        <View key={key} style={styles.statBox}>
                            <View style={styles.statHeader}>
                                <Text style={styles.statLabel}>{key}</Text>
                                <Text style={styles.statValue}>{Math.round(val)}</Text>
                            </View>
                            <View style={styles.statBarBg}>
                                <View style={[styles.statBarFill, { width: `${Math.min(val, 100)}%` }]} />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.packageSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PACKAGE WORKOUTS</Text>
                        <Text style={styles.packageStatusText}>
                            {attempt?.completedWorkouts.length || 0} / {card.workoutIds.length} done
                        </Text>
                    </View>

                    {packageWorkouts.map((w: any, index: number) => {
                        const isCompleted = attempt?.completedWorkouts.includes(w.workoutId);
                        const SvgIcon = findExerciseIcon(w.name);

                        return (
                            <View key={w.workoutId} style={[styles.workoutRow, isCompleted && styles.workoutCompleted]}>
                                <View style={styles.workoutIconContainer}>
                                    <SvgIcon width={24} height={24} fill={isCompleted ? '#9DEC2C' : '#888'} />
                                </View>
                                <View style={styles.workoutInfo}>
                                    <Text style={[styles.workoutName, isCompleted && styles.textCompleted]}>{w.name}</Text>
                                    <Text style={styles.workoutCategory}>{w.muscleGroup}</Text>
                                </View>
                                {isCompleted && <Feather name="check-circle" size={20} color="#9DEC2C" />}
                            </View>
                        );
                    })}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStartProgram}
                >
                    <LinearGradient
                        colors={['#9DEC2C', '#7BB824']}
                        style={styles.startButtonGradient}
                    >
                        <Text style={styles.startButtonText}>
                            {attempt && !attempt.isCompleted ? 'CONTINUE PROGRAM' : 'START NEW RUN'}
                        </Text>
                        <Feather name="play" size={20} color="#000" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        marginLeft: 15,
    },
    cardSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    progressSection: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#888',
        letterSpacing: 1,
    },
    runsCompletedText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9DEC2C',
    },
    packageStatusText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9DEC2C',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#1C1C1E',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#9DEC2C',
    },
    statsGrid: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statBox: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
    },
    statBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    statBarFill: {
        height: '100%',
        backgroundColor: '#9DEC2C',
    },
    packageSection: {
        paddingHorizontal: 20,
    },
    workoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
    },
    workoutCompleted: {
        opacity: 0.8,
        borderColor: '#9DEC2C22',
        borderWidth: 1,
    },
    workoutIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    textCompleted: {
        color: '#9DEC2C',
    },
    workoutCategory: {
        fontSize: 12,
        color: '#888',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    startButton: {
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    startButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
        marginRight: 10,
    },
});
