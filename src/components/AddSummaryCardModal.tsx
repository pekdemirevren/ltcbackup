import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Modal,
    Animated,
    PanResponder,
    Easing,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';
import MetricColors from '../constants/MetricColors';
import LinearGradient from 'react-native-linear-gradient';
import { calculateCalories } from '../utils/CalorieCalculator';
import { allWorkouts, Workout } from '../constants/workoutData';
import { SUMMARY_CARD_STORAGE_KEY, DEFAULT_VISIBLE_CARDS } from '../constants/WorkoutConstants';
import { SessionsSquareCardStyle } from '../styles/sessionssquarecardstyle';
import { TrendsSquareCardStyle } from '../styles/trendssquarecardstyle';
import { WorkoutSquareCardStyle } from '../styles/workoutsquarecardstyle';
import { AddCardButtonStyle } from '../styles/AddCardButtonStyle';
import { SquareCardMeasurements } from '../styles/SquareCardBase';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddSummaryCardModalProps {
    visible: boolean;
    onClose: () => void;
    onCardAdded: () => void;
}

export default function AddSummaryCardModal({ visible, onClose, onCardAdded }: AddSummaryCardModalProps) {
    const [showDetailView, setShowDetailView] = useState(false);
    const [selectedCardIndex, setSelectedCardIndex] = useState(0);
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
    const [isSessionsMode, setIsSessionsMode] = useState(false);
    const [isWorkoutsMode, setIsWorkoutsMode] = useState(false);
    const [isTrendsMode, setIsTrendsMode] = useState(false);

    const [visibleCardIds, setVisibleCardIds] = useState<string[]>(DEFAULT_VISIBLE_CARDS);
    const visibleCards = visibleCardIds; // Alias for backward compatibility if needed, or better: fix usages.

    // Global/Today stats
    const [setCount, setSetCount] = useState(0);
    const [strengthLevel, setStrengthLevel] = useState(0);
    const [dailySetData, setDailySetData] = useState<number[]>(new Array(24).fill(0));
    const [dailyStrData, setDailyStrData] = useState<number[]>(new Array(24).fill(0));
    const [dailyCadence, setDailyCadence] = useState(0);
    const [cadenceChartData, setCadenceChartData] = useState<number[]>(new Array(24).fill(0));
    const [dailyIntensity, setDailyIntensity] = useState("0:1");
    const [intensityChartData, setIntensityChartData] = useState<number[]>(new Array(24).fill(0));
    const [dailyDensity, setDailyDensity] = useState(0);
    const [densityChartData, setDensityChartData] = useState<number[]>(new Array(24).fill(0));
    const [dailyEnergy, setDailyEnergy] = useState(0);
    const [dailyEnergyData, setDailyEnergyData] = useState<number[]>(new Array(24).fill(0));
    const [dailyEndurance, setDailyEndurance] = useState(0);
    const [dailyEnduranceData, setDailyEnduranceData] = useState<number[]>(new Array(24).fill(0));

    // Workout-specific stats mapping
    const [workoutStats, setWorkoutStats] = useState<{ [workoutId: string]: any }>({});
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [trendStats, setTrendStats] = useState({
        energy: 0,
        strength: 0,
        sets: 0,
        endurance: 0,
        consistency: 0,
        balance: 0,
        cadence: 0,
        density: 0,
        intensity: 0
    });

    const latestSession = recentSessions.length > 0 ? recentSessions[0] : null;

    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const scrollOffset = useRef(0);
    const scrollY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 10 && scrollOffset.current <= 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > SCREEN_HEIGHT / 4 || gestureState.vy > 0.5) {
                    handleClose();
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    const handleClose = () => {
        Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onClose();
            panY.setValue(SCREEN_HEIGHT);
            scrollOffset.current = 0;
            setShowDetailView(false);
        });
    };

    useEffect(() => {
        if (visible) {
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
            loadData();
        } else {
            panY.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const loadData = async () => {
        try {
            const storedSummaries = await AsyncStorage.getItem('workoutSummaries');
            const allSummaries = storedSummaries ? JSON.parse(storedSummaries) : [];

            const today = new Date().toDateString();


            const sortedSummaries = [...allSummaries].sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const recentWorkouts = sortedSummaries.slice(0, 3);
            setRecentSessions(recentWorkouts);

            const uniqueWorkoutIds = Array.from(new Set(allSummaries.map((s: any) => s.workoutId)));

            let gTotalSets = 0;
            let gTotalVolume = 0;
            let gTotalEnergy = 0;
            let gTotalEndurance = 0;
            const gSetsData = new Array(24).fill(0);
            const gStrData = new Array(24).fill(0);
            const gEnergyData = new Array(24).fill(0);
            const gEnduranceData = new Array(24).fill(0);

            const statsMap: any = {};

            uniqueWorkoutIds.forEach((wId: any) => {
                const wSummaries = allSummaries.filter((s: any) => s.workoutId === wId);

                let wTotalElapsed = 0;
                let wTotalReps = 0;

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                let wWeeklySets = 0;
                let wWeeklyVolume = 0;
                let wWeeklyActive = 0;
                let wWeeklyRest = 0;
                let wWeeklyElapsed = 0;
                let wWeeklyReps = 0;

                let wTodaySets = 0;
                let wTodayVolume = 0;
                let wTodayActive = 0;
                let wTodayRest = 0;
                let wTodayElapsed = 0;
                let wTodayReps = 0;

                const weeklySetsDataArr = new Array(7).fill(0);
                const weeklyStrDataArr = new Array(7).fill(0);
                const weeklyIntDataArr = new Array(7).fill(0);
                const weeklyCounts = new Array(7).fill(0);
                const weeklyCadDataArr = new Array(7).fill(0);
                const weeklyDenDataArr = new Array(7).fill(0);

                const getDayIndex = (date: Date) => {
                    const d = date.getDay(); // 0(S), 1(M), 2(T), 3(W), 4(T), 5(F), 6(S)
                    return d === 0 ? 6 : d - 1;
                };

                const cadData = new Array(24).fill(0);
                const setsData = new Array(24).fill(0);
                const strData = new Array(24).fill(0);
                const intData = new Array(24).fill(0);
                const denData = new Array(24).fill(0);
                const countsPerHour = new Array(24).fill(0);

                wSummaries.forEach((s: any) => {
                    const sDate = new Date(s.date);
                    const activeTime = s.greenLoopTimes ? s.greenLoopTimes.reduce((a: any, b: any) => a + b, 0) : (s.elapsedTime || 0);
                    const restTime = s.redLoopTimes ? s.redLoopTimes.reduce((a: any, b: any) => a + b, 0) : 0;
                    const weightVal = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
                    const sets = (s.completedSets || 0);
                    const reps = (s.completedReps || 0);
                    const vol = weightVal * sets * reps;
                    const cadence = reps > 0 ? (activeTime / reps) : 0;
                    const density = (s.elapsedTime || 0) > 0 ? (activeTime / s.elapsedTime) * 100 : 0;

                    if (sDate >= sevenDaysAgo) {
                        wWeeklySets += sets;
                        wWeeklyVolume += vol;
                        wWeeklyActive += activeTime;
                        wWeeklyRest += restTime;
                        wWeeklyReps += reps;
                        wWeeklyElapsed += (s.elapsedTime || 0);

                        const dayIdx = getDayIndex(sDate);
                        weeklySetsDataArr[dayIdx] += sets;
                        weeklyStrDataArr[dayIdx] += vol;
                        weeklyIntDataArr[dayIdx] += activeTime > 0 ? (restTime / activeTime) : 0;
                        weeklyCadDataArr[dayIdx] += cadence;
                        weeklyDenDataArr[dayIdx] += density;
                        weeklyCounts[dayIdx]++;
                    }

                    if (sDate.toDateString() === today) {
                        wTodaySets += sets;
                        wTodayVolume += vol;
                        wTodayActive += activeTime;
                        wTodayRest += restTime;
                        wTodayElapsed += (s.elapsedTime || 0);
                        wTodayReps += reps;

                        gTotalSets += sets;
                        gTotalVolume += vol;

                        const cals = calculateCalories(s.workoutId, s.elapsedTime, weightVal, s.completedReps || 0);
                        gTotalEnergy += cals;
                        gTotalEndurance += (s.elapsedTime || 0);

                        const h = sDate.getHours();
                        setsData[h] += sets;
                        strData[h] += vol;
                        gSetsData[h] += sets;
                        gStrData[h] += vol;
                        gEnergyData[h] += cals;
                        gEnduranceData[h] += (s.elapsedTime || 0);

                        cadData[h] += reps > 0 ? (activeTime / reps) : 0;
                        intData[h] += activeTime > 0 ? (restTime / activeTime) : 0;
                        denData[h] += (s.elapsedTime || 0) > 0 ? (activeTime / s.elapsedTime) * 100 : 0;
                        countsPerHour[h]++;
                    }
                });

                for (let i = 0; i < 24; i++) {
                    if (countsPerHour[i] > 0) {
                        cadData[i] = parseFloat((cadData[i] / countsPerHour[i]).toFixed(1));
                        intData[i] = parseFloat((intData[i] / countsPerHour[i]).toFixed(2));
                        denData[i] = Math.round(denData[i] / countsPerHour[i]);
                    }
                }

                for (let i = 0; i < 7; i++) {
                    if (weeklyCounts[i] > 0) {
                        weeklyCadDataArr[i] = parseFloat((weeklyCadDataArr[i] / weeklyCounts[i]).toFixed(1));
                        weeklyIntDataArr[i] = parseFloat((weeklyIntDataArr[i] / weeklyCounts[i]).toFixed(2));
                        weeklyDenDataArr[i] = Math.round(weeklyDenDataArr[i] / weeklyCounts[i]);
                    }
                }

                statsMap[wId] = {
                    sets: wTodaySets,
                    strength: Math.round(wTodayVolume / 1000),
                    cadence: wTodayReps > 0 ? parseFloat((wTodayActive / wTodayReps).toFixed(1)) : 0,
                    intensity: wTodayActive > 0 ? `${parseFloat((wTodayRest / wTodayActive).toFixed(1))}:1` : "0:1",
                    intensityValue: wTodayActive > 0 ? parseFloat((wTodayRest / wTodayActive).toFixed(2)) : 0,
                    density: wTodayElapsed > 0 ? Math.round((wTodayActive / wTodayElapsed) * 100) : 0,
                    balance: 100,
                    weeklySets: wWeeklySets,
                    weeklyStrength: Math.round(wWeeklyVolume / 1000),
                    weeklyIntensity: wWeeklyActive > 0 ? `${parseFloat((wWeeklyRest / wWeeklyActive).toFixed(1))}:1` : "0:1",
                    weeklyCadence: wWeeklyReps > 0 ? parseFloat((wWeeklyActive / wWeeklyReps).toFixed(1)) : 0,
                    weeklyDensity: wWeeklyElapsed > 0 ? Math.round((wWeeklyActive / wWeeklyElapsed) * 100) : 0,
                    charts: {
                        sets: setsData, // 24h
                        strength: strData, // 24h
                        cadence: cadData, // 24h
                        intensity: intData, // 24h
                        density: denData, // 24h
                        balance: new Array(24).fill(0).map(() => Math.floor(Math.random() * 100)),
                        weeklySets: weeklySetsDataArr, // 7d
                        weeklyStrength: weeklyStrDataArr.map(v => Math.round(v / 1000)), // 7d
                        weeklyIntensity: weeklyIntDataArr.map((v, i) => weeklyCounts[i] > 0 ? parseFloat((v / weeklyCounts[i]).toFixed(2)) : 0), // 7d
                        weeklyCadence: weeklyCadDataArr.map((v, i) => weeklyCounts[i] > 0 ? parseFloat((v / weeklyCounts[i]).toFixed(1)) : 0), // 7d
                        weeklyDensity: weeklyDenDataArr.map((v, i) => weeklyCounts[i] > 0 ? Math.round(v / weeklyCounts[i]) : 0), // 7d
                        weeklyBalance: new Array(7).fill(0).map(() => Math.floor(Math.random() * 100)) // 7d
                    }
                };
            });

            // --- TRENDS (LAST 7 DAYS) ---
            const sevenDaysAgoTrend = new Date();
            sevenDaysAgoTrend.setHours(0, 0, 0, 0);
            sevenDaysAgoTrend.setDate(sevenDaysAgoTrend.getDate() - 7);

            const recentDataTrend = allSummaries.filter((s: any) => new Date(s.date) >= sevenDaysAgoTrend);

            const groupedByDayTrend: { [key: string]: any } = {};
            recentDataTrend.forEach((item: any) => {
                const dayKey = new Date(item.date).toDateString();
                if (!groupedByDayTrend[dayKey]) {
                    groupedByDayTrend[dayKey] = { kcal: 0, volume: 0, sets: 0, duration: 0 };
                }
                const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;
                const kcal = calculateCalories(item.workoutId, item.elapsedTime, weightVal, item.completedReps);
                const volume = item.totalVolume || (weightVal * (item.completedSets || 0) * (item.completedReps || 0));

                groupedByDayTrend[dayKey].kcal += kcal;
                groupedByDayTrend[dayKey].volume += volume;
                groupedByDayTrend[dayKey].sets += (item.completedSets || 0);
                groupedByDayTrend[dayKey].duration += (item.elapsedTime || 0);
            });

            const uniqueDaysTrend = Object.keys(groupedByDayTrend).length || 1;
            const totalEnergyRecent = Object.values(groupedByDayTrend).reduce((a: number, b: any) => a + b.kcal, 0);
            const totalVolumeRecent = Object.values(groupedByDayTrend).reduce((a: number, b: any) => a + b.volume, 0);
            const totalSetsRecent = Object.values(groupedByDayTrend).reduce((a: number, b: any) => a + b.sets, 0);
            const totalDurationRecent = Object.values(groupedByDayTrend).reduce((a: number, b: any) => a + b.duration, 0);

            const consistencyTrend = Math.round((uniqueDaysTrend / 7) * 100);
            const metricsUsedTrend = [totalEnergyRecent > 0, totalVolumeRecent > 0, totalSetsRecent > 0, totalDurationRecent > 0].filter(Boolean).length;
            const balanceTrend = Math.round((metricsUsedTrend / 4) * 100);

            setTrendStats({
                energy: Math.round(totalEnergyRecent / uniqueDaysTrend),
                strength: Math.round(totalVolumeRecent / uniqueDaysTrend),
                sets: Math.round(totalSetsRecent / uniqueDaysTrend),
                endurance: Math.round((totalDurationRecent / uniqueDaysTrend) / 60),
                consistency: consistencyTrend,
                balance: balanceTrend,
                cadence: Math.round(totalSetsRecent / uniqueDaysTrend), // Reps/day approximation
                density: Math.round((totalDurationRecent / uniqueDaysTrend) / 60), // Active time/day
                intensity: Math.round((totalDurationRecent / uniqueDaysTrend) / 60) // Rest time approximation
            });

            setSetCount(gTotalSets);
            setStrengthLevel(Math.round(gTotalVolume / 1000));
            setDailyEnergy(gTotalEnergy);
            setDailyEndurance(Math.round(gTotalEndurance / 60)); // minutes
            setDailySetData(gSetsData); // 24h
            setDailyStrData(gStrData); // 24h
            setDailyEnergyData(gEnergyData); // 24h
            setDailyEnduranceData(gEnduranceData.map(v => Math.round(v / 60))); // 24h in minutes
            setWorkoutStats(statsMap);

            const visibleCardsStored = await AsyncStorage.getItem(SUMMARY_CARD_STORAGE_KEY);
            if (visibleCardsStored) {
                setVisibleCardIds(JSON.parse(visibleCardsStored));
            } else {
                setVisibleCardIds(DEFAULT_VISIBLE_CARDS);
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
    };

    const handleAddCard = async (cardId: string) => {
        try {
            const storedCards = await AsyncStorage.getItem(SUMMARY_CARD_STORAGE_KEY);
            const visibleCards = storedCards ? JSON.parse(storedCards) : DEFAULT_VISIBLE_CARDS;
            // Workout metric kartları zaten composite ID formatında geliyor (workoutId_metricId)
            // Sadece cardId zaten workoutId içermiyorsa composite ID oluştur
            let finalCardId = cardId;
            const isAlreadyComposite = cardId.includes('_') && allWorkouts.some(w => cardId.startsWith(w.workoutId + '_'));
            if (selectedWorkoutId && !cardId.startsWith('Workout_') && !isAlreadyComposite) {
                finalCardId = `${selectedWorkoutId}_${cardId}`;
            }
            if (!visibleCards.includes(finalCardId)) {
                const updatedCards = [...visibleCards, finalCardId];
                await AsyncStorage.setItem(SUMMARY_CARD_STORAGE_KEY, JSON.stringify(updatedCards));
                setVisibleCardIds(updatedCards);
            }
            onCardAdded();
            handleClose();
        } catch (error) {
            console.error('Error adding card:', error);
        }
    };

    const renderDetailView = () => {
        const stats = selectedWorkoutId ? workoutStats[selectedWorkoutId] : {
            sets: setCount, strength: strengthLevel, cadence: 0, intensity: "0:1", density: 0, balance: 100,
            charts: { sets: dailySetData, strength: dailyStrData, cadence: new Array(24).fill(0), intensity: new Array(24).fill(0), density: new Array(24).fill(0), balance: new Array(24).fill(0) }
        };

        const workout = selectedWorkoutId ? allWorkouts.find(w => w.workoutId === selectedWorkoutId) : null;
        const SvgIcon = workout?.SvgIcon;

        const isWorkout = !!selectedWorkoutId;
        const currentCard = carouselCards[selectedCardIndex % carouselCards.length];
        
        // currentCard undefined kontrolü
        if (!currentCard) {
            console.error('currentCard is undefined', { selectedCardIndex, carouselCardsLength: carouselCards.length });
            return null;
        }
        
        // Workout metric kartları için ID zaten composite formatta (workoutId_metricId)
        const isCurrentCardAlreadyComposite = currentCard.id.includes('_') && allWorkouts.some(w => currentCard.id.startsWith(w.workoutId + '_'));
        const compositeId = (isWorkout && !isCurrentCardAlreadyComposite) ? `${selectedWorkoutId}_${currentCard.id}` : currentCard.id;
        // Trends_Grid için hem 'Trends' hem 'Trends_Grid' kontrolü yap
        const isTrendsGridAlreadyAdded = currentCard.id === 'Trends_Grid' && (visibleCardIds.includes('Trends') || visibleCardIds.includes('Trends_Grid'));
        const isAlreadyAdded = isTrendsGridAlreadyAdded || visibleCardIds.includes(compositeId);

        return (
            <View style={[styles.contentContainer, { paddingTop: 74 }]}>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { alignItems: 'center', flexGrow: 1, paddingBottom: 25 }]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    scrollEnabled={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        {
                            useNativeDriver: false,
                            listener: (e: any) => {
                                scrollOffset.current = e.nativeEvent.contentOffset.y;
                            }
                        }
                    )}
                    scrollEventThrottle={16}
                >
                    <Text style={[styles.title, { marginTop: -103, marginBottom: 19 }]}>{currentCard.title}</Text>
                    <Text style={[styles.description, { marginTop: 0, marginBottom: 31 }]}>{currentCard.description}</Text>
                    <View style={{ height: 400, width: SCREEN_WIDTH, marginHorizontal: -20, marginTop: 25, overflow: 'visible' }}>
                        <ScrollView
                            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            alwaysBounceVertical={false}
                            bounces={false}
                            directionalLockEnabled={true}
                            removeClippedSubviews={false}
                            snapToInterval={SCREEN_WIDTH} snapToAlignment="center" decelerationRate="fast"
                            contentOffset={{ x: selectedCardIndex * SCREEN_WIDTH, y: 0 }}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                if (index !== selectedCardIndex) setSelectedCardIndex(index);
                            }}
                        >
                            {carouselCards.map((card, index) => {
                                const isSessionCard = card.id === 'Sessions_List' || card.id === 'Sessions_Square';
                                const isWorkoutGridCard = card.id === 'WorkoutShortcuts';
                                const isWorkoutMetricCard = card.isWorkoutMetric === true;
                                const isWorkoutCard = card.isWorkoutCard === true;

                                return (
                                    <View key={card.id} style={{ width: SCREEN_WIDTH, alignItems: 'center' }}>
                                        {isSessionCard ? (
                                            card.id === 'Sessions_Square' ? (
                                                recentSessions.length > 0 ? (() => {
                                                    const session = recentSessions[0];
                                                    const workout = allWorkouts.find(w => w.workoutId === session.workoutId);
                                                    const SvgIcon = workout?.SvgIcon;
                                                    const sessionDate = new Date(session.date);
                                                    const isToday = sessionDate.toDateString() === new Date().toDateString();
                                                    const dateLabel = isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
                                                    const weightVal = session.settings?.weight ? parseFloat(session.settings.weight) : 0;
                                                    const cals = calculateCalories(session.workoutId, session.elapsedTime, weightVal, session.completedReps);

                                                    return (
                                                        <View style={[SessionsSquareCardStyle.sessionSquareCard, { marginTop: SquareCardMeasurements.modal.carouselCardTop, paddingTop: SquareCardMeasurements.modal.carouselCardPaddingTop }]}>
                                                            <Text style={[SessionsSquareCardStyle.sessionSquareHeader, { marginLeft: 3 }]}>Sessions</Text>
                                                            <View style={[SessionsSquareCardStyle.sessionSquareIconRow, { marginLeft: 3 }]}>
                                                                <LinearGradient colors={['#122003', '#213705']} style={SessionsSquareCardStyle.sessionSquareIconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                                                    {SvgIcon && <SvgIcon width={28} height={28} fill="#9DEC2C" />}
                                                                </LinearGradient>
                                                            </View>
                                                            <Text style={[SessionsSquareCardStyle.sessionSquareWorkoutName, { marginLeft: 3 }]} numberOfLines={1}>{session.workoutName}</Text>
                                                            <Text style={[SessionsSquareCardStyle.sessionSquareMetric, { marginLeft: 3 }]}>
                                                                {cals}<Text style={SessionsSquareCardStyle.sessionSquareUnit}>KCAL</Text>
                                                            </Text>
                                                            <Text style={[SessionsSquareCardStyle.sessionSquareDate, { marginLeft: 3 }]}>{dateLabel}</Text>
                                                        </View>
                                                    );
                                                })() : (
                                                    <View style={[SessionsSquareCardStyle.sessionSquareCard, { marginTop: 98 }]}>
                                                        <Text style={SessionsSquareCardStyle.sessionSquareHeader}>Sessions</Text>
                                                        <View style={SessionsSquareCardStyle.sessionSquareIconRow}>
                                                            <View style={SessionsSquareCardStyle.sessionSquareIconCircle} />
                                                        </View>
                                                        <Text style={SessionsSquareCardStyle.sessionSquareWorkoutName}>No Sessions</Text>
                                                        <Text style={SessionsSquareCardStyle.sessionSquareMetric}>0<Text style={SessionsSquareCardStyle.sessionSquareUnit}>KCAL</Text></Text>
                                                        <Text style={SessionsSquareCardStyle.sessionSquareDate}>N/A</Text>
                                                    </View>
                                                )
                                            ) : (
                                                <View style={[styles.sessionsSection, { borderRadius: 16, width: SCREEN_WIDTH - 40, marginTop: 69 }]}>
                                                    <View style={styles.cardHeaderRow}>
                                                        <Text style={styles.cardTitle}>Sessions</Text>
                                                    </View>
                                                    {recentSessions.length > 0 ? (
                                                        recentSessions.slice(0, 3).map((session, sIdx) => {
                                                            const sessionDate = new Date(session.date);
                                                            const workout = allWorkouts.find(w => w.workoutId === session.workoutId);
                                                            const SvgIcon = workout?.SvgIcon;
                                                            const weightVal = session.settings?.weight ? parseFloat(session.settings.weight) : 0;
                                                            const cals = calculateCalories(session.workoutId, session.elapsedTime, weightVal, session.completedReps);

                                                            const isToday = sessionDate.toDateString() === new Date().toDateString();
                                                            const dateLabel = isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
                                                            // If older than a week, show date
                                                            const oneWeekAgo = new Date();
                                                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                                            const finalDateLabel = sessionDate < oneWeekAgo ? sessionDate.toLocaleDateString('de-DE') : dateLabel;

                                                            return (
                                                                <View key={sIdx} style={[styles.sessionItem, sIdx === 2 && { borderBottomWidth: 0 }]}>
                                                                    <LinearGradient colors={['#122003', '#213705']} style={styles.sessionIconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                                                        {SvgIcon && <SvgIcon width={39} height={39} fill="#9DEC2C" />}
                                                                    </LinearGradient>
                                                                    <View style={styles.sessionInfo}>
                                                                        <Text style={styles.sessionWorkoutName}>{session.workoutName}</Text>
                                                                        <Text style={styles.sessionMetric}>{cals}<Text style={styles.sessionUnit}>KCAL</Text></Text>
                                                                    </View>
                                                                    <Text style={styles.sessionDateLabel}>{finalDateLabel}</Text>
                                                                </View>
                                                            );
                                                        })
                                                    ) : (
                                                        <Text style={styles.emptyText}>No recent sessions</Text>
                                                    )}
                                                </View>
                                            )
                                        ) : isWorkoutGridCard ? (
                                            <View style={[styles.sectionCard, { paddingHorizontal: 0, paddingBottom: 8, paddingTop: 8, backgroundColor: '#2A292A', borderRadius: 24, width: SCREEN_WIDTH - 40, height: SquareCardMeasurements.modal.carouselListHeight, justifyContent: 'center', marginTop: SquareCardMeasurements.modal.carouselListTop }]}>
                                                <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 0, marginBottom: 12, fontSize: 17 }]}>Workout</Text>
                                                <View style={[styles.workoutGrid, { paddingHorizontal: 8, gap: 8 }]}>
                                                    {allWorkouts.slice(0, 4).map((workout: Workout, wIdx: number) => (
                                                        <View
                                                            key={wIdx}
                                                            style={[styles.workoutShortcutCard, { width: (SCREEN_WIDTH - 40 - 16 - 8) / 2 }]}
                                                        >
                                                            {workout.SvgIcon && <workout.SvgIcon width={34} height={34} fill="#9DEC2C" style={{ marginBottom: 2 }} />}
                                                            <Text style={styles.shortcutName} numberOfLines={1}>{workout.name}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        ) : isWorkoutMetricCard ? (() => {
                                            // Tekli grafikli Workout kartı: 3'lü griddeki en öndeki kartın stili
                                            const SvgIcon = card.SvgIcon;
                                            const isActive = index === selectedCardIndex;
                                            const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                                            const chartData = card.chart || new Array(7).fill(0);
                                            const maxVal = Math.max(...chartData, 1);

                                            return (
                                                <View style={[styles.workoutCardFront, {
                                                    marginTop: SquareCardMeasurements.modal.carouselCardTop,
                                                    position: 'relative',
                                                    left: 0,
                                                    opacity: isActive ? 1 : 0.7,
                                                    transform: isActive ? [] : [{ scale: 0.95 }]
                                                }]}>
                                                    {/* Header: Icon + Workout Name */}
                                                    <View style={[styles.cardHeaderRow, { gap: 6 }]}>
                                                        {SvgIcon && <SvgIcon width={25} height={25} fill="#FFF" />}
                                                        <Text style={styles.workoutCardTitle} numberOfLines={1}>{card.workoutName}</Text>
                                                    </View>
                                                    {/* Metric Label */}
                                                    <Text style={styles.workoutSubLabel}>{card.metricTitle}</Text>
                                                    {/* Metric Value */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -6 }}>
                                                        <Text style={[styles.workoutMetricValue, { color: card.color }]}>{card.value}</Text>
                                                        <Text style={[styles.workoutUnit, { color: card.color }]}>{card.unit}</Text>
                                                    </View>
                                                    {/* Weekly Chart with Day Labels */}
                                                    <View style={styles.workoutChartContainer}>
                                                        {chartData.slice(0, 7).map((val: number, i: number) => {
                                                            const barHeight = maxVal > 0 ? (val / maxVal) * 30 : 0;
                                                            return (
                                                                <React.Fragment key={i}>
                                                                    {i === 0 && (
                                                                        <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                                                    )}
                                                                    <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
                                                                        <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: card.color, borderRadius: 3 }]} />
                                                                        <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>
                                                                    </View>
                                                                    <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </View>
                                                    {/* Today Footer */}
                                                    <Text style={styles.workoutTodayFooter}>
                                                        <Text style={{ color: '#FFF' }}>Today: </Text>
                                                        <Text style={{ color: card.color }}>{card.todayValue}{card.unit}</Text>
                                                    </Text>
                                                </View>
                                            );
                                        })() : card.id === 'Trends_Grid' ? (
                                            <View style={[styles.card, { width: SCREEN_WIDTH - 40, backgroundColor: '#2A292A', borderRadius: 24, paddingTop: 12, paddingBottom: 2, paddingHorizontal: 16, marginTop: SquareCardMeasurements.modal.carouselListTop }]}>
                                                <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFF', marginBottom: 8 }}>Trends</Text>
                                                <View style={[styles.trendGrid, { marginTop: 8 }]}>
                                                    {[{ label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy },
                                                    { label: 'Strength', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight },
                                                    { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets },
                                                    { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE' }].map((t, idx) => (
                                                        <View key={idx} style={[styles.trendItem, { marginBottom: 10 }]}>
                                                            <TrendGridIconAnimated color={t.color} isActive={selectedCardIndex === 0} />
                                                            <View><Text style={styles.trendLabel}>{t.label}</Text><Text style={[styles.trendValue, { color: t.color }]}>{t.val} {t.unit}</Text></View>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        ) : card.id.startsWith('Trends_') ? (
                                            <TrendSquareCardAnimated card={card} isActive={index === selectedCardIndex} />
                                        ) : isWorkoutCard ? (() => {
                                            // Tek workout kartı (24 adet) - WorkoutSquareCardStyle kullanır
                                            const SvgIcon = card.SvgIcon;
                                            const isActive = index === selectedCardIndex;
                                            return (
                                                <View style={[WorkoutSquareCardStyle.workoutSquareCard, { 
                                                    marginTop: SquareCardMeasurements.modal.carouselCardTop,
                                                    opacity: isActive ? 1 : 0.7,
                                                    transform: isActive ? [] : [{ scale: 0.95 }]
                                                }]}>
                                                    <Text style={[WorkoutSquareCardStyle.workoutSquareHeader, { transform: [{ translateY: 5 }] }]}>Workout</Text>
                                                    <View style={WorkoutSquareCardStyle.workoutSquareIconContainer}>
                                                        <View style={{ justifyContent: 'flex-start' }}>
                                                            <View style={WorkoutSquareCardStyle.workoutSquareIconWrapper}>
                                                                {SvgIcon && <SvgIcon width={63} height={63} fill="#9DEC2C" />}
                                                            </View>
                                                            <Text style={WorkoutSquareCardStyle.workoutSquareName} numberOfLines={1}>{card.title}</Text>
                                                            <View style={WorkoutSquareCardStyle.workoutSquareActionRow}>
                                                                <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />
                                                                <Text style={WorkoutSquareCardStyle.workoutSquareActionText}>Start Workout</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })() : (
                                            <View style={[styles.halfCard, { height: 176, paddingTop: 12, paddingBottom: 8, position: 'relative', marginTop: SquareCardMeasurements.modal.carouselCardTop, left: 0 }]}>
                                                <View style={[styles.cardHeaderRow, { paddingRight: 8 }]}>
                                                    <Text style={[styles.cardTitle, { fontSize: 17, textTransform: 'none', marginBottom: 0, flex: 1 }]}>{card.title}</Text>
                                                </View>
                                                <View style={{ marginTop: 9 }}>
                                                    <Text style={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 4, textTransform: 'none' }]}>Today</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -4 }}>
                                                        <Text style={[styles.metricValue, { color: card.color, fontSize: 30, fontWeight: '700' }]}>
                                                            {card.value}{' '}
                                                            <Text style={[styles.unit, { fontSize: 20, fontWeight: '700' }]}>{card.unit}</Text>
                                                        </Text>
                                                    </View>
                                                    <View style={[styles.barChartContainer, { marginTop: -2 }]}>
                                                        {(card.chart || []).map((val: number, i: number) => {
                                                            const isStrength = card.id === 'StrengthLevel';
                                                            const chartData = card.chart || [];
                                                            const computedVal = isStrength ? val / 1000 : val;
                                                            const maxVal = Math.max(...chartData.map((v: number) => isStrength ? v / 1000 : v), 1);
                                                            const barHeight = (computedVal / maxVal) * (70 * 0.8);
                                                            return (
                                                                <View key={i} style={{ width: 3, height: 70, justifyContent: 'flex-end' }}>
                                                                    <View style={[styles.bar, { height: 70, backgroundColor: '#4A4A4C', position: 'absolute', bottom: 0 }]} />
                                                                    {val > 0 && <View style={[styles.bar, { height: Math.max(barHeight, 4), backgroundColor: card.color }]} />}
                                                                </View>
                                                            );
                                                        })}
                                                        <View style={[styles.chartLabelsOverlay, { justifyContent: 'space-between', paddingHorizontal: 0 }]}>
                                                            <Text style={styles.chartLabelText}>00</Text>
                                                            <Text style={styles.chartLabelText}>06</Text>
                                                            <Text style={styles.chartLabelText}>12</Text>
                                                            <Text style={styles.chartLabelText}>18</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                        {isAlreadyAdded && index === (selectedCardIndex % carouselCards.length) && (
                                            <Text style={{ color: '#8E8E93', fontSize: 13, textAlign: 'center', marginTop: 25 }}>Previously Added</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>


                    </View>

                    <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', paddingBottom: 0 }}>
                        <View style={[styles.paginationContainer, { marginBottom: 19, marginTop: 45, gap: 10 }]}>
                            {carouselCards.map((_, index) => (
                                <View key={index} style={[styles.paginationDot, { width: 7, height: 7, borderRadius: 3.5, backgroundColor: index === (selectedCardIndex % carouselCards.length) ? '#FFF' : '#3A3A3C' }]} />
                            ))}
                        </View>
                        <TouchableOpacity
                            style={isAlreadyAdded ? AddCardButtonStyle.addButtonPassive : AddCardButtonStyle.addButton}
                            onPress={() => !isAlreadyAdded && handleAddCard(currentCard.id)}
                            disabled={isAlreadyAdded}
                            activeOpacity={1}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                {isAlreadyAdded ? (
                                    <View style={{ width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#606166', justifyContent: 'center', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="plus" size={12.5} color="#2A292A" />
                                    </View>
                                ) : (
                                    <View style={{ width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' }}>
                                        <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                                            <Path d="M6 1V11M1 6H11" stroke="#9DEC2C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </Svg>
                                    </View>
                                )}
                                <Text style={isAlreadyAdded ? AddCardButtonStyle.addButtonTextPassive : AddCardButtonStyle.addButtonText}>Add Card</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderMainView = () => {
        return (
            <View style={styles.contentContainer}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        {
                            useNativeDriver: false,
                            listener: (e: any) => {
                                scrollOffset.current = e.nativeEvent.contentOffset.y;
                            }
                        }
                    )}
                    scrollEventThrottle={16}
                >
                    <View>
                        <Text style={[styles.title, { marginTop: 0, marginBottom: 8 }]}>Add a Card to{"\n"}Your Summary</Text>
                            {/* Top Stack: Set Count & Strength Level (2 cards) */}
                            <View style={[styles.cardsStack, { marginTop: 0 }]}> 
                                {/* Strength Level Card - Back */}
                                <TouchableOpacity
                                    style={styles.cardBack}
                                    onPress={() => { setIsSessionsMode(false); setIsTrendsMode(false); setIsWorkoutsMode(false); setSelectedWorkoutId(null); setSelectedCardIndex(1); setShowDetailView(true); }}
                                    activeOpacity={1}
                                >
                                    <View style={[styles.cardHeaderRow, { paddingRight: 8 }]}> 
                                        <Text style={[styles.cardTitle, { fontSize: 17, textTransform: 'none', marginBottom: 0, flex: 1 }]}>Strength Level</Text>
                                    </View>
                                    <View style={{ marginTop: 9 }}>
                                        <Text style={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 4, textTransform: 'none' }]}>Today</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -4 }}>
                                            <Text style={[styles.metricValue, { color: MetricColors.weight, fontSize: 30, fontWeight: '700' }]}> 
                                                {strengthLevel}{' '}
                                                <Text style={[styles.unit, { fontSize: 20, fontWeight: '700' }]}>KG</Text>
                                            </Text>
                                        </View>
                                        <View style={[styles.barChartContainer, { marginTop: -2 }]}> 
                                            {dailyStrData.map((val, i) => {
                                                const max = Math.max(...dailyStrData.map(v => v), 1);
                                                return (
                                                    <View key={i} style={{ width: 3, height: 70, justifyContent: 'flex-end' }}>
                                                        <View style={[styles.bar, { height: 70, backgroundColor: '#4A4A4C', position: 'absolute', bottom: 0 }]} />
                                                        {val > 0 && <View style={[styles.bar, { height: Math.max((val / max) * (70 * 0.8), 4), backgroundColor: MetricColors.weight }]} />}
                                                    </View>
                                                );
                                            })}
                                            <View style={[styles.chartLabelsOverlay, { justifyContent: 'space-between', paddingHorizontal: 0 }]}> 
                                                <Text style={styles.chartLabelText}>00</Text>
                                                <Text style={styles.chartLabelText}>06</Text>
                                                <Text style={styles.chartLabelText}>12</Text>
                                                <Text style={styles.chartLabelText}>18</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                {/* Set Count Card - Front */}
                                <TouchableOpacity
                                    style={styles.cardFront}
                                    onPress={() => { setIsSessionsMode(false); setIsTrendsMode(false); setIsWorkoutsMode(false); setSelectedWorkoutId(null); setSelectedCardIndex(0); setShowDetailView(true); }}
                                    activeOpacity={1}
                                >
                                    <View style={[styles.cardHeaderRow, { paddingRight: 8 }]}> 
                                        <Text style={[styles.cardTitle, { fontSize: 17, textTransform: 'none', marginBottom: 0, flex: 1 }]}>Set Count</Text>
                                    </View>
                                    <View style={{ marginTop: 9 }}>
                                        <Text style={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 4, textTransform: 'none' }]}>Today</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -4 }}>
                                            <Text style={[styles.metricValue, { color: MetricColors.sets, fontSize: 30, fontWeight: '700' }]}> 
                                                {setCount}{' '}
                                                <Text style={[styles.unit, { fontSize: 20, fontWeight: '700' }]}>SET</Text>
                                            </Text>
                                        </View>
                                        <View style={[styles.barChartContainer, { marginTop: -2 }]}> 
                                            {dailySetData.map((val, i) => {
                                                const max = Math.max(...dailySetData, 1);
                                                return (
                                                    <View key={i} style={{ width: 3, height: 70, justifyContent: 'flex-end' }}>
                                                        <View style={[styles.bar, { height: 70, backgroundColor: '#4A4A4C', position: 'absolute', bottom: 0 }]} />
                                                        {val > 0 && <View style={[styles.bar, { height: Math.max((val / max) * (70 * 0.8), 4), backgroundColor: '#FF4D7D' }]} />}
                                                    </View>
                                                );
                                            })}
                                            <View style={[styles.chartLabelsOverlay, { justifyContent: 'space-between', paddingHorizontal: 0 }]}> 
                                                <Text style={styles.chartLabelText}>00</Text>
                                                <Text style={styles.chartLabelText}>06</Text>
                                                <Text style={styles.chartLabelText}>12</Text>
                                                <Text style={styles.chartLabelText}>18</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.description, { fontSize: 13, marginTop: 10, marginBottom: 0 }]}>A quick glance at your total set count and strength volume for the day.</Text>
                            <View style={[styles.sectionSeparator, { marginTop: 30, marginBottom: 30 }]} />
                            
                            {/* Sessions Section */}
                            <TouchableOpacity
                                style={[styles.sessionsSection, { width: '100%', borderRadius: 16, paddingTop: 12, paddingBottom: 2, paddingHorizontal: 16, marginBottom: 0 }]}
                                activeOpacity={1}
                                onPress={() => {
                                    setIsSessionsMode(true);
                                    setIsWorkoutsMode(false);
                                    setIsTrendsMode(false);
                                    setSelectedWorkoutId(null);
                                    setSelectedCardIndex(0);
                                    setShowDetailView(true);
                                }}
                            >
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardTitle}>Sessions</Text>
                                </View>
                                {recentSessions.length > 0 ? (
                                    recentSessions.slice(0, 3).map((session: any, idx: number) => {
                                        const sessionDate = new Date(session.date);
                                        const workout = allWorkouts.find(w => w.workoutId === session.workoutId);
                                        const SvgIcon = workout?.SvgIcon;
                                        const weightVal = session.settings?.weight ? parseFloat(session.settings.weight) : 0;
                                        const cals = calculateCalories(session.workoutId, session.elapsedTime, weightVal, session.completedReps);
                                        
                                        const isToday = sessionDate.toDateString() === new Date().toDateString();
                                        const dateLabel = isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
                                        const oneWeekAgo = new Date();
                                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                        const finalDateLabel = sessionDate < oneWeekAgo ? sessionDate.toLocaleDateString('de-DE') : dateLabel;
                                        
                                        return (
                                            <View key={idx} style={[styles.sessionItem, { borderBottomWidth: idx < recentSessions.length - 1 ? 1 : 0, paddingVertical: 12 }]}>
                                                <LinearGradient colors={['#122003', '#213705']} style={styles.sessionIconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                                    {SvgIcon && <SvgIcon width={39} height={39} fill="#9DEC2C" />}
                                                </LinearGradient>
                                                <View style={styles.sessionInfo}>
                                                    <Text style={styles.sessionWorkoutName}>{session.workoutName}</Text>
                                                    <Text style={styles.sessionMetric}>{cals}<Text style={styles.sessionUnit}>KCAL</Text></Text>
                                                </View>
                                                <Text style={styles.sessionDateLabel}>{finalDateLabel}</Text>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.emptyText}>No recent sessions</Text>
                                )}
                            </TouchableOpacity>
                            <Text style={[styles.description, { fontSize: 13, marginTop: 10, marginBottom: 0 }]}>View your most recent workout sessions.</Text>

                            <View style={[styles.sectionSeparator, { marginTop: 30, marginBottom: 30 }]} />
                            
                            {/* Trends Section */}
                            <TouchableOpacity
                                style={[styles.card, { width: '100%', backgroundColor: '#2A292A', borderRadius: 24, paddingTop: 16, paddingBottom: 6, paddingHorizontal: 20, marginBottom: 0 }]}
                                activeOpacity={1}
                                onPress={() => {
                                    setIsSessionsMode(false);
                                    setIsWorkoutsMode(false);
                                    setIsTrendsMode(true);
                                    setSelectedWorkoutId(null);
                                    setSelectedCardIndex(0);
                                    setShowDetailView(true);
                        }}
                    >
                        <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFF', marginBottom: 8 }}>Trends</Text>
                        <View style={[styles.trendGrid, { marginTop: 0 }]}>
                            {[{ label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy },
                            { label: 'Strength', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight },
                            { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets },
                            { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE' }].map((t, idx) => (
                                <View key={idx} style={[styles.trendItem, { marginBottom: 10 }]}>
                                    <View style={styles.trendIconDown}><Feather name="chevron-down" size={38} color={t.color} /></View>
                                    <View><Text style={styles.trendLabel}>{t.label}</Text><Text style={[styles.trendValue, { color: t.color }]}>{t.val} {t.unit}</Text></View>
                                </View>
                            ))}
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.description, { fontSize: 13, marginTop: 10, marginBottom: 0 }]}>Monitor your weekly averages for energy, strength, and consistency.</Text>

                    <View style={[styles.sectionSeparator, { marginTop: 30, marginBottom: 30 }]} />

                    <TouchableOpacity
                        style={[styles.sectionCard, { paddingHorizontal: 0, paddingBottom: 8, paddingTop: 8, backgroundColor: '#2A292A' }]}
                        activeOpacity={1}
                        onPress={() => {
                            setIsSessionsMode(false);
                            setIsWorkoutsMode(true);
                            setIsTrendsMode(false); // Reset Trends mode
                            setSelectedWorkoutId(null);
                            setSelectedCardIndex(0); // WorkoutShortcuts (Grid) is at index 0 in workouts mode
                            setShowDetailView(true);
                        }}
                    >
                        <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 4, marginBottom: 12, fontSize: 17 }]}>Workout</Text>
                        <View style={[styles.workoutGrid, { paddingHorizontal: 8, gap: 8 }]}>
                            {allWorkouts.slice(0, 4).map((workout: Workout, index: number) => (
                                <View
                                    key={index}
                                    style={[styles.workoutShortcutCard, { width: (SCREEN_WIDTH - 40 - 16 - 8) / 2 }]}
                                >
                                    {workout.SvgIcon && <workout.SvgIcon width={34} height={34} fill="#9DEC2C" style={{ marginBottom: 2 }} />}
                                    <Text style={styles.shortcutName} numberOfLines={1}>{workout.name}</Text>
                                </View>
                            ))}
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.footerText, { marginTop: 10, marginBottom: 0 }]}>Add your favorite workout shortcuts back to your summary.</Text>

                    {/* All Workouts - 3 metric stack for each */}
                    {allWorkouts.map((workout, workoutIdx) => {
                        const stats = workoutStats[workout.workoutId] || {
                            strength: 0,
                            sets: 0,
                            intensityValue: 0,
                            weeklySets: 0,
                            weeklyStrength: 0,
                            weeklyIntensity: '0:1',
                            intensity: '0:1',
                            charts: { 
                                weeklyStrength: new Array(7).fill(0), 
                                weeklySets: new Array(7).fill(0), 
                                weeklyIntensity: new Array(7).fill(0) 
                            }
                        };
                        const SvgIcon = workout.SvgIcon;

                        const metrics = [
                            { id: 'Intensity', title: workout.name, value: stats.weeklyIntensity || '0:1', unit: '', color: MetricColors.energy, chart: stats.charts?.weeklyIntensity || [0, 0, 0, 0, 0, 0, 0], label: 'Weekly Intensity', todayVal: stats.intensity || '0:1' },
                            { id: 'SetCount', title: workout.name, value: stats.weeklySets || '0', unit: 'SET', color: MetricColors.sets, chart: stats.charts?.weeklySets || [0, 0, 0, 0, 0, 0, 0], label: 'Weekly Set Count', todayVal: stats.sets || '0' },
                            { id: 'StrengthLevel', title: workout.name, value: stats.weeklyStrength || '0', unit: 'KG', color: MetricColors.weight, chart: stats.charts?.weeklyStrength || [0, 0, 0, 0, 0, 0, 0], label: 'Weekly Strength', todayVal: stats.strength || '0' },
                        ];

                        return (
                            <React.Fragment key={workout.workoutId}>
                                <View style={[styles.sectionSeparator, { marginTop: 30, marginBottom: 30 }]} />
                                <View style={styles.workoutStack}>
                                    {metrics.map((m, idx) => {
                                        const order = idx;
                                        const stackStyle = order === 0 ? styles.workoutCardFarBack : order === 1 ? styles.workoutCardBack : styles.workoutCardFront;
                                        return (
                                            <TouchableOpacity
                                                key={`${workout.workoutId}_${m.id}`}
                                                style={[styles.halfCard, stackStyle]}
                                                onPress={() => {
                                                    setIsSessionsMode(false);
                                                    setIsTrendsMode(false);
                                                    setIsWorkoutsMode(true);
                                                    setSelectedWorkoutId(workout.workoutId);
                                                    // Tıklanan metriğe göre carousel index'ini ayarla
                                                    const metricIndexMap: { [key: string]: number } = {
                                                        'Intensity': 0,
                                                        'SetCount': 1,
                                                        'StrengthLevel': 2,
                                                        'Cadence': 3,
                                                        'Density': 4,
                                                        'Consistency': 5,
                                                        'Endurance': 6,
                                                        'Balance': 7,
                                                        'Energy': 8
                                                    };
                                                    setSelectedCardIndex(metricIndexMap[m.id] || 0);
                                                    setShowDetailView(true);
                                                }}
                                                activeOpacity={1}
                                            >
                                                {/* Header: Icon + Workout Name */}
                                                <View style={[styles.cardHeaderRow, { gap: 6, marginLeft: SquareCardMeasurements.workout.headerMarginLeft }]}> 
                                                    {SvgIcon && <SvgIcon width={25} height={25} fill="#FFF" />}
                                                    <Text style={styles.workoutCardTitle} numberOfLines={1}>{m.title}</Text>
                                                </View>
                                                {/* Metric Label */}
                                                <Text style={styles.workoutSubLabel}>{m.label}</Text>
                                                {/* Metric Value */}
                                                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -6 }}>
                                                    <Text style={[styles.workoutMetricValue, { color: m.color }]}>{m.value}</Text>
                                                    <Text style={[styles.workoutUnit, { color: m.color }]}>{m.unit}</Text>
                                                </View>
                                                {/* Weekly Chart with Day Labels */}
                                                <View style={styles.workoutChartContainer}>
                                                    {(m.chart || [0, 0, 0, 0, 0, 0, 0]).map((val: number, i: number) => {
                                                        const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                                                        const maxVal = Math.max(...(m.chart || [1])) || 1;
                                                        const barHeight = (val / maxVal) * 30;
                                                        return (
                                                            <React.Fragment key={i}>
                                                                {i === 0 && (
                                                                    <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                                                )}
                                                                <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
                                                                    <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: m.color, borderRadius: 3 }]} />
                                                                    <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>
                                                                </View>
                                                                <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </View>
                                                {/* Today Footer */}
                                                <Text style={styles.workoutTodayFooter}>
                                                    <Text style={{ color: '#FFF' }}>Today: </Text>
                                                    <Text style={{ color: m.color }}>{m.todayVal} {m.unit}</Text>
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <Text style={[styles.description, { fontSize: 13, marginTop: 10, marginBottom: 0 }]}>Track {workout.name} metrics and performance.</Text>
                            </React.Fragment>
                        );
                    })}


                    <View style={[styles.sectionSeparator, { marginVertical: 8 }]} />
                        </View>
                </ScrollView>
            </View>
        );
    };

    const isWorkoutDetailFlag = !!selectedWorkoutId;
    const statsDetail = selectedWorkoutId ? workoutStats[selectedWorkoutId] : {
        sets: setCount, strength: strengthLevel, cadence: 0, intensity: "0:1", density: 0, balance: 100, energy: dailyEnergy, endurance: dailyEndurance,
        charts: { sets: dailySetData, strength: dailyStrData, cadence: new Array(24).fill(0), intensity: new Array(24).fill(0), density: new Array(24).fill(0), balance: new Array(24).fill(0), energy: dailyEnergyData, endurance: dailyEnduranceData }
    };
    const workoutDetail = selectedWorkoutId ? allWorkouts.find(w => w.workoutId === selectedWorkoutId) : null;

    let carouselCards: any[] = [];
    if (isSessionsMode) {
        carouselCards = [
            { id: 'Sessions_List', title: 'Sessions', description: 'See all your workouts, meditations, and dives.', color: MetricColors.energy },
            { id: 'Sessions_Square', title: 'Sessions', description: 'See all your workouts, meditations, and dives.', color: MetricColors.energy }
        ];
    } else if (isTrendsMode) {
        carouselCards = [
            { id: 'Trends_Grid', title: 'Trends', description: 'Monitor your weekly averages for energy, strength, and consistency.', color: MetricColors.energy },
            { id: 'Trends_Energy', title: 'Energy', description: 'Track your average daily energy from your workouts.', color: MetricColors.energy, value: trendStats.energy.toString(), unit: 'KCAL/DAY' },
            { id: 'Trends_Strength', title: 'Strength', description: 'Track your average daily weight from your workouts.', color: MetricColors.weight, value: trendStats.strength.toString(), unit: 'KG/DAY' },
            { id: 'Trends_Sets', title: 'Sets', description: 'Track your average daily sets from your workouts.', color: MetricColors.sets, value: trendStats.sets.toString(), unit: 'SETS/DAY' },
            { id: 'Trends_Consistency', title: 'Consistency', description: 'Track your workout consistency and frequency.', color: '#00C7BE', value: trendStats.consistency.toString(), unit: '%' },
            { id: 'Trends_Cadence', title: 'Cadence', description: 'Track your average daily reps from your workouts.', color: MetricColors.speed, value: trendStats.cadence.toString(), unit: 'REPS/DAY' },
            { id: 'Trends_Density', title: 'Density', description: 'Track your average active time from your workouts.', color: '#9DEC2C', value: trendStats.density.toString(), unit: 'MIN/DAY' },
            { id: 'Trends_Intensity', title: 'Intensity', description: 'Track your average rest time from your workouts.', color: MetricColors.energy, value: trendStats.intensity.toString(), unit: 'MIN/DAY' },
            { id: 'Trends_Endurance', title: 'Endurance', description: 'Track your average workout duration from your workouts.', color: MetricColors.duration, value: trendStats.endurance.toString(), unit: 'MIN/DAY' },
            { id: 'Trends_Balance', title: 'Balance', description: 'Track your workout variety score from your workouts.', color: '#D1A3FF', value: trendStats.balance.toString(), unit: '%' }
        ];
    } else if (isWorkoutsMode) {
        // Eğer bir workout seçiliyse sadece o workout'un 9 metriğini göster
        if (selectedWorkoutId) {
            const workout = allWorkouts.find(w => w.workoutId === selectedWorkoutId);
            if (workout) {
                const stats = workoutStats[workout.workoutId] || {
                    weeklySets: 0,
                    weeklyStrength: 0,
                    weeklyCadence: 0,
                    weeklyDensity: 0,
                    weeklyIntensity: '0:1',
                    weeklyConsistency: 0,
                    weeklyEndurance: 0,
                    weeklyBalance: 0,
                    weeklyEnergy: 0,
                    sets: 0,
                    strength: 0,
                    cadence: 0,
                    density: 0,
                    intensity: '0:1',
                    consistency: 0,
                    endurance: 0,
                    balance: 0,
                    energy: 0,
                    charts: {
                        weeklySets: new Array(7).fill(0),
                        weeklyStrength: new Array(7).fill(0),
                        weeklyCadence: new Array(7).fill(0),
                        weeklyDensity: new Array(7).fill(0),
                        weeklyIntensity: new Array(7).fill(0),
                        weeklyConsistency: new Array(7).fill(0),
                        weeklyEndurance: new Array(7).fill(0),
                        weeklyBalance: new Array(7).fill(0),
                        weeklyEnergy: new Array(7).fill(0),
                    }
                };
                
                carouselCards = [
                    { id: `${workout.workoutId}_SetCount`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Sets', metricId: 'SetCount', title: workout.name, description: `Track your weekly set count for ${workout.name}.`, color: MetricColors.sets, unit: 'SET', value: stats.weeklySets?.toString() || '0', todayValue: stats.sets?.toString() || '0', chart: stats.charts?.weeklySets || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_StrengthLevel`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Strength', metricId: 'StrengthLevel', title: workout.name, description: `Track your weekly strength volume for ${workout.name}.`, color: MetricColors.weight, unit: 'KG', value: stats.weeklyStrength?.toString() || '0', todayValue: stats.strength?.toString() || '0', chart: stats.charts?.weeklyStrength || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Cadence`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Cadence', metricId: 'Cadence', title: workout.name, description: `Track your weekly cadence for ${workout.name}.`, color: MetricColors.speed, unit: 's/r', value: stats.weeklyCadence?.toString() || '0', todayValue: stats.cadence?.toString() || '0', chart: stats.charts?.weeklyCadence || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Density`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Density', metricId: 'Density', title: workout.name, description: `Track your weekly workout density for ${workout.name}.`, color: '#9DEC2C', unit: '%', value: stats.weeklyDensity?.toString() || '0', todayValue: stats.density?.toString() || '0', chart: stats.charts?.weeklyDensity || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Intensity`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Intensity', metricId: 'Intensity', title: workout.name, description: `Track your weekly intensity for ${workout.name}.`, color: MetricColors.energy, unit: '', value: stats.weeklyIntensity?.toString() || '0:1', todayValue: stats.intensity?.toString() || '0:1', chart: stats.charts?.weeklyIntensity || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Consistency`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Consistency', metricId: 'Consistency', title: workout.name, description: `Track your weekly consistency for ${workout.name}.`, color: '#00C7BE', unit: '%', value: stats.weeklyConsistency?.toString() || '0', todayValue: stats.consistency?.toString() || '0', chart: stats.charts?.weeklyConsistency || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Endurance`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Endurance', metricId: 'Endurance', title: workout.name, description: `Track your weekly endurance for ${workout.name}.`, color: MetricColors.duration, unit: 'MIN', value: stats.weeklyEndurance?.toString() || '0', todayValue: stats.endurance?.toString() || '0', chart: stats.charts?.weeklyEndurance || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Balance`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Balance', metricId: 'Balance', title: workout.name, description: `Track your weekly balance for ${workout.name}.`, color: '#D1A3FF', unit: '%', value: stats.weeklyBalance?.toString() || '0', todayValue: stats.balance?.toString() || '0', chart: stats.charts?.weeklyBalance || new Array(7).fill(0), isWorkoutMetric: true },
                    { id: `${workout.workoutId}_Energy`, workoutId: workout.workoutId, workoutName: workout.name, SvgIcon: workout.SvgIcon, metricTitle: 'Weekly Energy', metricId: 'Energy', title: workout.name, description: `Track your weekly energy burned for ${workout.name}.`, color: MetricColors.energy, unit: 'KCAL', value: stats.weeklyEnergy?.toString() || '0', todayValue: stats.energy?.toString() || '0', chart: stats.charts?.weeklyEnergy || new Array(7).fill(0), isWorkoutMetric: true },
                ];
            }
        } else {
            // Workout seçilmemişse WorkoutShortcuts grid'i göster
            const workoutCards = allWorkouts.map((w) => ({
                id: `Workout_${w.workoutId}`,
                workoutId: w.workoutId,
                title: w.name,
                description: `Start ${w.name} workout and track your progress.`,
                color: '#9DEC2C',
                SvgIcon: w.SvgIcon,
                isWorkoutCard: true
            }));
            carouselCards = [
                { 
                    id: 'WorkoutShortcuts', 
                    title: 'Workouts', 
                    description: 'Quickly start your most recent workouts', 
                    color: '#9DEC2C' 
                },
                ...workoutCards
            ];
        }
    } else {
        // Global metrics (Set Count, Strength Level, etc.)
        carouselCards = [
            { id: 'SetCount', title: 'Set Count', metricTitle: 'Set Count', color: MetricColors.sets, unit: 'SET', value: statsDetail.sets.toString(), chart: statsDetail.charts.sets || [], description: 'A quick glance at your total set count for the day.' },
            { id: 'StrengthLevel', title: 'Strength Level', metricTitle: 'Strength Level', color: MetricColors.weight, unit: 'KG', value: statsDetail.strength.toString(), chart: statsDetail.charts.strength || [], description: 'Your total strength volume calculated for the day.' },
            { id: 'Energy', title: 'Energy', metricTitle: 'Energy', color: MetricColors.energy, unit: 'KCAL', value: (statsDetail.energy || 0).toString(), chart: statsDetail.charts.energy || [], description: 'Track your total energy burned throughout the day.' },
            { id: 'Endurance', title: 'Endurance', metricTitle: 'Endurance', color: MetricColors.duration, unit: 'MIN', value: (statsDetail.endurance || 0).toString(), chart: statsDetail.charts.endurance || [], description: 'Monitor your total workout duration for the day.' },
            { id: 'Cadence', title: 'Cadence', metricTitle: 'Cadence', color: MetricColors.speed, unit: 's/r', value: statsDetail.cadence.toString(), chart: statsDetail.charts.cadence || [], description: 'Track your workout cadence and rhythm throughout the session.' },
            { id: 'Intensity', title: 'Intensity', metricTitle: 'Intensity', color: MetricColors.energy, unit: '', value: statsDetail.intensity, chart: statsDetail.charts.intensity || [], description: 'Measure your workout intensity based on rest and active ratios.' },
            { id: 'Density', title: 'Density', metricTitle: 'Density', color: '#9DEC2C', unit: '%', value: statsDetail.density.toString(), chart: statsDetail.charts.density || [], description: 'Monitor your workout density and overall efficiency.' },
            { id: 'Balance', title: 'Balance', metricTitle: 'Balance', color: '#EC4899', unit: '%', value: (statsDetail.balance || 0).toString(), chart: statsDetail.charts.balance || [], description: 'Track your workout balance between different muscle groups.' },
        ];
    }

    const currentCard = carouselCards[selectedCardIndex % carouselCards.length];

        const stickyTitleOpacity = scrollY.interpolate({
            inputRange: [40, 70],
            outputRange: [0, 1],
            extrapolate: 'clamp'
        });

        const stickyTitleTranslateY = scrollY.interpolate({
            inputRange: [40, 70],
            outputRange: [10, 0],
            extrapolate: 'clamp'
        });

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <View style={styles.container}>

                <View style={[styles.header, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, paddingTop: 10 }]}> 
                    {/* Semi-transparent gradient background for sticky header */}
                    <Animated.View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        opacity: stickyTitleOpacity,
                        zIndex: 0,
                    }} pointerEvents="none">
                        <LinearGradient
                            colors={["#1C1C1E", "transparent"]}
                            locations={[0, 1]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={{ flex: 1, borderRadius: 18, height: 80 }}
                        />
                    </Animated.View>

                    <View style={{ width: 60, alignItems: 'flex-start', zIndex: 1 }}>
                        {showDetailView && (
                            <TouchableOpacity onPress={() => { setShowDetailView(false); scrollY.setValue(0); }} style={[styles.closeButton, { backgroundColor: '#27272A', marginLeft: -4 }]} activeOpacity={1}>
                                <Feather name="chevron-left" size={28} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Animated.View style={{ flex: 1, alignItems: 'flex-start', opacity: stickyTitleOpacity, transform: [{ translateY: stickyTitleTranslateY }], zIndex: 1 }}>
                        <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '600' }} numberOfLines={1}>
                            {showDetailView ? '' : 'Add a Card to Your Summary'}
                        </Text>
                    </Animated.View>

                    <View style={{ width: 60, alignItems: 'flex-end', zIndex: 1 }}>
                        {!showDetailView && (
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={1}>
                                <Feather name="x" size={24} color="#000" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {showDetailView ? renderDetailView() : renderMainView()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1C1C1E' },
    contentContainer: { flex: 1, overflow: 'visible' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    header: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#9DEC2C', justifyContent: 'center', alignItems: 'center' },
    absoluteCloseButton: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#9DEC2C',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backTapBanner: { marginHorizontal: 20, marginTop: 10, backgroundColor: '#27272A', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    backTapTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    backTapSubtitle: { color: '#A1A1AA', fontSize: 12 },
    scrollView: { flex: 1, overflow: 'visible' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 100 },
    title: { fontSize: 29, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 24, lineHeight: 38 },
    sectionSeparator: { height: 0.75, backgroundColor: 'rgba(255, 255, 255, 0.12)', width: '100%' },
    fullCard: { backgroundColor: '#2A292A', borderRadius: 20, padding: 20, marginBottom: 24 },
    cardsStack: { width: SCREEN_WIDTH - 120, height: 186, marginBottom: 0, position: 'relative', alignSelf: 'center', marginTop: 10 },
    cardFront: { top: SquareCardMeasurements.stack.frontTop, left: SquareCardMeasurements.stack.frontLeft, zIndex: 3, position: 'absolute', width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, paddingHorizontal: SquareCardMeasurements.padding, paddingTop: 12, paddingBottom: 8, justifyContent: 'space-between', height: 176 },
    cardBack: { top: SquareCardMeasurements.stack.backTop, left: SquareCardMeasurements.stack.backLeft, height: 176, zIndex: 2, transform: [{ scale: SquareCardMeasurements.stack.backScale }], opacity: 0.7, position: 'absolute', width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, paddingHorizontal: SquareCardMeasurements.padding, paddingTop: 12, paddingBottom: 8, justifyContent: 'space-between' },
    cardFarBack: { top: SquareCardMeasurements.stack.farBackTop, left: SquareCardMeasurements.stack.farBackLeft, height: 176, zIndex: 1, transform: [{ scale: SquareCardMeasurements.stack.farBackScale }], opacity: 0.5, position: 'absolute', width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, paddingHorizontal: SquareCardMeasurements.padding, paddingTop: 12, paddingBottom: 8, justifyContent: 'space-between' },
    // Workout Stack (Chest Rope) specific styles
    workoutStack: { width: SCREEN_WIDTH - 120, height: 181, marginBottom: 0, position: 'relative', alignSelf: 'center', marginTop: 10 },
    workoutCardFront: { top: SquareCardMeasurements.stack.frontTop, left: SquareCardMeasurements.stack.frontLeft, zIndex: 3, position: 'absolute', width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, paddingHorizontal: SquareCardMeasurements.padding, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between', height: 171 },
    workoutCardBack: { top: SquareCardMeasurements.stack.backTop, left: SquareCardMeasurements.stack.backLeft, height: 171, zIndex: 2, transform: [{ scale: SquareCardMeasurements.stack.backScale }], opacity: 0.7, position: 'absolute', width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, paddingHorizontal: SquareCardMeasurements.padding, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between' },
    workoutCardFarBack: { top: SquareCardMeasurements.stack.farBackTop, left: SquareCardMeasurements.stack.farBackLeft, height: 171, zIndex: 1, transform: [{ scale: SquareCardMeasurements.stack.farBackScale }], opacity: 0.5, position: 'absolute', width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, paddingHorizontal: SquareCardMeasurements.padding, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between' },
    workoutCardTitle: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: -4 },
    workoutSubLabel: { fontSize: 13, color: '#FFF', marginTop: 4 },
    workoutMetricValue: { fontSize: 30, fontWeight: '700' },
    workoutUnit: { fontSize: 20, fontWeight: '700', marginLeft: 2 },
    workoutChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 55, marginTop: -2, paddingBottom: 6, overflow: 'hidden' },
    workoutTodayFooter: { color: '#FFF', fontSize: 13, marginTop: -12, fontWeight: '500' },
    // sessionSquare styles removed - now in SquareCardStyles.ts


    carouselCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle: { fontSize: 17, fontWeight: '600', color: '#FFF', marginBottom: 4 },
    cardPeriod: { fontSize: 15, color: '#8E8E93', marginBottom: 8 },
    cardValue: { fontSize: 48, fontWeight: 'bold', color: '#A78BFA', marginBottom: 24 },
    halfCard: { width: (SCREEN_WIDTH - 42) / 2, backgroundColor: '#2A292A', borderRadius: 16, padding: SquareCardMeasurements.padding, paddingBottom: 8, justifyContent: 'space-between' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 0, gap: 6 },
    headerIconContainer: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },
    subLabel: { fontSize: 12, color: '#FFF', marginBottom: 4, textTransform: 'uppercase' },
    metricValue: { fontSize: 30, fontWeight: '500', marginBottom: 8 },
    unit: { fontSize: 22, fontWeight: '500' },
    barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 70, marginBottom: 0, position: 'relative', overflow: 'hidden' },
    chartLabelsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
    chartLabelText: { fontSize: 10, color: '#8E8E93', backgroundColor: '#2A292A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', textAlign: 'center' },
    bar: { width: 3, borderRadius: 1.5 },
    miniChart: { flexDirection: 'row', alignItems: 'flex-end', height: 50, marginBottom: 4, gap: 2 },
    barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
    miniBar: { width: '100%', borderRadius: 1, minHeight: 2 },
    timeLabel: { fontSize: 11, color: '#636366' },
    paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 51, marginTop: 10 },
    paginationDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#3A3A3C' },
    description: { fontSize: 17, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginTop: 1, marginBottom: 0, paddingHorizontal: 40 },
    // addButton styles removed - now in AddCardButtonStyle.ts

    sessionsSection: { backgroundColor: '#2A292A', borderRadius: 24, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 2, marginBottom: 0 },
    sessionsTitle: { fontSize: 17, fontWeight: 'bold', color: '#FFF', marginBottom: 0 },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sessionWorkoutName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFF',
        marginBottom: 4,
    },
    sessionMetric: {
        fontSize: 29,
        fontWeight: '600',
        color: MetricColors.energy,
    },
    sessionUnit: {
        fontSize: 19,
        fontWeight: '700',
        color: MetricColors.energy,
    },
    sessionDateLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    emptyText: {
        color: '#8E8E93',
        textAlign: 'center',
        marginVertical: 20,
    },
    footerText: { fontSize: 13, color: '#636366', textAlign: 'center', lineHeight: 18 },
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    sectionCard: {
        backgroundColor: '#2A292A',
        borderRadius: 16,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 2,
        marginBottom: 0,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 0,
    },
    workoutGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    workoutShortcutCard: {
        width: (SCREEN_WIDTH - 32 - 16 - 8) / 2,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'column',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 0,
    },
    shortcutName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    modalWrapper: {
        height: SCREEN_HEIGHT - 40,
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 42,
        borderTopRightRadius: 42,
        overflow: 'hidden',
    },
    card: {
        backgroundColor: '#2A292A',
        borderRadius: 24,
        padding: 16,
        marginBottom: 0,
    },
    trendGrid: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    trendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16, // 16 - 8 = 8, alttan 8px kırpma (5+3)
        width: '48%', // 2 columns
    },
    trendIconDown: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#1F1F20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    trendLabel: {
        fontSize: 16,
        color: '#FFF',
        marginBottom: 0,
    },
    trendValue: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '600',
    },
});

