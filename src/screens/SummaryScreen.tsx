import React, { useState, useCallback, useContext, useRef, useEffect, useMemo } from 'react';
// Use this constant for all summary card backgrounds. Any new card should use this for backgroundColor.
const SUMMARY_CARD_BG_COLOR = '#1C1C1E';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, StatusBar, Image, Modal, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, LinearTransition, FadeIn, FadeOut, runOnJS, withRepeat, withSequence, useDerivedValue,
  runOnUI, withDelay, useAnimatedReaction, Easing,
} from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { calculateCalories } from '../utils/CalorieCalculator';
import MetricColors from '../constants/MetricColors';
import { allWorkouts, Workout } from '../constants/workoutData';
import LinearGradient from 'react-native-linear-gradient';
import AddSummaryCardModal from '../components/AddSummaryCardModal';
import { SUMMARY_CARD_STORAGE_KEY, DEFAULT_VISIBLE_CARDS } from '../constants/WorkoutConstants';
import { WorkoutSquareCardStyle } from '../styles/workoutsquarecardstyle';
import { IndividualWorkoutCardStyle } from '../styles/individualworkoutcardstyle';
import { TrendsSquareCardStyle } from '../styles/trendssquarecardstyle';
import { SessionsSquareCardStyle } from '../styles/sessionssquarecardstyle';
import { SquareCardMeasurements } from '../styles/SquareCardBase';
import { DailyWorkoutWidget } from '../components/Summary';
import { 
  getTodaysWorkoutDay, 
  getCurrentDayNumber, 
  loadHiddenWorkoutDays, 
  hideWorkoutDay, 
  showWorkoutDay,
  ALL_WORKOUT_DAYS,
  WorkoutDayType 
} from '../utils/WorkoutDayManager';

const QUICK_START_STORAGE_KEY = '@workout_quick_start_cards';
const LAST_ACTIVITY_WORKOUT_ID_KEY = '@last_activity_workout_id';

