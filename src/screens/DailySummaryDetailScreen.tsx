import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, StatusBar, Modal, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { calculateCalories } from '../utils/CalorieCalculator';
import { allWorkouts, Workout } from '../constants/workoutData';
import MetricColors from '../constants/MetricColors';
import { LiquidGlass, LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';
import { loadWorkoutSettings } from '../utils/WorkoutSettingsManager';
import { calculate1RM, calculateStrengthRatio, DEFAULT_BODY_WEIGHT_KG, calculateDSI, calculateWSI, getDSILevelLabel, getDSILevelColor, LiftData } from '../utils/StrengthCalculator';
import { getDSIForSession, getTotalVolume, getActiveTime, getRestTime, getCalories, get1RM } from '../utils/SessionSnapshotReader';
import { Swipeable } from 'react-native-gesture-handler';
import { saveWorkoutSettings } from '../utils/WorkoutSettingsManager';
import { collectibleWorkouts, collectibleRarityColors } from '../constants/collectibleWorkouts';
import { loadWorkoutDayCards, WORKOUT_DAY_MUSCLE_GROUPS } from '../utils/WorkoutDayManager';
import { parseStoredBodyWeight } from '../constants/bodyWeight';

const EVENTS_STORAGE_KEY = '@workout_calendar_events';

type DailySummaryDetailScreenProps = StackScreenProps<RootStackParamList, 'DailySummaryDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DailySummaryDetailScreen({ navigation, route }: DailySummaryDetailScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  const [selectedDate, setSelectedDate] = useState(() => {
    if (route.params?.date) {
      return new Date(route.params.date);
    }
    return new Date();
  });

  // Header Animations
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [10, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [50, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyTitleTranslateY = scrollY.interpolate({
    inputRange: [50, 80],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });
  const [dailyVolume, setDailyVolume] = useState(0);
  const [dailyVolumeGoal, setDailyVolumeGoal] = useState(1000);
  const [weeklyRM, setWeeklyRM] = useState(0);
  const [weeklyRMGoal, setWeeklyRMGoal] = useState(1500);
  const [max1RM, setMax1RM] = useState(0);
  const [dailyRatio, setDailyRatio] = useState(0);
  const [userBodyWeight, setUserBodyWeight] = useState(75);
  const [volumeData, setVolumeData] = useState<number[]>(new Array(24).fill(0));
  const [weekData, setWeekData] = useState<{ day: string, date: Date, progress: number, isSelected: boolean }[]>([]);

  // New State Variables
  const [totalSets, setTotalSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [plannedSets, setPlannedSets] = useState(0);
  const [plannedReps, setPlannedReps] = useState(0);
  const [plannedVolume, setPlannedVolume] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [dailyWorkouts, setDailyWorkouts] = useState<any[]>([]); // These will be planned workouts
  const [actualSessions, setActualSessions] = useState<any[]>([]);
  const [plannedSettings, setPlannedSettings] = useState<{ [key: string]: any }>({});
  const [dailyStrengthIndex, setDailyStrengthIndex] = useState(0);       // DSI - normalized strength score
  const [weeklyStrengthIndex, setWeeklyStrengthIndex] = useState(0);     // WSI - 7-day moving average

  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const buttonRef = useRef<View>(null);
  const ringScrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Animation value for the menu (kept for button animations only)
  const menuAnimation = useRef(new Animated.Value(0)).current;

  // Helper to get local date string (YYYY-MM-DD) without UTC shift
  const getLocalDateString = useCallback((date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  }, []);

  // Mock data for things we don't track yet
  const [steps, setSteps] = useState(387);
  const [distance, setDistance] = useState(0.32);
  const [flights, setFlights] = useState(1);

  const loadData = useCallback(async (dateOverride?: Date) => {
    try {
      const targetDate = dateOverride || selectedDate;

      const storedSummaries = await AsyncStorage.getItem('workoutSummaries');
      const storedEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);

      const allSummaries = storedSummaries ? JSON.parse(storedSummaries) : [];
      const allEvents = storedEvents ? JSON.parse(storedEvents) : [];

      // Helper to calculate volume for an event
      const getEventGoalVolume = async (event: any) => {
        const result = { volume: 0, sets: 0, reps: 0 };
        if (!event || !event.workoutIds) return result;

        for (const wId of event.workoutIds) {
          const settings = await loadWorkoutSettings(wId);
          const weight = settings.weight ? parseFloat(settings.weight) : 75;
          const sets = settings.targetSets ? parseInt(settings.targetSets) : 3;
          const reps = settings.targetReps ? parseInt(settings.targetReps) : 6;
          result.volume += weight * sets * reps;
          result.sets += sets;
          result.reps += reps;
        }
        return result;
      };

      // 1. Calculate Week Data (Mon-Sun) based on the selected date's week
      const currentDay = targetDate.getDay(); // 0 is Sunday
      const diff = targetDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday
      const monday = new Date(targetDate);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const wData = [];
      const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      let totalWRM = 0;
      let totalWRMGoal = 0;
      let dayMax1RM = 0;
      let currentDayDSI = 0;
      const allWeekDSIs: number[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dayStr = getLocalDateString(d);

        // ACTUALS for this day
        const daySummaries = allSummaries.filter((s: any) => {
          const sd = new Date(s.date);
          return sd.getDate() === d.getDate() &&
            sd.getMonth() === d.getMonth() &&
            sd.getFullYear() === d.getFullYear();
        });

        let dayActualVolume = 0;
        let dayActualMax1RM = 0;
        const dData = new Array(24).fill(0);
        daySummaries.forEach((item: any) => {
          const volume = getTotalVolume(item).value ?? 0;
          dayActualVolume += volume;

          const item1RM = get1RM(item).value ?? 0;
          if (item1RM > dayActualMax1RM) dayActualMax1RM = item1RM;

          if (d.getDate() === targetDate.getDate()) {
            const h = new Date(item.date).getHours();
            dData[h] += volume;
          }
        });

        // PLANNED for this day - aggregate every scheduled event for the date; using only the first event drops data when multiple workouts are planned for the same day.
        const dayEvents = allEvents.filter((e: any) => e?.date && e.date.split('T')[0] === dayStr);
        const dayWorkoutIds = dayEvents.flatMap((event: any) => Array.isArray(event?.workoutIds) ? event.workoutIds : []);
        const plannedData = await getEventGoalVolume({ workoutIds: dayWorkoutIds });
        const dayGoalVolume = plannedData.volume || 1000;

        // Calculate planned 1RM from event workout settings (same as WorkoutEventDetailScreen)
        let plannedMax1RM = 0;
        const currentPlannedSettings: { [key: string]: any } = {};

        // NEW: If the day has scheduled events but no workoutIds, fallback to the first event's day type and saved cards.
        let effectiveWorkoutIds = dayWorkoutIds;
        const fallbackEvent = dayEvents[0];
        if (fallbackEvent && (!fallbackEvent.workoutIds || fallbackEvent.workoutIds.length === 0)) {
          const savedCards = await loadWorkoutDayCards(fallbackEvent.workoutDay);
          if (savedCards && savedCards.length > 0) {
            effectiveWorkoutIds = savedCards;
          } else {
            // Ultimate fallback based on muscle groups
            const muscleGroups = WORKOUT_DAY_MUSCLE_GROUPS[fallbackEvent.workoutDay] || [];
            effectiveWorkoutIds = allWorkouts
              .filter(w => muscleGroups.includes(w.muscleGroup))
              .slice(0, 4)
              .map(w => w.workoutId);
          }
        }

        if (daySummaries && daySummaries.length > 0) {
          // Compute day DSI from actual recorded session lifts (snapshot-first).
          const dayDSIValues: number[] = [];
          for (const s of daySummaries) {
            const res = getDSIForSession(s);
            if (res.value !== null) dayDSIValues.push(res.value);
          }
          const dayDSI = dayDSIValues.length > 0 ? (dayDSIValues.reduce((a, b) => a + b, 0) / dayDSIValues.length) : 0;
          allWeekDSIs.push(dayDSI);

          if (d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth()) {
            currentDayDSI = dayDSI;
          }
        } else {
          // No actual sessions for this day; push zero as placeholder
          allWeekDSIs.push(0);
        }

        // Use the higher of actual or planned 1RM for the day
        dayMax1RM = Math.max(dayMax1RM, plannedMax1RM);

        // Update totalWRM from planned workouts
        totalWRM += plannedMax1RM;
        totalWRMGoal += plannedMax1RM > 0 ? plannedMax1RM : 300; // Use planned 1RM as goal, fallback to 300

        if (d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth()) {
          // Use actual historical 1RM when available; keep planned 1RM as a separate preview metric.
          dayMax1RM = dayActualMax1RM > 0 ? dayActualMax1RM : plannedMax1RM;

          setDailyVolume(dayActualVolume);
          setDailyVolumeGoal(dayGoalVolume);
          setVolumeData(dData);
          setMax1RM(dayMax1RM);
          setPlannedSettings(currentPlannedSettings);

          // Load user body weight from storage
          const storedBodyWeight = await AsyncStorage.getItem('userBodyWeight');
          const bw = parseStoredBodyWeight(storedBodyWeight);
          setUserBodyWeight(bw);
          setDailyRatio(calculateStrengthRatio(dayMax1RM, bw));

          setTotalSets(daySummaries.reduce((acc: number, s: any) => acc + (s.completedSets || 0), 0));
          setTotalReps(daySummaries.reduce((acc: number, s: any) => acc + (s.completedReps || 0), 0));
          setPlannedSets(plannedData.sets);
          setPlannedReps(plannedData.reps);
          setPlannedVolume(plannedData.volume);

          const validWorkoutIds = (effectiveWorkoutIds || []).filter((id: string) =>
            allWorkouts.some(w => w.workoutId === id || w.id === id)
          );

          setWorkoutCount(validWorkoutIds.length);
          setDailyWorkouts(validWorkoutIds);
          setActualSessions(daySummaries);
        }

        wData.push({
          day: weekDays[i],
          date: new Date(d),
          progress: Math.min((dayMax1RM / 300) * 100, 100),
          isSelected: d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth()
        });
      }

      setWeekData(wData);
      setWeeklyRM(totalWRM);
      setWeeklyRMGoal(totalWRMGoal || 2100);
      setDailyStrengthIndex(currentDayDSI);
      setWeeklyStrengthIndex(calculateWSI(allWeekDSIs));

    } catch (e) {
      console.error("Error loading data:", e);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData(selectedDate);
    }, [selectedDate, loadData])
  );

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    loadData(today);
  }, []);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  useEffect(() => {
    // Scroll the ring ScrollView to the selected day
    const dayIndex = selectedDate.getDay();
    const mondayOffsetDay = dayIndex === 0 ? 6 : dayIndex - 1;
    if (ringScrollViewRef.current && !isScrolling) {
      setTimeout(() => {
        ringScrollViewRef.current?.scrollTo({
          x: mondayOffsetDay * SCREEN_WIDTH,
          animated: false, // Use false for initial render to prevent visual jump, or true if user prefers
        });
      }, 100);
    }
  }, [selectedDate]);

  const handleRingScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);

    // Get the Monday of the current week
    const currentDay = selectedDate.getDay();
    const diff = selectedDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(selectedDate);
    monday.setDate(diff);

    const newDate = new Date(monday);
    newDate.setDate(monday.getDate() + index);

    if (newDate.getDate() !== selectedDate.getDate()) {
      setIsScrolling(true);
      setSelectedDate(newDate);
      setTimeout(() => setIsScrolling(false), 500);
    }
  };



  const handleCompleteWorkout = async (wId: string) => {
    try {
      const settings = await loadWorkoutSettings(wId);
      const now = new Date();
      const newSession = {
        id: `session_${Date.now()}`,
        workoutId: wId,
        workoutName: allWorkouts.find(w => w.workoutId === wId)?.name || 'Workout',
        date: now.toISOString(),
        elapsedTime: 3600, // Mock 1 hour
        completedSets: settings.targetSets ? parseInt(settings.targetSets) : 3,
        completedReps: settings.targetReps ? parseInt(settings.targetReps) : 6,
        settings: settings,
      };

      const stored = await AsyncStorage.getItem('workoutSummaries');
      const summaries = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('workoutSummaries', JSON.stringify([...summaries, newSession]));

      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const renderWorkoutActions = (progress: any, dragX: any, wId: string) => {
    const BUTTON_SIZE = 56;

    const circleScale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const bodyScaleX = dragX.interpolate({
      inputRange: [-400, -80],
      outputRange: [320, 0],
      extrapolate: 'clamp',
    });

    const bodyTranslateX = dragX.interpolate({
      inputRange: [-400, -80],
      outputRange: [-160, 0],
      extrapolate: 'clamp',
    });

    const iconScale = dragX.interpolate({
      inputRange: [-100, -60, 0],
      outputRange: [1.2, 1, 0.5],
      extrapolate: 'clamp',
    });

    const iconTranslateX = dragX.interpolate({
      inputRange: [-400, -80, 0],
      outputRange: [130, 0, 0],
      extrapolate: 'clamp',
    });

    const leftCapTranslateX = dragX.interpolate({
      inputRange: [-400, -80, 0],
      outputRange: [-320, 0, 0],
      extrapolate: 'clamp',
    });

    const rightCapOpacity = dragX.interpolate({
      inputRange: [-85, -80],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ width: 80, justifyContent: 'center', alignItems: 'flex-end' }}>
        <View style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Right Cap (Stationary Base) */}
          <Animated.View
            style={{
              position: 'absolute',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: '#9DEC2C',
              opacity: rightCapOpacity,
              zIndex: 0,
            }}
          />

          {/* Body (Expanding Background) */}
          <Animated.View
            style={{
              position: 'absolute',
              height: BUTTON_SIZE,
              width: 1,
              backgroundColor: '#9DEC2C',
              transform: [
                { translateX: bodyTranslateX },
                { scaleX: bodyScaleX }
              ],
              zIndex: 1,
            }}
          />

          {/* Left Cap (The Moving Head with Icon) */}
          <Animated.View
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: '#9DEC2C',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [
                { translateX: leftCapTranslateX },
                { scale: circleScale }
              ],
              zIndex: 2,
            }}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }, { translateX: iconTranslateX }] }}>
              <Feather name="check" size={24} color="#000" />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  };

  const formatDate = () => {
    const today = new Date();
    const isToday = selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleString('en-US', { month: 'short' });
    const year = selectedDate.getFullYear();
    const dateStr = `${day} ${month} ${year}`;
    return isToday ? `${dateStr} Today` : dateStr;
  };

  const handleOpenMenu = () => {
    const { height } = Dimensions.get('window');
    setMenuPosition({ top: height * 0.45, right: 20 });
    setShowGoalMenu(true);
  };

  const handleAdjustGoal = () => {
    setShowGoalMenu(false);
    navigation.navigate('AdjustMoveGoal');
  };

  const handleChangeSchedule = () => {
    setShowGoalMenu(false);
    navigation.navigate('MoveGoalSchedule');
  };

  const renderGraph = () => {
    const maxVal = Math.max(...volumeData, 10); // Minimum scale
    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphBars}>
          {/* Horizontal Grid Lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: '33%' }]} />
          <View style={[styles.gridLine, { top: '66%' }]} />
          <View style={[styles.gridLine, { bottom: 0, backgroundColor: MetricColors.weight }]} />

          {/* Total Label inside graph area, under top grid line */}
          <Text style={styles.graphTotalLabelAbsolute}>TOTAL {Math.round(dailyVolume).toLocaleString()}KG/DAY</Text>

          {volumeData.map((val, i) => (
            <View key={i} style={styles.barContainer}>
              {val > 0 && (
                <View style={[styles.bar, { height: (val / maxVal) * 60, backgroundColor: MetricColors.weight }]} />
              )}
            </View>
          ))}
          {/* Current Time Indicator Line (Mocked at 06:00 for visual match or dynamic) */}
          <View style={[styles.timeLine, { left: '25%' }]} />
        </View>
        <View style={styles.graphLabels}>
          <Text style={styles.graphLabel}>00:00</Text>
          <Text style={styles.graphLabel}>06:00</Text>
          <Text style={styles.graphLabel}>12:00</Text>
          <Text style={styles.graphLabel}>18:00</Text>
        </View>
      </View>
    );
  };

  const menuScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const buttonOpacity = menuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const buttonScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const buttonTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const menuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fixed Blurred Header */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 180,
          opacity: headerBgOpacity,
          zIndex: 0,
        }} pointerEvents="none">
          <LinearGradient
            colors={["#000000", "#000000", "#000000", "rgba(0,0,0,0.8)", "transparent"]}
            locations={[0, 0.4, 0.6, 0.85, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="chevron-left" size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerDateTitle}>{formatDate()}</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('SummaryOverview', {
                openCalendar: true,
                selectedDate: selectedDate.toISOString()
              })}
            >
              <MaterialCommunityIcons name="calendar-month" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Weekly Row (Now Sticky inside Header) */}
        <View style={[styles.weekRow, { marginBottom: 0, paddingBottom: 10 }]}>
          {weekData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.weekDayContainer}
              onPress={() => setSelectedDate(item.date)}
            >
              <View style={[styles.dayLabelContainer, item.isSelected && styles.selectedDayLabelContainer]}>
                <Text style={[
                  item.isSelected ? styles.selectedDayText : (item.date.toDateString() === new Date().toDateString() ? { color: '#F9104E' } : styles.weekDayText)
                ]}>
                  {item.day}
                </Text>
              </View>
              <View style={styles.smallRingContainer}>
                <AnimatedCircularProgress
                  size={40}
                  width={7}
                  fill={item.progress}
                  tintColor="#F9104E"
                  backgroundColor="#3E0E18"
                  rotation={0}
                  lineCap="round"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={{ height: 0 }} />
        {/* Goal Button - Fixed between Calendar and Ring */}

        {/* Main Ring Area with Paging Scroll */}
        <View style={{ height: 320, marginVertical: 10 }}>
          <ScrollView
            ref={ringScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleRingScroll}
            scrollEventThrottle={16}
          >
            {weekData.map((dayItem, idx) => (
              <View key={idx} style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.mainRingContainer}>
                  <View style={{ width: 250, height: 250 }}>
                    <AnimatedCircularProgress
                      size={250}
                      width={50}
                      fill={dayItem.progress}
                      tintColor="#F9104E"
                      backgroundColor="#3E0E18"
                      rotation={0}
                      lineCap="round"
                    />
                    <View style={styles.arrowContainer}>
                      <View style={[styles.arrowCircle, { backgroundColor: '#F9104E' }]}>
                        <Feather name="arrow-right" size={30} color="#000" />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Move Stats */}
        <View style={[styles.moveStatsContainer, { zIndex: 10 }]}>
          <View>
            <Text style={styles.moveLabel}>WSI (Weekly Strength Index)</Text>
            <Text style={styles.moveValue}>
              <Text style={[styles.moveCurrent, styles.moveValue, { color: getDSILevelColor(weeklyStrengthIndex) }]}>{weeklyStrengthIndex.toFixed(2)}</Text>
              <Text style={[styles.moveGoal, styles.moveValue, { color: 'rgba(255,255,255,0.4)' }]}> {getDSILevelLabel(weeklyStrengthIndex)}</Text>
            </Text>
          </View>

          <Animated.View style={{ opacity: buttonOpacity, transform: [{ scale: buttonScale }, { translateX: buttonTranslateX }] }}>
            <TouchableOpacity
              ref={buttonRef}
              style={styles.goalButton}
              onPress={handleOpenMenu}
              disabled={showGoalMenu}
            >
              <View style={styles.goalButtonInner}>
                <Text style={styles.goalButtonText}>- +</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Graph */}
        <View style={styles.graphSection}>
          {renderGraph()}
        </View>

        {/* Strength Intensity Stats */}
        <View style={[styles.statsRow, { marginTop: 0, marginBottom: 12, flexWrap: 'wrap' }]}>
          <View style={[styles.statItem, { flex: 0, marginRight: 24, marginBottom: 8 }]}>
            <Text style={styles.statLabel}>Max 1RM</Text>
            <Text style={styles.statValue}>
              <Text style={{ color: '#F9104E' }}>{Math.round(max1RM)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}> KG</Text>
            </Text>
          </View>
          <View style={[styles.statItem, { flex: 0, marginRight: 24, marginBottom: 8 }]}>
            <Text style={styles.statLabel}>Daily Strength Index</Text>
            <Text style={styles.statValue}>
              <Text style={{ color: getDSILevelColor(dailyStrengthIndex) }}>{dailyStrengthIndex.toFixed(2)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}> DSI</Text>
            </Text>
          </View>
          <View style={[styles.statItem, { flex: 0, marginBottom: 8 }]}>
            <Text style={styles.statLabel}>Relative Strength (1RM/BW)</Text>
            <Text style={styles.statValue}>
              <Text style={{ color: '#00C7BE' }}>{dailyRatio.toFixed(2)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}> x{userBodyWeight}kg</Text>
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.divider} />

        <View style={styles.listItem}>
          <View>
            <Text style={styles.statLabel}>Workout Cards</Text>
            <Text style={[styles.statValue, { marginTop: 4 }]}>
              <Text style={{ color: '#FFF' }}>{actualSessions.length}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>/{workoutCount || 0}</Text>
            </Text>
          </View>
        </View>




        {/* Workouts Container */}
        <View style={styles.workoutsContainer}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          <View style={styles.workoutsList}>
            {dailyWorkouts.map((wId, index) => {
              const workoutDef = allWorkouts.find(w => w.workoutId === wId || w.id === wId);
              const actualSession = actualSessions.find(s => s.workoutId === wId);
              const WorkoutIcon = workoutDef?.SvgIcon;

              const planned = plannedSettings[wId];

              const displayWeight = actualSession?.settings?.weight
                ? actualSession.settings.weight
                : (planned?.weight || 0);

              const workoutName = workoutDef?.name || 'Workout';
              let defaultSets = 3;
              let defaultReps = 6;
              const match = workoutName.match(/(\d+)[xX](\d+)/);
              if (match) {
                defaultSets = parseInt(match[1]);
                defaultReps = parseInt(match[2]);
              }

              const displayRepsSetting = actualSession
                ? `${actualSession.completedSets || 0}x${actualSession.completedReps || 0}`
                : `${planned?.targetSets || String(defaultSets)}x${planned?.targetReps || String(defaultReps)}`;

              const collectibleDef = collectibleWorkouts.find(cw => cw.id === wId || cw.name === workoutDef?.name);
              const cardRarity = collectibleDef?.rarity || 'BRONZE';
              const cardColors = collectibleRarityColors[cardRarity];

              return (
                <Swipeable
                  key={index}
                  renderRightActions={(progress, dragX) => renderWorkoutActions(progress, dragX, wId)}
                  onSwipeableOpen={() => handleCompleteWorkout(wId)}
                  friction={1.25}
                  rightThreshold={40}
                  overshootRight={true}
                  useNativeAnimations={false}
                >
                  <View style={styles.workoutCard}>
                    <LinearGradient
                      colors={['#122003', '#213705']}
                      style={[styles.workoutIconContainer, { width: 50, height: 50, borderRadius: 25 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {WorkoutIcon ? (
                        <WorkoutIcon width={30} height={30} fill="#9DEC2C" />
                      ) : (
                        <MaterialCommunityIcons name="dumbbell" size={26} color="#9DEC2C" />
                      )}
                    </LinearGradient>
                    <View style={styles.workoutInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.workoutTitle} numberOfLines={1}>{workoutDef?.name || 'Workout'}</Text>
                        {actualSession && (
                          <View style={styles.workoutStatusContainer}>
                            <Text style={[styles.workoutStatusLabel, { color: '#9DEC2C' }]}>
                              DONE
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={[styles.workoutValue, { color: '#9DEC2C' }]}>{displayWeight}</Text>
                        <Text style={[styles.workoutUnit, { color: '#9DEC2C' }]}>KG</Text>
                        <Text style={[styles.workoutSeparator, { color: '#9DEC2C' }]}> / </Text>
                        <Text style={[styles.workoutValue, { color: '#9DEC2C' }]}>{displayRepsSetting}</Text>
                        <Text style={[styles.workoutUnit, { color: '#9DEC2C' }]}>REPS</Text>
                      </View>
                    </View>
                  </View>
                </Swipeable>
              );
            })}
          </View>
        </View>

        <View style={{ height: 140 }} />

      </Animated.ScrollView>

      {/* Modal for Menu */}
      <Modal
        transparent
        visible={showGoalMenu}
        animationType="fade"
        onRequestClose={() => setShowGoalMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGoalMenu(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.menuAnimatedWrapper,
            {
              top: menuPosition.top,
              right: menuPosition.right,
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="circle-slice-8" size={20} color="#FFF" />}
              label="Adjust Goal for Today"
              onPress={handleAdjustGoal}
            />
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="calendar-month" size={20} color="#FFF" />}
              label="Change Schedule"
              onPress={handleChangeSchedule}
            />
          </LiquidGlassCard>
        </View>
      </Modal >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  headerBlurContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
  },
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 24,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 180, // Increased to account for two-row fixed header
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  weekDayContainer: {
    alignItems: 'center',
  },
  dayLabelContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  selectedDayLabelContainer: {
    backgroundColor: '#F9104E',
  },
  weekDayText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  smallRingContainer: {
    alignItems: 'center',
  },
  mainRingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arrowCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: '#FA114F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  moveLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  moveValue: {
    fontSize: 36,
    fontWeight: '600',
    color: MetricColors.energy,
  },
  moveCurrent: {
    color: MetricColors.energy,
    fontSize: 36,
    fontWeight: '600',
  },
  moveGoal: {
    color: MetricColors.energy,
    fontSize: 36,
    fontWeight: '600',
  },
  kcalUnit: {
    color: '#F9104E',
    fontSize: 20,
    fontWeight: '600',
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E', // Lighter gray
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F9104E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonText: {
    color: '#F9104E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuAnimatedWrapper: {
    position: 'absolute',
    zIndex: 2000,
  },
  menuWrapper: {
    position: 'absolute',
    // top and right are set dynamically
    borderRadius: 36,
    overflow: 'hidden',
    width: 260,
    zIndex: 100, // Ensure it's on top
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  blurView: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 25,
    paddingLeft: 31,
  },
  menuIcon: {
    width: 20,
    marginRight: 12,
  },
  menuText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  graphSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  graphTotalLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 8,
  },
  graphTotalLabelAbsolute: {
    position: 'absolute',
    top: 4,
    left: 0,
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    zIndex: 10,
  },
  graphContainer: {
    height: 80,
    justifyContent: 'flex-end',
  },
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    justifyContent: 'space-between',
    marginBottom: 4,
    position: 'relative',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 2,
    backgroundColor: MetricColors.energy,
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  graphLabel: {
    color: '#8E8E93',
    fontSize: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
  },
  graphDottedLine: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#FA114F',
  },
  timeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: MetricColors.energy,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  statItem: {
    // flex: 1, // Removed to allow tighter spacing
  },
  statLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '500',
  },
  stickyTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stickyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginLeft: 20,
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 9,
    marginTop: 20,
  },
  workoutsList: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242426',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 50,
    marginBottom: 12,
  },
  workoutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  workoutValue: {
    color: '#9DEC2C',
    fontSize: 22,
    fontWeight: '500',
  },
  workoutUnit: {
    color: '#9DEC2C',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  workoutSeparator: {
    color: '#9DEC2C',
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  workoutDateLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'center',
  },
  workoutStatusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 8,
  },
  workoutStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