const TrendSquareCardAnimated = ({ card, isActive }: { card: any, isActive: boolean }) => {
    const slideAnim = useRef(new Animated.Value(-50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            // Reset
            slideAnim.setValue(-50);
            fadeAnim.setValue(0);

            // Animate
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1.5)),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            // Optional: reset to initial state when inactive, or leave as is
        }
    }, [isActive]);

    return (
        <View style={[TrendsSquareCardStyle.trendSquareCard, { marginTop: SquareCardMeasurements.modal.carouselCardTop, height: 170, paddingTop: 0 }]}>
            <Text style={[TrendsSquareCardStyle.trendSquareHeader, { marginTop: 10, marginLeft: 16 }]}>Trends</Text>
            <View style={[TrendsSquareCardStyle.trendSquareIconWrapper, { marginTop: 12, marginLeft: 16, overflow: 'hidden' }]}>
                <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
                    <Feather name="chevron-down" size={48} color={card.color} />
                </Animated.View>
            </View>
            <Text style={[TrendsSquareCardStyle.trendSquareLabel, { marginTop: 15, marginLeft: 16 }]}>{card.title}</Text>
            <Text style={[TrendsSquareCardStyle.trendSquareValue, { color: card.color, marginLeft: 16, marginTop: 4 }]}>
                {card.value} {card.unit}
            </Text>
        </View>
    );
};

const TrendGridIconAnimated = ({ color, isActive }: { color: string, isActive: boolean }) => {
    const slideAnim = useRef(new Animated.Value(-50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            slideAnim.setValue(-50);
            fadeAnim.setValue(0);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1.5)),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isActive]);

    return (
        <View style={[styles.trendIconDown, { overflow: 'hidden' }]}>
            <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
                <Feather name="chevron-down" size={38} color={color} />
            </Animated.View>
        </View>
    );
};