type SummaryScreenProps = StackScreenProps<RootStackParamList, 'SummaryOverview'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SummaryScreen({ navigation }: SummaryScreenProps) {
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  // Original State
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(500);
  const [totalSets, setTotalSets] = useState(0);
  const [averageWeight, setAverageWeight] = useState(0);
  const [setsChartData, setSetsChartData] = useState<number[]>(new Array(24).fill(0));
  const [weightChartData, setWeightChartData] = useState<number[]>(new Array(24).fill(0));


  // New Trend Stats
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

  // Recent Activity & Shortcuts
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [workoutShortcuts, setWorkoutShortcuts] = useState<Workout[]>([]);

  // Modal states
  const [energyModalVisible, setEnergyModalVisible] = useState(false);
  const [strengthModalVisible, setStrengthModalVisible] = useState(false);
  const [setsModalVisible, setSetsModalVisible] = useState(false);
  const [enduranceModalVisible, setEnduranceModalVisible] = useState(false);
  const [consistencyModalVisible, setConsistencyModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [cadenceModalVisible, setCadenceModalVisible] = useState(false);
  const [densityModalVisible, setDensityModalVisible] = useState(false);
  const [intensityModalVisible, setIntensityModalVisible] = useState(false);
  const [workoutStats, setWorkoutStats] = useState<{ [key: string]: any }>({});

  // Workout Metrics Modal State
  const [workoutMetricsModalVisible, setWorkoutMetricsModalVisible] = useState(false);
  const [selectedWorkoutForMetrics, setSelectedWorkoutForMetrics] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [isSessionsMode, setIsSessionsMode] = useState(false);
  const [isWorkoutsMode, setIsWorkoutsMode] = useState(false);

  // Today's Workout Day State
  const [todaysWorkoutDay, setTodaysWorkoutDay] = useState<WorkoutDayType | null>(null);
  const [hiddenWorkoutDays, setHiddenWorkoutDays] = useState<WorkoutDayType[]>([]);
  const [workoutDayModalVisible, setWorkoutDayModalVisible] = useState(false);

  const latestSession = recentSessions.length > 0 ? recentSessions[0] : null;

  const [visibleCardIds, setVisibleCardIds] = useState<string[]>(DEFAULT_VISIBLE_CARDS);
  const setVisibleCards = setVisibleCardIds;
  const visibleCards = visibleCardIds;

  const normalizeCardId = (id: string) => (id === 'Sessions' ? 'Sessions_List' : id);

  const normalizedVisibleCardIds = useMemo(
    () => visibleCardIds.map(normalizeCardId),
    [visibleCardIds]
  );

  const [gridPositions, setGridPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const metricPreviews = [
    {
      id: 'ActivityRing',
      title: 'Activity Ring',
      description: 'A quick glance at your daily move progress and activity levels.',
      color: MetricColors.energy,
      icon: 'ring'
    },
    {
      id: 'Trends',
      title: 'Trends',
      description: 'Detailed insights into your fitness progress over the past month.',
      color: MetricColors.sets,
      icon: 'trending-up'
    },
    {
      id: 'Sessions',
      title: 'Sessions',
      description: 'See all your workouts, meditations, and dives in one place.',
      color: MetricColors.energy,
      icon: 'run'
    },
    {
      id: 'StrengthLevel',
      title: 'Strength Level',
      description: 'Track your overall strength progress and lifting capacity.',
      color: MetricColors.weight,
      icon: 'arm-flex'
    },
    {
      id: 'WorkoutShortcuts',
      title: 'Workouts',
      description: 'Add your favorite workout shortcuts back to your summary.',
      color: '#9DEC2C',
      icon: 'dumbbell'
    }
  ];

  const rotation = useRef(new RNAnimated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    console.log('✅ SummaryScreen mounted');
  }, []);

  useEffect(() => {
    if (isEditing) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(rotation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          RNAnimated.timing(rotation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
        ])
      ).start();
    } else {
      rotation.setValue(0);
      rotation.stopAnimation();
    }
  }, [isEditing]);

  useFocusEffect(
    useCallback(() => {
      loadDailyData();
      loadWorkoutShortcuts();
      loadTodaysWorkoutDay();
    }, [])
  );

  // Load today's workout day
  const loadTodaysWorkoutDay = async () => {
    try {
      const today = await getTodaysWorkoutDay();
      setTodaysWorkoutDay(today);
      
      const hidden = await loadHiddenWorkoutDays();
      setHiddenWorkoutDays(hidden);
    } catch (error) {
      console.error('Error loading today workout day:', error);
    }
  };

  // Hide workout day from summary
  const handleHideWorkoutDay = async (day: WorkoutDayType) => {
    await hideWorkoutDay(day);
    setHiddenWorkoutDays(prev => [...prev, day]);
  };

  // Show workout day in summary
  const handleShowWorkoutDay = async (day: WorkoutDayType) => {
    await showWorkoutDay(day);
    setHiddenWorkoutDays(prev => prev.filter(d => d !== day));
  };

  const loadDailyData = async () => {
    try {
      const storedCards = await AsyncStorage.getItem(SUMMARY_CARD_STORAGE_KEY);
      if (storedCards) {
        setVisibleCards(JSON.parse(storedCards).map(normalizeCardId));
      } else {
        setVisibleCards(DEFAULT_VISIBLE_CARDS.map(normalizeCardId));
      }

      let currentGoal = 500;
      const todayStr = new Date().toDateString();
      const storedOverride = await AsyncStorage.getItem('dailyMoveGoalOverride');
      if (storedOverride) {
        const override = JSON.parse(storedOverride);
        if (override.date === todayStr) {
          currentGoal = override.goal;
        } else {
          const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
          if (storedSchedule) {
            const schedule = JSON.parse(storedSchedule);
            const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const dayItem = schedule.find((s: any) => s.day === dayName);
            if (dayItem) currentGoal = dayItem.goal;
          }
        }
      } else {
        const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
        if (storedSchedule) {
          const schedule = JSON.parse(storedSchedule);
          const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          const dayItem = schedule.find((s: any) => s.day === dayName);
          if (dayItem) currentGoal = dayItem.goal;
        }
      }

      setDailyGoal(currentGoal);

      const stored = await AsyncStorage.getItem('workoutSummaries');
      if (stored) {
        const allSummaries = JSON.parse(stored);
        const today = new Date();

        const todaysData = allSummaries.filter((s: any) => {
          const d = new Date(s.date);
          return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
        });

        let totalCals = 0;
        let tSets = 0;
        let totalWeightVal = 0;
        let weightCount = 0;
        let totalActiveTime = 0;
        let totalRestTime = 0;
        let totalElapsed = 0;
        let totalRepsForDay = 0;

        const sData = new Array(24).fill(0);
        const wData = new Array(24).fill(0);

        todaysData.forEach((item: any) => {
          const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;
          totalCals += calculateCalories(item.workoutId, item.elapsedTime, weightVal, item.completedReps);
          tSets += (item.completedSets || 0);
          totalRepsForDay += (item.completedReps || 0);

          if (weightVal > 0) {
            totalWeightVal += weightVal;
            weightCount++;
          }

          const activeTime = item.greenLoopTimes ? item.greenLoopTimes.reduce((a: number, b: number) => a + b, 0) : item.elapsedTime;
          const restTime = item.redLoopTimes ? item.redLoopTimes.reduce((a: number, b: number) => a + b, 0) : 0;

          totalActiveTime += activeTime;
          totalRestTime += restTime;
          totalElapsed += (item.elapsedTime || 0);

          const h = new Date(item.date).getHours();
          const volume = weightVal * (item.completedSets || 0) * (item.completedReps || 0);
          sData[h] += (item.completedSets || 0);
          wData[h] += volume;
        });

        setDailyCalories(totalCals);
        setTotalSets(tSets);
        setAverageWeight(weightCount > 0 ? Math.round(totalWeightVal / weightCount) : 0);
        setSetsChartData(sData);
        setWeightChartData(wData);

        // Set recent sessions (last 10 sessions sorted by date)
        const sortedSessions = allSummaries
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        setRecentSessions(sortedSessions);

        // Calculate workout-specific stats
        const statsMap: any = {};
        const uniqueWorkoutIds = Array.from(new Set(allSummaries.map((s: any) => s.workoutId)));
        const todayStr = today.toDateString();

        const getDayIndex = (date: Date) => {
          const day = date.getDay();
          return day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6
        };

        uniqueWorkoutIds.forEach((wId: any) => {
          const wSummaries = allSummaries.filter((s: any) => s.workoutId === wId);
          let wWeeklySets = 0, wWeeklyVolume = 0, wWeeklyActive = 0, wWeeklyRest = 0, wWeeklyReps = 0, wWeeklyElapsed = 0;
          let wTodaySets = 0, wTodayVolume = 0, wTodayActive = 0, wTodayRest = 0, wTodayReps = 0, wTodayElapsed = 0;

          const weeklySetsData = new Array(7).fill(0);
          const weeklyStrData = new Array(7).fill(0);
          const weeklyCadData = new Array(7).fill(0);
          const weeklyIntData = new Array(7).fill(0);
          const weeklyDenData = new Array(7).fill(0);
          const weeklyCounts = new Array(7).fill(0);

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);

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
              weeklySetsData[dayIdx] += sets;
              weeklyStrData[dayIdx] += vol;
              weeklyIntData[dayIdx] += activeTime > 0 ? (restTime / activeTime) : 0;
              weeklyCadData[dayIdx] += cadence;
              weeklyDenData[dayIdx] += density;
              weeklyCounts[dayIdx]++;
            }

            if (sDate.toDateString() === todayStr) {
              wTodaySets += sets;
              wTodayVolume += vol;
              wTodayActive += activeTime;
              wTodayRest += restTime;
              wTodayElapsed += (s.elapsedTime || 0);
              wTodayReps += reps;
            }
          });

          // Normalize weekly data by counts
          for (let i = 0; i < 7; i++) {
            if (weeklyCounts[i] > 0) {
              weeklyCadData[i] = parseFloat((weeklyCadData[i] / weeklyCounts[i]).toFixed(1));
              weeklyIntData[i] = parseFloat((weeklyIntData[i] / weeklyCounts[i]).toFixed(2));
              weeklyDenData[i] = Math.round(weeklyDenData[i] / weeklyCounts[i]);
            }
          }

          statsMap[wId] = {
            sets: wTodaySets,
            strength: Math.round(wTodayVolume / 1000),
            cadence: wTodayReps > 0 ? parseFloat((wTodayActive / wTodayReps).toFixed(1)) : 0,
            intensity: wTodayActive > 0 ? `${parseFloat((wTodayRest / wTodayActive).toFixed(1))}:1` : "0:1",
            density: wTodayElapsed > 0 ? Math.round((wTodayActive / wTodayElapsed) * 100) : 0,
            consistency: Math.round((weeklyCounts.filter(c => c > 0).length / 7) * 100),
            endurance: Math.round(wWeeklyElapsed / 60),
            balance: 100,
            energy: Math.round(calculateCalories(wId, wTodayElapsed, wTodayVolume > 0 ? wTodayVolume / (wTodaySets || 1) / (wTodayReps || 1) : 0, wTodayReps)),
            weeklySets: wWeeklySets,
            weeklyStrength: Math.round(wWeeklyVolume / 1000),
            weeklyIntensity: wWeeklyActive > 0 ? `${parseFloat((wWeeklyRest / wWeeklyActive).toFixed(1))}:1` : "0:1",
            weeklyCadence: wWeeklyReps > 0 ? parseFloat((wWeeklyActive / wWeeklyReps).toFixed(1)) : 0,
            weeklyDensity: wWeeklyElapsed > 0 ? Math.round((wWeeklyActive / wWeeklyElapsed) * 100) : 0,
            weeklyConsistency: Math.round((weeklyCounts.filter(c => c > 0).length / 7) * 100),
            weeklyEndurance: Math.round(wWeeklyElapsed / 60),
            weeklyBalance: 100,
            weeklyEnergy: Math.round(calculateCalories(wId, wWeeklyElapsed, wWeeklyVolume > 0 ? wWeeklyVolume / (wWeeklySets || 1) / (wWeeklyReps || 1) : 0, wWeeklyReps)),
            charts: {
              weeklySets: weeklySetsData,
              weeklyStrength: weeklyStrData.map(v => Math.round(v / 1000)),
              weeklyIntensity: weeklyIntData,
              weeklyCadence: weeklyCadData,
              weeklyDensity: weeklyDenData,
              weeklyConsistency: weeklyCounts.map(c => c > 0 ? 100 : 0),
              weeklyEndurance: weeklyCounts.map((c, i) => c > 0 ? Math.round(weeklyDenData[i]) : 0),
              weeklyBalance: new Array(7).fill(100),
              weeklyEnergy: weeklySetsData.map((s, i) => Math.round(s * 5))
            }
          };
        });

        setWorkoutStats(statsMap);
      }
    } catch (e) {
      console.error('Error loading daily data:', e);
    }
  };

  const loadWorkoutShortcuts = async () => {
    try {
      const stored = await AsyncStorage.getItem(QUICK_START_STORAGE_KEY);
      let loadedCards: Workout[] = allWorkouts.slice(0, 6);

      if (stored) {
        const cardIds: string[] = JSON.parse(stored);
        const cardsFromStorage = cardIds
          .map(id => allWorkouts.find(w => w.workoutId === id))
          .filter(Boolean) as Workout[];

        if (cardsFromStorage.length > 0) {
          loadedCards = cardsFromStorage;
        }
      }

      const lastActivityId = await AsyncStorage.getItem(LAST_ACTIVITY_WORKOUT_ID_KEY);
      if (lastActivityId) {
        const lastUsedCard = loadedCards.find(c => c.workoutId === lastActivityId);
        if (lastUsedCard) {
          loadedCards = [lastUsedCard, ...loadedCards.filter(c => c.workoutId !== lastActivityId)];
        }
      }

      setWorkoutShortcuts(loadedCards.slice(0, 4));
    } catch (error) {
      console.error('Error loading workout shortcuts:', error);
    }
  };

  const removeCard = async (cardId: string) => {
    const updated = visibleCards.filter(id => id !== cardId);
    setVisibleCards(updated);
    await AsyncStorage.setItem(SUMMARY_CARD_STORAGE_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    const saveOrder = async () => {
      if (visibleCards.length > 0) {
        await AsyncStorage.setItem(SUMMARY_CARD_STORAGE_KEY, JSON.stringify(visibleCards));
      }
    };
    saveOrder();
  }, [visibleCards]);

  const isFullWidthCard = (id: string) => {
    return (
      id === 'Sessions_List' ||
      id === 'Sessions' ||
      id === 'WorkoutShortcuts' ||
      id === 'Trends' ||
      id === 'Trends_Grid' ||
      id === 'ActivityRing'
    );
  };


  const handleDoneEditing = () => {
    setIsEditing(false);
  };


  const renderDeleteIcon = (cardId: string) => {
    if (!isEditing || cardId === 'ActivityRing') return null;
    return (
      <TouchableOpacity
        onPress={() => removeCard(cardId)}
        style={styles.deleteIconContainer}
        activeOpacity={1}
      >
        <Feather name="minus" size={16} color="#FFF" />
      </TouchableOpacity>
    );
  };


  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const renderBarChart = (data: number[], color: string, guideColor?: string) => {
    const max = Math.max(...data, 1);
    const chartHeight = 70;
    const _guideColor = guideColor || '#5E5E61';

    return (
      <View style={styles.barChartContainer}>
        {data.map((val, i) => (
          <View key={i} style={{ width: 3, height: chartHeight, justifyContent: 'flex-end' }}>
            <View style={{ ...styles.bar, height: chartHeight, backgroundColor: _guideColor, position: 'absolute', bottom: 0 }} />
            {val > 0 && (
              <View style={{ ...styles.bar, height: Math.max((val / max) * chartHeight * 0.8, 4), backgroundColor: color }} />
            )}
          </View>
        ))}
        <View style={styles.chartLabelsOverlay}>
          <Text style={styles.chartLabelText}>12AM</Text>
          <Text style={styles.chartLabelText}>6AM</Text>
          <Text style={styles.chartLabelText}>12PM</Text>
          <Text style={styles.chartLabelText}>6PM</Text>
        </View>
      </View>
    );
  };

  const renderSquareSessionCard = (session: any) => {
    if (!session) return null;
    const workout = allWorkouts.find(w => w.workoutId === session.workoutId);
    const SvgIcon = workout?.SvgIcon;
    const sessionDate = new Date(session.date || session.timestamp);
    const isToday = !isNaN(sessionDate.getTime()) && sessionDate.toDateString() === new Date().toDateString();
    const dateLabel = isNaN(sessionDate.getTime()) ? 'Unknown' : (isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }));
    const weightVal = session.settings?.weight ? parseFloat(session.settings.weight) : 0;
    const cals = session.calories || calculateCalories(session.workoutId, session.elapsedTime, weightVal, session.completedReps);

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isEditing && session) navigation.navigate('WorkoutSummaryScreen', {
            workoutId: session.workoutId,
            workoutName: session.workoutName
          });
        }}
        activeOpacity={1}
        disabled={isEditing}
        style={[SessionsSquareCardStyle.container, { backgroundColor: '#1C1C1E' }]}
      >
        <Text style={SessionsSquareCardStyle.headerTitle}>Sessions</Text>
        <View style={SessionsSquareCardStyle.iconRow}>
          <LinearGradient colors={['#122003', '#213705']} style={SessionsSquareCardStyle.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {SvgIcon && <SvgIcon width={24} height={24} fill="#9DEC2C" />}
          </LinearGradient>
        </View>
        <Text style={SessionsSquareCardStyle.workoutName} numberOfLines={1}>{workout?.name || 'Unknown'}</Text>
        <Text style={SessionsSquareCardStyle.metric}>
          {cals}
          <Text style={SessionsSquareCardStyle.unit}> KCAL</Text>
        </Text>
        <Text style={SessionsSquareCardStyle.dateLabel}>{dateLabel}</Text>
      </TouchableOpacity>
    );
  };

  const renderSummaryCard = (compId: string) => {
    if (compId === 'Sessions') compId = 'Sessions_List';

    if (compId === 'Sessions_List') {
      return (
        <View style={[styles.sectionCard, { backgroundColor: '#1C1C1E' }]}> 
          <TouchableOpacity
            style={styles.cardHeaderRow}
            onPress={() => {
              if (!isEditing) setAddCardModalVisible(true);
            }}
            activeOpacity={1}
            disabled={isEditing}
          >
            <Text style={styles.sessionsTitle}>Sessions</Text>
          </TouchableOpacity>

          {recentSessions.length > 0 ? (
            recentSessions.slice(0, 3).map((session, idx) => {
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
                <TouchableOpacity
                  key={idx}
                  style={[styles.sessionItem, idx === Math.min(recentSessions.length, 3) - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => {
                    if (!isEditing) navigation.navigate('WorkoutSummaryScreen', {
                      workoutId: session.workoutId,
                      workoutName: session.workoutName
                    });
                  }}
                  activeOpacity={1}
                  disabled={isEditing}
                >
                  <LinearGradient
                    colors={['#122003', '#213705']}
                    style={styles.sessionIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {SvgIcon && <SvgIcon width={39} height={39} fill="#9DEC2C" />}
                  </LinearGradient>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionWorkoutName} numberOfLines={1}>{session.workoutName}</Text>
                    <Text style={styles.sessionMetric}>{cals}<Text style={styles.sessionUnit}>KCAL</Text></Text>
                  </View>
                  <Text style={styles.sessionDateLabel}>{finalDateLabel}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No recent sessions</Text>
          )}
        </View>
      );
    }

    if (compId === 'Sessions_Square') {
      return renderSquareSessionCard(recentSessions[0]);
    }

    const metrics: { [key: string]: any } = {
      'ActivityRing': {
        isFull: true,
        render: () => (
          <View style={styles.activityCard}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => {
                if (!isEditing) navigation.navigate('DailySummaryDetail');
              }}
              activeOpacity={1}
              disabled={isEditing}
            >
              <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Activity Ring</Text>
              <View style={styles.activityContent}>
                <View style={styles.ringContainer}>
                  <AnimatedCircularProgress
                    size={140}
                    width={30}
                    fill={(dailyCalories / dailyGoal) * 100}
                    tintColor="#FA114F"
                    backgroundColor="#3E0E18"
                    rotation={0}
                    lineCap="round"
                  />
                  <View style={styles.arrowCircle}>
                    <Feather name="arrow-right" size={22} color="#000" />
                  </View>
                </View>
                <View style={styles.activityStats}>
                  <Text style={styles.activityLabel}>Move</Text>
                  <Text>
                    <Text style={[styles.activityCurrent, { color: MetricColors.energy }]}> 
                      {Math.round(dailyCalories)}/{dailyGoal}
                    </Text>
                    <Text style={[styles.activityUnit, { color: MetricColors.energy }]}>KCAL</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )
      },
      'SetCount': { title: 'Set Count', action: () => navigation.navigate('SetCount'), color: MetricColors.sets, val: totalSets, unit: 'SET', chart: setsChartData },
      'StrengthLevel': { title: 'Strength Level', action: () => navigation.navigate('RepsCount'), color: MetricColors.weight, val: averageWeight, unit: 'KG', chart: weightChartData },
      'Trends': {
        isFull: true,
        render: () => (
          <TouchableOpacity
            onPress={() => {
              if (!isEditing) navigation.navigate('Trends');
            }}
            activeOpacity={1}
            disabled={isEditing}
            style={[styles.sectionCard, TrendsSquareCardStyle.trendsGridContainer, { backgroundColor: SUMMARY_CARD_BG_COLOR }]}
          >
            <Text style={TrendsSquareCardStyle.trendsGridTitle}>Trends</Text>
            <View style={TrendsSquareCardStyle.trendGrid}>
              {[
                { label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => setEnergyModalVisible(true) },
                { label: 'Strength', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => setStrengthModalVisible(true) },
                { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets, action: () => setSetsModalVisible(true) },
                { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE', action: () => setConsistencyModalVisible(true) }
              ].map((t, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (!isEditing) t.action();
                  }}
                  activeOpacity={1}
                  disabled={isEditing}
                  style={TrendsSquareCardStyle.trendItem}
                >
                  <TrendGridIconAnimated color={t.color} />
                  <View>
                    <Text style={TrendsSquareCardStyle.trendLabel}>{t.label}</Text>
                    <Text style={[TrendsSquareCardStyle.trendValue, { color: t.color }]}>
                      {t.val} {t.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )
      },
      'Trends_Grid': {
        isFull: true,
        render: () => (
          <TouchableOpacity
            onPress={() => {
              if (!isEditing) navigation.navigate('Trends');
            }}
            activeOpacity={1}
            disabled={isEditing}
            style={[styles.sectionCard, TrendsSquareCardStyle.trendsGridContainer, { backgroundColor: SUMMARY_CARD_BG_COLOR }]}
          >
            <Text style={TrendsSquareCardStyle.trendsGridTitle}>Trends</Text>
            <View style={TrendsSquareCardStyle.trendGrid}>
              {[
                { label: 'Energy', val: trendStats.energy, unit: 'KCAL/DAY', color: MetricColors.energy, action: () => setEnergyModalVisible(true) },
                { label: 'Strength', val: trendStats.strength, unit: 'KG/DAY', color: MetricColors.weight, action: () => setStrengthModalVisible(true) },
                { label: 'Sets', val: trendStats.sets, unit: 'SETS/DAY', color: MetricColors.sets, action: () => setSetsModalVisible(true) },
                { label: 'Consistency', val: trendStats.consistency, unit: '%', color: '#00C7BE', action: () => setConsistencyModalVisible(true) }
              ].map((t, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (!isEditing) t.action();
                  }}
                  activeOpacity={1}
                  disabled={isEditing}
                  style={TrendsSquareCardStyle.trendItem}
                >
                  <TrendGridIconAnimated color={t.color} />
                  <View>
                    <Text style={TrendsSquareCardStyle.trendLabel}>{t.label}</Text>
                    <Text style={[TrendsSquareCardStyle.trendValue, { color: t.color }]}>
                      {t.val} {t.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )
      },
      'WorkoutShortcuts': {
        isFull: true,
        render: () => (
          <View key="workouts-main-section" style={[styles.sectionCard, { backgroundColor: '#1C1C1E', paddingHorizontal: 0, paddingBottom: 8, paddingTop: 8 }]}> 
            <TouchableOpacity activeOpacity={0.7} onPress={() => { }}> 
              <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginTop: 4, marginBottom: 12, fontSize: 17 }]}>Workout</Text> 
            </TouchableOpacity> 
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              paddingHorizontal: 8,
              justifyContent: 'flex-start',
            }}>
              {workoutShortcuts.slice(0, 4).map((workout: Workout, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: (SCREEN_WIDTH - 32 - 16 - 8) / 2,
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    borderWidth: 0,
                    marginBottom: 2,
                  }}
                  onPress={() => {
                    if (!isEditing) timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
                  }}
                  activeOpacity={1}
                  disabled={isEditing}
                >
                  {workout.SvgIcon && <workout.SvgIcon width={34} height={34} fill="#9DEC2C" style={{ marginBottom: 2 }} />}
                  <Text style={styles.shortcutName} numberOfLines={1}>{workout.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      },
      'Workout_Square': {
        isFull: false,
        render: () => {
          const latest = recentSessions.length > 0
            ? allWorkouts.find(w => w.workoutId === recentSessions[0].workoutId)
            : allWorkouts[0];
          const SvgIcon = latest?.SvgIcon;

          return (
            <TouchableOpacity
              onPress={() => {
                if (!isEditing && latest) {
                  timerContext?.startTimerWithWorkoutSettings(latest.workoutId, latest.name);
                }
              }}
              activeOpacity={1}
              disabled={isEditing}
              style={[WorkoutSquareCardStyle.workoutSquareCard, { backgroundColor: '#1C1C1E' }]}
            >
              <Text style={WorkoutSquareCardStyle.workoutSquareHeader}>Workout</Text>
              <View style={WorkoutSquareCardStyle.workoutSquareIconContainer}> 
                <View style={{ justifyContent: 'flex-start' }}>
                  <View style={WorkoutSquareCardStyle.workoutSquareIconWrapper}> 
                    {SvgIcon && <SvgIcon width={63} height={63} fill="#9DEC2C" />}
                  </View>
                  <Text style={WorkoutSquareCardStyle.workoutSquareName} numberOfLines={1}>{latest?.name || 'Workout'}</Text>
                  <View style={WorkoutSquareCardStyle.workoutSquareActionRow}>
                    <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />
                    <Text style={WorkoutSquareCardStyle.workoutSquareActionText}>Start Workout</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }
      }
    };

    const m = metrics[compId];
    if (m?.render) return m.render();

    if (compId.startsWith('Trends_')) {
      const trendType = compId.replace('Trends_', '');
      const trendData: { [key: string]: { title: string, color: string, val: number | string, unit: string, screen: keyof RootStackParamList } } = {
        'Energy': { title: 'Energy', color: MetricColors.energy, val: trendStats.energy, unit: 'KCAL/DAY', screen: 'MoveScreen' },
        'Strength': { title: 'Strength', color: MetricColors.weight, val: trendStats.strength, unit: 'KG/DAY', screen: 'StrengthTrend' },
        'Sets': { title: 'Sets', color: MetricColors.sets, val: trendStats.sets, unit: 'SETS/DAY', screen: 'SetsTrend' },
        'Consistency': { title: 'Consistency', color: '#00C7BE', val: trendStats.consistency, unit: '%', screen: 'ConsistencyTrend' },
        'Cadence': { title: 'Cadence', color: MetricColors.speed, val: trendStats.cadence, unit: 'REPS/DAY', screen: 'CadenceTrend' },
        'Density': { title: 'Density', color: '#9DEC2C', val: trendStats.density, unit: 'MIN/DAY', screen: 'DensityTrend' },
        'Intensity': { title: 'Intensity', color: MetricColors.energy, val: trendStats.intensity, unit: 'MIN/DAY', screen: 'IntensityTrend' },
        'Endurance': { title: 'Endurance', color: MetricColors.duration, val: trendStats.endurance, unit: 'MIN/DAY', screen: 'EnduranceTrend' },
        'Balance': { title: 'Balance', color: '#D1A3FF', val: trendStats.balance, unit: '%', screen: 'BalanceTrend' },
      };

      const t = trendData[trendType];
      if (!t) return null;

      return (
        <TouchableOpacity
          key={compId}
          style={TrendsSquareCardStyle.trendSquareCard}
          onPress={() => {
            if (!isEditing) navigation.navigate(t.screen as any);
          }}
          activeOpacity={1}
          disabled={isEditing}
        >
          <TrendSquareCardAnimated card={t} />
        </TouchableOpacity>
      );
    }

    if (!m) {
      // Individual workout cards (Workout_{workoutId})
      if (compId.startsWith('Workout_') && compId !== 'Workout_Square') {
        const workoutId = compId.replace('Workout_', '');
        const workout = allWorkouts.find(w => w.workoutId === workoutId);
        if (!workout) return null;
        
        const SvgIcon = workout.SvgIcon;
        
        // Workout_{workoutId} kartları için IndividualWorkoutCardStyle kullan
        // (Assisted Tricep Dip, T-Bar Row vb. gibi belirli workout kartları)
        // Stiller Modal carousel kartlarıyla aynı ölçülerde
        return (
          <TouchableOpacity
            onPress={() => {
              if (!isEditing) {
                timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
              }
            }}
            activeOpacity={1}
            disabled={isEditing}
            style={[{
              ...IndividualWorkoutCardStyle.individualWorkoutCard,
              backgroundColor: '#1C1C1E',
              paddingTop: (IndividualWorkoutCardStyle.individualWorkoutCard?.paddingTop ?? 16) - 2,
              paddingBottom: (IndividualWorkoutCardStyle.individualWorkoutCard?.paddingBottom ?? 16) - 2
            }]}
          >
            <Text style={IndividualWorkoutCardStyle.individualWorkoutHeader}>Workout</Text>
            <View style={[IndividualWorkoutCardStyle.individualWorkoutIconContainer, { transform: [{ translateY: -2 }] }]}> 
              <View style={{ justifyContent: 'flex-start' }}>
                <View style={IndividualWorkoutCardStyle.individualWorkoutIconWrapper}>
                  {SvgIcon && <SvgIcon width={77} height={77} fill="#9DEC2C" />}
                </View>
                <Text style={IndividualWorkoutCardStyle.individualWorkoutName} numberOfLines={1}>{workout.name}</Text>
                <View style={IndividualWorkoutCardStyle.individualWorkoutActionRow}>
                  <MaterialCommunityIcons name="play-circle" size={12} color="#9DEC2C" />
                  <Text style={IndividualWorkoutCardStyle.individualWorkoutActionText}>Start Workout</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }

      if (compId.includes('_')) {
        const lastUnderscoreIndex = compId.lastIndexOf('_');
        const wId = compId.substring(0, lastUnderscoreIndex);
        const metricId = compId.substring(lastUnderscoreIndex + 1);

        const workout = allWorkouts.find(w => w.workoutId === wId);
        const stats = workoutStats[wId];

        if (!workout || !stats) return null;

        let title = workout.name;
        let metricLabel = '';
        let color = '#FFF', unit = '', value = '', todayValue = '', chart: number[] = [];

        if (metricId === 'SetCount') { 
          color = MetricColors.sets; 
          unit = 'SET'; 
          value = stats.weeklySets?.toString() || '0'; 
          todayValue = stats.sets?.toString() || '0';
          chart = stats.charts?.weeklySets || []; 
          metricLabel = 'Weekly Sets'; 
        }
        else if (metricId === 'StrengthLevel') { 
          color = MetricColors.weight; 
          unit = 'KG'; 
          value = stats.weeklyStrength?.toString() || '0'; 
          todayValue = stats.strength?.toString() || '0';
          chart = stats.charts?.weeklyStrength || []; 
          metricLabel = 'Weekly Strength'; 
        }
        else if (metricId === 'Cadence') { 
          color = MetricColors.speed; 
          unit = 's/r'; 
          value = stats.weeklyCadence?.toString() || '0'; 
          todayValue = stats.cadence?.toString() || '0';
          chart = stats.charts?.weeklyCadence || []; 
          metricLabel = 'Weekly Cadence'; 
        }
        else if (metricId === 'Intensity') { 
          color = MetricColors.energy; 
          unit = ''; 
          value = stats.weeklyIntensity || '0:1'; 
          todayValue = stats.intensity || '0:1';
          chart = stats.charts?.weeklyIntensity || []; 
          metricLabel = 'Weekly Intensity'; 
        }
        else if (metricId === 'Density') { 
          color = '#9DEC2C'; 
          unit = '%'; 
          value = stats.weeklyDensity?.toString() || '0'; 
          todayValue = stats.density?.toString() || '0';
          chart = stats.charts?.weeklyDensity || []; 
          metricLabel = 'Weekly Density'; 
        }
        else if (metricId === 'Balance') { 
          color = '#D1A3FF'; 
          unit = '%'; 
          value = stats.weeklyBalance?.toString() || '0'; 
          todayValue = stats.balance?.toString() || '0';
          chart = stats.charts?.weeklyBalance || []; 
          metricLabel = 'Weekly Balance'; 
        }
        else if (metricId === 'Consistency') { 
          color = '#00C7BE'; 
          unit = '%'; 
          value = stats.weeklyConsistency?.toString() || '0'; 
          todayValue = stats.consistency?.toString() || '0';
          chart = stats.charts?.weeklyConsistency || []; 
          metricLabel = 'Weekly Consistency'; 
        }
        else if (metricId === 'Endurance') { 
          color = MetricColors.duration; 
          unit = 'MIN'; 
          value = stats.weeklyEndurance?.toString() || '0'; 
          todayValue = stats.endurance?.toString() || '0';
          chart = stats.charts?.weeklyEndurance || []; 
          metricLabel = 'Weekly Endurance'; 
        }
        else if (metricId === 'Energy') { 
          color = MetricColors.energy; 
          unit = 'KCAL'; 
          value = stats.weeklyEnergy?.toString() || '0'; 
          todayValue = stats.energy?.toString() || '0';
          chart = stats.charts?.weeklyEnergy || []; 
          metricLabel = 'Weekly Energy'; 
        }

          // Modal workoutCardFront stili ile aynı: height 171, paddingBottom 6
          return (
            <TouchableOpacity
              key={compId}
              style={[styles.halfCard, styles.cardFront, { height: 171, paddingTop: 12, paddingBottom: 6, justifyContent: 'space-between' }]}
              onPress={() => {
                if (!isEditing) {
                  navigation.navigate('WorkoutCategoryDetail', {
                    workoutId: wId,
                    workoutName: workout.name,
                    focusMetric: metricId,
                  });
                }
              }}
              activeOpacity={1}
              disabled={isEditing}
            >
              {/* Header: Icon + Workout Name */}
              <View style={[styles.cardHeaderRow, { gap: 6, marginLeft: SquareCardMeasurements.workout.headerMarginLeft }]}> 
                {workout.SvgIcon && <workout.SvgIcon width={25} height={25} fill="#FFF" />}
                <Text style={[styles.workoutCardTitle]} numberOfLines={1}>{title}</Text>
              </View>
              {/* Metric Label */}
              <Text style={styles.workoutSubLabel}>{metricLabel}</Text>
              {/* Metric Value */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -6 }}>
                <Text style={[styles.workoutMetricValue, { color }]}>{value}</Text>
                <Text style={[styles.workoutUnit, { color }]}>{unit}</Text>
              </View>
              {/* Weekly Chart with Day Labels */}
              <View style={styles.workoutChartContainer}>
                {chart.slice(0, 7).map((val: number, i: number) => {
                  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                  const maxVal = Math.max(...chart.slice(0, 7), 1);
                  const barHeight = (val / maxVal) * 30;
                  return (
                    <React.Fragment key={i}>
                      {i === 0 && (
                        <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                      )}
                      <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
                        <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: color, borderRadius: 3 }]} />
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
                <Text style={{ color }}>{todayValue}{unit}</Text>
              </Text>
            </TouchableOpacity>
          );
      }

      return null;
    }

    if (compId === 'SetCount' || compId === 'StrengthLevel') {
      const m = metrics[compId];
      const isStrength = compId === 'StrengthLevel';
      const chartData = m.chart || [];
      return (
        <TouchableOpacity
          style={[styles.halfCard, { height: 170, paddingTop: 12, paddingBottom: 8, backgroundColor: '#1C1C1E' }]}
          onPress={() => {
            if (!isEditing) m.action();
          }}
          activeOpacity={1}
          disabled={isEditing}
        >
          <View style={[styles.cardHeaderRow, { paddingRight: 8 }]}> 
            <Text style={[styles.cardTitle, { fontSize: 17, textTransform: 'none', marginBottom: 0, flex: 1 }]}>{m.title}</Text>
          </View>
          <View style={{ marginTop: 9 }}>
            <Text style={[styles.subLabel, { color: '#FFF', fontSize: 13, marginTop: 4, textTransform: 'none' }]}>Today</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: -4 }}>
              <Text style={[styles.metricValue, { color: m.color, fontSize: 30, fontWeight: '700' }]}> 
                {m.val}{' '}
                <Text style={[styles.unit, { fontSize: 20, fontWeight: '700' }]}>{m.unit}</Text>
              </Text>
            </View>
            <View style={[styles.barChartContainer, { height: 70, marginBottom: 0, marginTop: -2, overflow: 'hidden' }]}> 
            {chartData.map((val: number, i: number) => {
              const computedVal = isStrength ? val / 1000 : val;
              const maxVal = Math.max(...chartData.map((v: number) => isStrength ? v / 1000 : v), 1);
              const barHeight = (computedVal / maxVal) * (70 * 0.8);
              return (
                <View key={i} style={{ width: 3, height: 70, justifyContent: 'flex-end' }}>
                  <View style={[styles.bar, { height: 70, backgroundColor: '#4A4A4C', position: 'absolute', bottom: 0 }]} />
                  {val > 0 && <View style={[styles.bar, { height: Math.max(barHeight, 4), backgroundColor: m.color }]} />}
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
      );
    }
    // ...existing code...
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={isEditing ? () => setAddCardModalVisible(true) : undefined}
            disabled={!isEditing}
            activeOpacity={1}
          >
            {isEditing ? (
              <View style={styles.headerIconWrapper}>
                <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
              </View>
            ) : (
              <View>
                <Text style={styles.headerTitle}>Summary</Text>
                <Text style={styles.headerDate}>{formatDate()}</Text>
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDoneEditing}
              activeOpacity={1}
            >
              <MaterialCommunityIcons name="check" size={24} color="#000" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity 
                style={styles.calendarButton}
                onPress={() => navigation.navigate('WorkoutCalendar', { showMonthView: true, timestamp: Date.now() })}
              >
                <Feather name="calendar" size={24} color="#9DEC2C" />
              </TouchableOpacity>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account-circle" size={40} color="#555" />
              </View>
            </View>
          )}
        </View>

        {/* Today's Workout Day Widget */}
        {todaysWorkoutDay && !hiddenWorkoutDays.includes(todaysWorkoutDay) && (
          <View style={{ position: 'relative' }}>
            {/* Edit mode: Remove button */}
            {isEditing && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FF3B30',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                }}
                onPress={() => handleHideWorkoutDay(todaysWorkoutDay)}
              >
                <Feather name="minus" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
            
            <DailyWorkoutWidget
              workoutDay={todaysWorkoutDay}
              currentDay={getCurrentDayNumber()}
              totalDays={7}
              onPress={() => navigation.navigate('DailyWorkoutDetail', {
                workoutDay: todaysWorkoutDay,
                currentDay: getCurrentDayNumber(),
                totalDays: 7,
                dailyCalorieGoal: 1000,
              })}
            />
          </View>
        )}

        {/* Edit mode: Show hidden workout days to re-add */}
        {isEditing && hiddenWorkoutDays.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: '#1C1C1E',
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setWorkoutDayModalVisible(true)}
          >
            <Feather name="plus-circle" size={22} color="#9DEC2C" />
            <Text style={{ color: '#9DEC2C', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
              Add Workout Day ({hiddenWorkoutDays.length} hidden)
            </Text>
          </TouchableOpacity>
        )}

        {/* Dynamic Summary Cards */}
        <Sortable.Flex
          sortEnabled={isEditing}
          hapticsEnabled={false}
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="flex-start"
          rowGap={10}
          columnGap={10}
          activeItemScale={1}
          activeItemOpacity={1}
          activeItemShadowOpacity={0}
          inactiveItemOpacity={1}
          inactiveItemScale={1}
          onDragEnd={({ order }) => {
            const nextOrder = order(normalizedVisibleCardIds);
            setVisibleCardIds(nextOrder);
          }}
        >
          {normalizedVisibleCardIds
            .filter(id => {
              if (id === 'Sessions_List' || id === 'WorkoutShortcuts' || id === 'Trends' || id === 'Trends_Grid' || id === 'ActivityRing') return true;
              if (id === 'Sessions_Square' || id === 'Workout_Square') return true;
              if (id === 'SetCount' || id === 'StrengthLevel') return true;
              return id.includes('_');
            })
            .map(id => (
              <View
                key={id}
                style={{
                  width: isFullWidthCard(id) ? SCREEN_WIDTH - 32 : (SCREEN_WIDTH - 44) / 2,
                  position: 'relative',
                  overflow: 'visible',
                  zIndex: 1,
                }}
              >
                {renderSummaryCard(id)}
                {renderDeleteIcon(id)}
              </View>
            ))}
        </Sortable.Flex>

        {/* Bottom Buttons */}
        {!isEditing && (
          <>
            <View style={{ height: 20 }} />
            <View style={styles.separator} />
            <View style={{ height: 20 }} />

            <TouchableOpacity
              style={[styles.bottomLargeButton, { marginBottom: 10 }]}
              onPress={() => setIsEditing(true)}
              activeOpacity={1}
            >
              <Text style={styles.bottomLargeButtonText}>Edit Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomLargeButton}
              onPress={() => navigation.navigate('AllCategories')}
              activeOpacity={1}
            >
              <Text style={styles.bottomLargeButtonText}>See All Categories</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        visible={consistencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConsistencyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consistency</Text>
              <TouchableOpacity onPress={() => setConsistencyModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.modalMetricCircle, { backgroundColor: '#00C7BE20' }]}>
                <Text style={[styles.modalMetricValue, { color: '#00C7BE' }]}>{trendStats.consistency}%</Text>
              </View>
              <Text style={styles.modalLabel}>Workout Frequency</Text>
              <Text style={styles.modalDescription}>
                Your consistency score shows how regularly you've been working out over the past 7 days.
                {'\n\n'}
                A higher percentage indicates better workout consistency and discipline.
              </Text>
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>Days Active</Text>
                  <Text style={[styles.modalStatValue, { color: '#00C7BE' }]}>{Math.round((trendStats.consistency / 100) * 7)}/7</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={balanceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Balance</Text>
              <TouchableOpacity onPress={() => setBalanceModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.modalMetricCircle, { backgroundColor: '#D1A3FF20' }]}>
                <Text style={[styles.modalMetricValue, { color: '#D1A3FF' }]}>{trendStats.balance}%</Text>
              </View>
              <Text style={styles.modalLabel}>Training Variety</Text>
              <Text style={styles.modalDescription}>
                Your balance score reflects the variety in your training routine across different fitness metrics.
                {'\n\n'}
                A well-balanced workout routine targets multiple fitness dimensions for optimal health.
              </Text>
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>Metrics Used</Text>
                  <Text style={[styles.modalStatValue, { color: '#D1A3FF' }]}>{Math.round((trendStats.balance / 100) * 4)}/4</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={energyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEnergyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Energy</Text>
              <TouchableOpacity onPress={() => setEnergyModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.energy}20` }]}>
                <Text style={[styles.modalMetricValue, { color: MetricColors.energy }]}>{trendStats.energy}</Text>
                <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>KCAL/DAY</Text>
              </View>
              <Text style={styles.modalLabel}>Daily Energy Expenditure</Text>
              <Text style={styles.modalDescription}>
                Your average daily calorie burn from workouts over the past 7 days.
                {'\n\n'}
                Tracking energy expenditure helps you maintain a healthy balance between activity and nutrition.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={strengthModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStrengthModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Strength</Text>
              <TouchableOpacity onPress={() => setStrengthModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.weight}20` }]}>
                <Text style={[styles.modalMetricValue, { color: MetricColors.weight }]}>{trendStats.strength}</Text>
                <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>KG/DAY</Text>
              </View>
              <Text style={styles.modalLabel}>Training Volume</Text>
              <Text style={styles.modalDescription}>
                Your average daily training volume (weight × sets × reps) over the past 7 days.
                {'\n\n'}
                Higher volume indicates greater strength training intensity and progressive overload.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={setsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSetsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sets</Text>
              <TouchableOpacity onPress={() => setSetsModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.sets}20` }]}>
                <Text style={[styles.modalMetricValue, { color: MetricColors.sets }]}>{trendStats.sets}</Text>
                <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>SETS/DAY</Text>
              </View>
              <Text style={styles.modalLabel}>Daily Training Sets</Text>
              <Text style={styles.modalDescription}>
                Your average number of sets completed per day over the past 7 days.
                {'\n\n'}
                Consistent set completion demonstrates workout discipline and training adherence.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={enduranceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEnduranceModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Endurance</Text>
              <TouchableOpacity onPress={() => setEnduranceModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.modalMetricCircle, { backgroundColor: `${MetricColors.duration}20` }]}>
                <Text style={[styles.modalMetricValue, { color: MetricColors.duration }]}>{trendStats.endurance}</Text>
                <Text style={[styles.modalLabel, { fontSize: 14, marginBottom: 0, marginTop: 4 }]}>MIN/DAY</Text>
              </View>
              <Text style={styles.modalLabel}>Workout Duration</Text>
              <Text style={styles.modalDescription}>
                Your average daily workout duration over the past 7 days.
                {'\n\n'}
                Longer workout sessions build cardiovascular endurance and stamina over time.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Workout Metrics Modal - 9 Metric Grid */}
      <Modal
        visible={workoutMetricsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWorkoutMetricsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedWorkoutForMetrics 
                  ? allWorkouts.find(w => w.workoutId === selectedWorkoutForMetrics)?.name || 'Workout'
                  : 'Workout'} Metrics
              </Text>
              <TouchableOpacity onPress={() => setWorkoutMetricsModalVisible(false)} activeOpacity={1}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {selectedWorkoutForMetrics && workoutStats[selectedWorkoutForMetrics] && (() => {
                const stats = workoutStats[selectedWorkoutForMetrics];
                const workout = allWorkouts.find(w => w.workoutId === selectedWorkoutForMetrics);
                const metricsData = [
                  { label: 'Sets', value: stats.weeklySets || 0, todayValue: stats.sets || 0, unit: 'SET', color: MetricColors.sets, chart: stats.charts?.weeklySets || [] },
                  { label: 'Strength', value: stats.weeklyStrength || 0, todayValue: stats.strength || 0, unit: 'KG', color: MetricColors.weight, chart: stats.charts?.weeklyStrength || [] },
                  { label: 'Energy', value: stats.weeklyEnergy || 0, todayValue: stats.energy || 0, unit: 'KCAL', color: MetricColors.energy, chart: stats.charts?.weeklyEnergy || [] },
                  { label: 'Cadence', value: stats.weeklyCadence || 0, todayValue: stats.cadence || 0, unit: 's/r', color: MetricColors.speed, chart: stats.charts?.weeklyCadence || [] },
                  { label: 'Intensity', value: stats.weeklyIntensity || '0:1', todayValue: stats.intensity || '0:1', unit: '', color: MetricColors.energy, chart: stats.charts?.weeklyIntensity || [] },
                  { label: 'Density', value: stats.weeklyDensity || 0, todayValue: stats.density || 0, unit: '%', color: '#9DEC2C', chart: stats.charts?.weeklyDensity || [] },
                  { label: 'Consistency', value: stats.weeklyConsistency || 0, todayValue: stats.consistency || 0, unit: '%', color: '#00C7BE', chart: stats.charts?.weeklyConsistency || [] },
                  { label: 'Endurance', value: stats.weeklyEndurance || 0, todayValue: stats.endurance || 0, unit: 'MIN', color: MetricColors.duration, chart: stats.charts?.weeklyEndurance || [] },
                  { label: 'Balance', value: stats.weeklyBalance || 0, todayValue: stats.balance || 0, unit: '%', color: '#D1A3FF', chart: stats.charts?.weeklyBalance || [] },
                ];
                const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                
                return (
                  <View style={{ paddingBottom: 20 }}>
                    {metricsData.map((metric, idx) => {
                      const maxVal = Math.max(...metric.chart.slice(0, 7), 1);
                      return (
                        <View key={idx} style={[styles.workoutMetricCard, { marginBottom: 12 }]}>
                          <Text style={styles.workoutMetricLabel}>{metric.label}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
                            <Text style={[styles.workoutMetricValue, { color: metric.color, fontSize: 24 }]}>{metric.value}</Text>
                            <Text style={[styles.workoutUnit, { color: metric.color, fontSize: 14, marginLeft: 4 }]}>{metric.unit}</Text>
                          </View>
                          <View style={styles.workoutChartContainer}>
                            {metric.chart.slice(0, 7).map((val: number, i: number) => {
                              const barHeight = (val / maxVal) * 30;
                              return (
                                <React.Fragment key={i}>
                                  {i === 0 && (
                                    <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                  )}
                                  <View style={{ alignItems: 'center', width: '12%', justifyContent: 'flex-end', height: '100%' }}>
                                    <View style={[styles.bar, { width: 6, height: Math.max(barHeight, 3), backgroundColor: metric.color, borderRadius: 3 }]} />
                                    <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4 }}>{weekDays[i]}</Text>
                                  </View>
                                  <View style={{ width: 0.8, height: 42, backgroundColor: '#606166', alignSelf: 'flex-end', marginBottom: 2 }} />
                                </React.Fragment>
                              );
                            })}
                          </View>
                          <Text style={styles.workoutTodayFooter}>
                            <Text style={{ color: '#8E8E93' }}>Today: </Text>
                            <Text style={{ color: metric.color }}>{metric.todayValue} {metric.unit}</Text>
                          </Text>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={[styles.startWorkoutButton, { marginTop: 8 }]}
                      onPress={() => {
                        setWorkoutMetricsModalVisible(false);
                        if (workout) {
                          timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="play-circle" size={20} color="#000" />
                      <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AddSummaryCardModal
        visible={addCardModalVisible}
        onClose={() => setAddCardModalVisible(false)}
        onCardAdded={() => {
          loadDailyData();
        }}
      />

      {/* Workout Day Re-add Modal */}
      <Modal
        visible={workoutDayModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setWorkoutDayModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000', padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 20 }}>
            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '700' }}>Hidden Workout Days</Text>
            <TouchableOpacity onPress={() => setWorkoutDayModalVisible(false)}>
              <Feather name="x" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 20 }}>
            Tap a workout day to show it again in your summary
          </Text>
          
          <ScrollView>
            {hiddenWorkoutDays.map((day) => (
              <TouchableOpacity
                key={day}
                style={{
                  backgroundColor: '#1C1C1E',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onPress={() => {
                  handleShowWorkoutDay(day);
                  if (hiddenWorkoutDays.length === 1) {
                    setWorkoutDayModalVisible(false);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={22} color="#9DEC2C" />
                  <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '600', marginLeft: 12 }}>{day}</Text>
                </View>
                <Feather name="plus-circle" size={24} color="#9DEC2C" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    cardFront: {
      // Matches AddSummaryCardModal's cardFront for single grafikli Workout cards
      top: 0,
      left: 0,
      zIndex: 3,
      position: 'relative',
      width: '100%',
      backgroundColor: '#2A292A',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      justifyContent: 'space-between',
      height: 171,
    },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 44,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  gridContainer: {
    position: 'relative',
    marginHorizontal: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    height: 210,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 0,
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  arrowCircle: {
    position: 'absolute',
    top: 0,
    left: 55,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9104F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStats: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 17,
    color: '#FFF',
    marginBottom: 0,
  },
  activityCurrent: {
    fontSize: 28,
    fontWeight: '600',
  },
  activityUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 10,
  },
  halfCard: {
    width: SquareCardMeasurements.cardWidth,
    height: SquareCardMeasurements.cardHeight,
    backgroundColor: SUMMARY_CARD_BG_COLOR, // Default for all new cards
    borderRadius: SquareCardMeasurements.borderRadius,
    padding: SquareCardMeasurements.padding,
    justifyContent: 'space-between',
  },
  subLabel: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 30,
    fontWeight: '500',
    marginBottom: 8,
  },
  unit: {
    fontSize: 22,
    fontWeight: '500',
  },
  // Modal ile uyumlu yeni eklenenler
  workoutCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: -4,
  },
  workoutSubLabel: {
    fontSize: 13,
    color: '#FFF',
    marginTop: 4,
  },
  workoutMetricValue: {
    fontSize: 30,
    fontWeight: '700',
  },
  workoutUnit: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 2,
  },
  workoutChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 55,
    marginTop: -2,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  workoutTodayFooter: {
    color: '#FFF',
    fontSize: 13,
    marginTop: -12,
    fontWeight: '500',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    marginBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  chartLabelsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabelText: {
    fontSize: 10,
    color: '#8E8E93',
    backgroundColor: '#2A292A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    textAlign: 'center',
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  sectionCard: {
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 2,
    marginBottom: 0,
    overflow: 'hidden',
  },
  sessionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  sessionInfo: {
    flex: 1,
  },
  sessionWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  sessionMetric: {
    fontSize: 29,
    color: MetricColors.energy,
    fontWeight: '600',
  },
  sessionUnit: {
    fontSize: 19,
    color: MetricColors.energy,
    fontWeight: '700',
  },
  sessionDateLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workoutShortcutCard: {
    width: (SCREEN_WIDTH - 32 - 16 - 8) / 2,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderWidth: 0,
    height: 80,
  },
  shortcutName: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'left',
  },
  deleteIconContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9DEC2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 0,
  },
  bottomLargeButton: {
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
  },
  bottomLargeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9DEC2C',
  },
  headerIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9DEC2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: SUMMARY_CARD_BG_COLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalMetricCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalMetricValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalStats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  workoutMetricCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  workoutMetricLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  startWorkoutButton: {
    backgroundColor: '#9DEC2C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 4,
  },
  startWorkoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

const TrendSquareCardAnimated = ({ card }: { card: any }) => {
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  return (
    <View style={[TrendsSquareCardStyle.trendSquareCard, { height: '100%', backgroundColor: SUMMARY_CARD_BG_COLOR }]}> 
      <Text style={TrendsSquareCardStyle.trendSquareHeader}>Trends</Text>
      <View style={[TrendsSquareCardStyle.trendSquareIconWrapper, { overflow: 'hidden', backgroundColor: '#2A292A' }]}> 
        <RNAnimated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
          <Feather name="chevron-down" size={48} color={card.color} />
        </RNAnimated.View>
      </View>
      <Text style={TrendsSquareCardStyle.trendSquareLabel}>{card.title}</Text>
      <Text style={[TrendsSquareCardStyle.trendSquareValue, { color: card.color }]}> 
        {card.val} {card.unit}
      </Text>
    </View>
  );
};


const TrendGridIconAnimated = ({ color }: { color: string }) => {
  return (
    <View style={[TrendsSquareCardStyle.trendIconDown, { overflow: 'hidden', backgroundColor: '#2A292A' }]}> 
      <Feather name="chevron-down" size={38} color={color} />
    </View>
  );
};
