import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import {
  Dimensions,
  View,
  TouchableOpacity,
  Text,
  ImageBackground,
  Animated,
  StyleSheet,
  Image,
  StatusBar,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import LEDDigit from '../components/LEDDigit';
import { LEDCircle, LEDCircleWithDigit } from '../components/LEDCircleComponents';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { wallpapers } from '../constants/wallpapers';
import { allWorkouts } from '../constants/workoutData';

type TimerScreenNavigationProps = StackScreenProps<RootStackParamList, 'Timer'>;

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const POSITIONS = {
  TIMER_CENTER_TOP: SCREEN_HEIGHT * 0.45,
  STATS_TOP: SCREEN_HEIGHT * 0.20,
  CONTROL_PANEL_HEIGHT: 240,
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressCircleProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  borderColor: string;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  borderColor,
}) => {
  const safeProgress = isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeProgress * circumference);

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={borderColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export function TimerScreen({ route, navigation }: TimerScreenNavigationProps) {
  // Route params
  const { workoutId, workoutName } = route.params || {};
  const {
    settings,
    modeType,
    initialGreenTime,
    initialRestTime,
    initialGreenReps,
    initialRedReps,
    initialGreenCountdownSpeed,
    initialRedCountdownSpeed,
    initialInfiniteLoopTime,
    initialInfiniteSpeed,
    initialCycleTrackingEnabled,
    initialLoopPhase,
  } = route.params || {};

  // Contexts
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext || !timerContext) {
    throw new Error('TimerScreen must be used within ThemeProvider and TimerProvider');
  }

  const { colors } = themeContext;

  const currentWorkout = useMemo(() => {
    return allWorkouts.find(w => w.id === workoutId || w.name === workoutName);
  }, [workoutId, workoutName]);

  // Show WeightIcon for weight cards if not found in allWorkouts
  let WorkoutIcon = currentWorkout?.SvgIcon;
  if (!WorkoutIcon && (workoutName?.toLowerCase() === 'weight' || workoutId === 'weight')) {
    const { WeightIcon } = require('../assets/icons');
    WorkoutIcon = WeightIcon;
  }

  const {
    setIsPaused: setGlobalIsPaused,
    wallpaper,
    totalElapsedTime,
    setTotalElapsedTime,
    weight,
  } = timerContext;

  // Timer settings
  const greenTime = initialGreenTime || '30';
  const restTime = initialRestTime || '15';
  const infiniteLoopTime = initialInfiniteLoopTime || '30';
  const greenReps = initialGreenReps || '3';
  const redReps = initialRedReps || '3';
  const greenCountdownSpeed = initialGreenCountdownSpeed || 1000;
  const redCountdownSpeed = initialRedCountdownSpeed || 1000;
  const infiniteSpeed = initialInfiniteSpeed || 1000;

  // State
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(initialCycleTrackingEnabled || false);
  const initialPhaseVal = initialLoopPhase === 'red' ? false : true;
  const [isGreenPhase, setIsGreenPhase] = useState(initialPhaseVal);
  const [isPaused, setIsPaused] = useState(true); // ✅ Başlangıçta durdurulmuş
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Countdown State
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdownStep, setCountdownStep] = useState<'ready' | 3 | 2 | 1>('ready');

  // Animation Values
  const countdownProgress = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(0.5)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  // Countdown Effect
  useEffect(() => {
    if (showCountdown) {
      const sequence = ['ready', 3, 2, 1] as const;
      const progressTargets = [1, 0.66, 0.33, 0]; // 0 to 1 range
      let stepIndex = 0;
      const stepDuration = 700;

      // Ensure initial state
      setCountdownStep('ready');
      countdownProgress.setValue(0);

      const runStep = () => {
        const targetProgress = progressTargets[stepIndex];

        // Animate Progress
        Animated.timing(countdownProgress, {
          toValue: targetProgress,
          duration: 250,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }).start();

        // Animate Text Entry
        countdownScale.setValue(0.5);
        countdownOpacity.setValue(0);

        Animated.parallel([
          Animated.spring(countdownScale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(countdownOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();

        // Schedule next step
        setTimeout(() => {
          stepIndex++;
          if (stepIndex >= sequence.length) {
            setTimeout(() => {
              setShowCountdown(false);
              setIsPaused(false);
              setWorkoutStarted(true);
            }, 400);
            return;
          }

          // Change Step Text
          const nextStep = sequence[stepIndex];
          setCountdownStep(nextStep);

          // Small delay before starting next progress animation
          setTimeout(() => {
            runStep();
          }, 20);
        }, stepDuration);
      };

      runStep();
    }
  }, [showCountdown]);

  const controlPanelY = useRef(new Animated.Value(POSITIONS.CONTROL_PANEL_HEIGHT)).current;

  // Count calculation
  const getInitialCount = () => {
    // Use param directly if state hasn't updated yet, or rely on effect?
    // Better to use the param for initial calculation if available
    const isCycle = initialCycleTrackingEnabled !== undefined ? initialCycleTrackingEnabled : cycleTrackingEnabled;
    if (isCycle) {
      return parseInt(initialPhaseVal ? greenTime : restTime);
    }
    return parseInt(infiniteLoopTime);
  };

  const [count, setCount] = useState(getInitialCount());
  const [completedGreenReps, setCompletedGreenReps] = useState(0);
  const completedGreenRepsRef = useRef(0);
  const [completedRedReps, setCompletedRedReps] = useState(0);
  const completedRedRepsRef = useRef(0);
  const localElapsedTimeRef = useRef(0);
  const greenLoopTimesRef = useRef<number[]>([]);
  const redLoopTimesRef = useRef<number[]>([]);
  const currentLoopStartTimeRef = useRef(Date.now());
  const workoutFinishedRef = useRef(false);

  // ✅ WORKOUT ID DEĞİŞTİĞİNDE RESET
  useEffect(() => {
    console.log('🔄 New workout detected, resetting timer...', workoutId);

    // Update cycleTrackingEnabled from params
    if (initialCycleTrackingEnabled !== undefined) {
      setCycleTrackingEnabled(initialCycleTrackingEnabled);
    }

    const isCycle = initialCycleTrackingEnabled !== undefined ? initialCycleTrackingEnabled : cycleTrackingEnabled;

    const newInitialCount = isCycle
      ? parseInt(initialPhaseVal ? greenTime : restTime)
      : parseInt(infiniteLoopTime);

    setCount(newInitialCount);
    setCompletedGreenReps(0);
    completedGreenRepsRef.current = 0;
    setCompletedRedReps(0);
    completedRedRepsRef.current = 0;
    setTotalElapsedTime(0);
    localElapsedTimeRef.current = 0;
    greenLoopTimesRef.current = [];
    redLoopTimesRef.current = [];
    currentLoopStartTimeRef.current = Date.now();
    setWorkoutStarted(false);
    workoutFinishedRef.current = false;
    setIsPaused(true); // ✅ Başlangıçta durdur
    setGlobalIsPaused(true);
    setIsGreenPhase(initialPhaseVal);

    console.log('✅ Timer reset complete');
  }, [workoutId]);

  // Workout progress
  const workoutProgress = useMemo(() => {
    // We count down to -1 (showing 00), so each phase effectively takes (time + 1) seconds.
    const effectiveGreenTime = parseInt(greenTime || '0') + 1;
    const effectiveRestTime = parseInt(restTime || '0') + 1;

    const totalWorkoutTime = cycleTrackingEnabled
      ? (effectiveGreenTime + effectiveRestTime) * parseInt(redReps || '1') * parseInt(greenReps || '1')
      : 60;

    if (!totalWorkoutTime || isNaN(totalWorkoutTime) || totalWorkoutTime === 0) return 0;

    const progress = totalElapsedTime / totalWorkoutTime;
    return isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 1);
  }, [totalElapsedTime, cycleTrackingEnabled, greenTime, restTime, redReps, greenReps]);

  const LAST_ACTIVITY_WORKOUT_ID_KEY = '@last_activity_workout_id';
  // ...
  // Save workout summary
  const saveWorkoutSummary = useCallback(
    async (finalSets: number, finalReps: number) => {
      if (workoutFinishedRef.current && completedGreenRepsRef.current > finalSets) {
        return;
      }

      try {
        const avgGreenLoopTime =
          greenLoopTimesRef.current.length > 0
            ? greenLoopTimesRef.current.reduce((a, b) => a + b, 0) /
            greenLoopTimesRef.current.length
            : 0;

        const avgRedLoopTime =
          redLoopTimesRef.current.length > 0
            ? redLoopTimesRef.current.reduce((a, b) => a + b, 0) /
            redLoopTimesRef.current.length
            : 0;

        // Calculate Metrics
        const currentWeight = parseFloat(settings?.weight || weight || '0');
        const totalVolume = !isNaN(currentWeight) ? finalSets * finalReps * currentWeight : 0;

        // Est. Kcal: ~7 kcal/min (Generic moderate intensity)
        const finalElapsedTime = localElapsedTimeRef.current > 0 ? localElapsedTimeRef.current : totalElapsedTime;
        const durationMins = finalElapsedTime / 60;
        const totalEstimatedKcal = Math.round(durationMins * 7);

        const summary = {
          date: new Date().toISOString(),
          workoutId: workoutId || `quick-${Date.now()}`,
          workoutName: workoutName || 'Quick Workout',
          modeType: modeType || 'standard',
          settings: settings || { greenTime, restTime, greenReps, redReps, cycleTrackingEnabled, weight } as any,
          elapsedTime: finalElapsedTime,
          type: cycleTrackingEnabled ? 'cycle' : 'infinite',
          completedSets: finalSets,
          completedReps: finalReps,
          totalVolume,
          totalEstimatedKcal,
          avgGreenLoopTime: Math.round(avgGreenLoopTime * 100) / 100,
          avgRedLoopTime: Math.round(avgRedLoopTime * 100) / 100,
          greenLoopTimes: greenLoopTimesRef.current,
          redLoopTimes: redLoopTimesRef.current,
          infiniteLoopTime: cycleTrackingEnabled ? null : infiniteLoopTime,
        };

        const existing = await AsyncStorage.getItem('workoutSummaries');
        let summaries = [];

        if (existing) {
          try {
            summaries = JSON.parse(existing);
            if (summaries.length > 100) {
              summaries = summaries.slice(-100);
            }
          } catch (e) {
            summaries = [];
          }
        }

        summaries.push(summary);
        await AsyncStorage.setItem('workoutSummaries', JSON.stringify(summaries));
        if (workoutId) {
          await AsyncStorage.setItem(LAST_ACTIVITY_WORKOUT_ID_KEY, workoutId);
        }
      } catch (e) {
        console.error('❌ Kayıt hatası:', e);
      }
    },
    [
      workoutId,
      workoutName,
      modeType,
      settings,
      greenTime,
      restTime,
      greenReps,
      redReps,
      cycleTrackingEnabled,
      infiniteLoopTime,
      totalElapsedTime,
      weight,
    ]
  );

  // Control panel animation
  useEffect(() => {
    if (isPaused) {
      Animated.spring(controlPanelY, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(controlPanelY, {
        toValue: POSITIONS.CONTROL_PANEL_HEIGHT,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [isPaused, controlPanelY]);

  // Handle play/pause press
  const handlePress = useCallback(() => {
    if (!workoutStarted) {
      setWorkoutStarted(true);
      setIsPaused(false);
      setGlobalIsPaused(false);
      console.log('▶️ Timer started');
    } else {
      const newPausedState = !isPaused;
      setIsPaused(newPausedState);
      setGlobalIsPaused(newPausedState);
      console.log(newPausedState ? '⏸️ Timer paused' : '▶️ Timer resumed');
    }
  }, [isPaused, workoutStarted, setGlobalIsPaused]);

  // Save on unmount kaldırıldı: sadece workout tamamlandığında kayıt alınacak

  // Countdown timer
  useEffect(() => {
    if (isPaused || workoutFinishedRef.current || !workoutStarted) return;

    const currentSpeed = cycleTrackingEnabled
      ? isGreenPhase
        ? greenCountdownSpeed
        : redCountdownSpeed
      : infiniteSpeed;

    const interval = setInterval(() => {
      setCount((prev) => prev - 1);
      setTotalElapsedTime((prev) => {
        const newVal = prev + currentSpeed / 1000;
        localElapsedTimeRef.current = newVal;
        return newVal;
      });
    }, currentSpeed);

    return () => clearInterval(interval);
  }, [
    isPaused,
    workoutStarted,
    isGreenPhase,
    cycleTrackingEnabled,
    greenCountdownSpeed,
    redCountdownSpeed,
    infiniteSpeed,
    setTotalElapsedTime,
  ]);

  // Phase switching
  useEffect(() => {
    if (workoutFinishedRef.current) return;

    if (count === -1 && !isPaused && workoutStarted) {
      if (cycleTrackingEnabled) {
        const loopDuration = (Date.now() - currentLoopStartTimeRef.current) / 1000;

        if (isGreenPhase) {
          // Work Phase Finished -> Go to Rest
          greenLoopTimesRef.current.push(loopDuration);
          setIsGreenPhase(false);
          setCount(parseInt(restTime));
          currentLoopStartTimeRef.current = Date.now();
          console.log('🟢 Work phase completed, starting Rest');
        } else {
          // Rest Phase Finished -> Check Reps/Sets
          redLoopTimesRef.current.push(loopDuration);

          const currentRepCount = completedRedRepsRef.current + 1;

          if (currentRepCount < parseInt(redReps)) {
            // Next Rep in same Set
            setCompletedRedReps(currentRepCount);
            completedRedRepsRef.current = currentRepCount;

            setIsGreenPhase(true);
            setCount(parseInt(greenTime));
            currentLoopStartTimeRef.current = Date.now();
            console.log('🔴 Rest phase completed. Starting Rep:', currentRepCount + 1);
          } else {
            // Set Finished
            const currentSetCount = completedGreenRepsRef.current + 1;

            if (currentSetCount < parseInt(greenReps)) {
              // Next Set
              setCompletedGreenReps(currentSetCount);
              completedGreenRepsRef.current = currentSetCount;

              // Reset Reps for new Set
              setCompletedRedReps(0);
              completedRedRepsRef.current = 0;

              setIsGreenPhase(true);
              setCount(parseInt(greenTime));
              currentLoopStartTimeRef.current = Date.now();
              console.log('🔴 Set completed. Starting Set:', currentSetCount + 1);
            } else {
              // Workout Finished
              setCompletedRedReps(currentRepCount); // Show full reps
              setCompletedGreenReps(currentSetCount); // Show full sets

              workoutFinishedRef.current = true;
              setIsPaused(true);
              setGlobalIsPaused(true);

              saveWorkoutSummary(currentSetCount, currentRepCount).then(() => {
                // Navigate to summary screen
                navigation.navigate('WorkoutSummaryScreen', {
                  workoutId: workoutId,
                  workoutName: workoutName
                });
              });

              setCount(0);
              console.log('🏁 Workout finished!');
            }
          }
        }
      } else {
        setIsGreenPhase((prev) => !prev);
        setCount(parseInt(infiniteLoopTime));
        console.log('♾️ Infinite loop phase switched');
      }
    }
  }, [
    count,
    isPaused,
    workoutStarted,
    cycleTrackingEnabled,
    isGreenPhase,
    greenTime,
    restTime,
    redReps,
    greenReps,
    infiniteLoopTime,
    setGlobalIsPaused,
    saveWorkoutSummary,
  ]);

  // Display values
  const currentCount = useMemo(() => Math.max(0, parseInt(count.toString())), [count]);
  const tens = useMemo(() => Math.floor(currentCount / 10), [currentCount]);
  const ones = useMemo(() => currentCount % 10, [currentCount]);

  // ✅ FIX: LEDDigit props mapping
  const digitDotSize = 18;
  const digitSpacing = digitDotSize * 0.3;
  const circleDotSize = 8;
  const circleSpacing = circleDotSize * 0.3;

  const ledColor = (!isGreenPhase && cycleTrackingEnabled) ? '#FFE61E' : (colors?.led?.white || '#FFFFFF');
  const currentWallpaper = useMemo(() => wallpapers.find((w) => w.id === wallpaper), [wallpaper]);
  const backgroundSource = useMemo(() => {
    if (currentWallpaper) return currentWallpaper.source;
    if (wallpaper) return { uri: wallpaper };
    return wallpapers[0].source;
  }, [currentWallpaper, wallpaper]);
  const currentLapNumber = Math.min(completedRedReps + 1, parseInt(redReps));

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const decimals = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(
      decimals
    ).padStart(2, '0')}`;
  };

  const getWorkoutGif = () => {
    // 1. Try to find exact match in allWorkouts
    const foundWorkout = allWorkouts.find(w => w.name === workoutName);
    if (foundWorkout && foundWorkout.gifPath) {
      return foundWorkout.gifPath;
    }

    // 2. Fallback: Try to match by name (case insensitive)
    const workoutNameLower = workoutName?.toLowerCase() || '';
    const foundByPartial = allWorkouts.find(w => w.name.toLowerCase() === workoutNameLower);
    if (foundByPartial && foundByPartial.gifPath) {
      return foundByPartial.gifPath;
    }

    // 3. Hardcoded fallbacks
    if (workoutNameLower.includes('leg press')) {
      return require('../assets/animations/leg-press.gif');
    }
    if (workoutNameLower.includes('t-bar') || workoutNameLower.includes('tbar')) {
      return require('../assets/animations/Tbar-row.gif');
    }
    return require('../assets/animations/walker.gif');
  };

  const getGifStyle = () => {
    const defaultStyle = styles.runningManGif;
    const smallStyle = [styles.runningManGif, { width: 30, height: 30 }];

    // 1. Try to find exact match in allWorkouts
    const foundWorkout = allWorkouts.find(w => w.name === workoutName);
    if (foundWorkout) {
      if (['biking.gif', 'outdoor-walk.gif', 'outdoor-run.gif'].includes(foundWorkout.gifFileName)) {
        return smallStyle;
      }
      return defaultStyle;
    }

    // 2. Fallback: Try to match by name (case insensitive)
    const workoutNameLower = workoutName?.toLowerCase() || '';
    const foundByPartial = allWorkouts.find(w => w.name.toLowerCase() === workoutNameLower);
    if (foundByPartial) {
      if (['biking.gif', 'outdoor-walk.gif', 'outdoor-run.gif'].includes(foundByPartial.gifFileName)) {
        return smallStyle;
      }
      return defaultStyle;
    }

    // 3. Hardcoded fallbacks
    if (workoutNameLower.includes('leg press')) {
      return defaultStyle;
    }
    if (workoutNameLower.includes('t-bar') || workoutNameLower.includes('tbar')) {
      return defaultStyle;
    }

    // Default is walker.gif, which should be small
    return smallStyle;
  };

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']} style={styles.gradientOverlay}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.timerAndCirclesContainer}
            activeOpacity={1}
            onPress={handlePress}
          >
            {/* ✅ TIMER DIGITS - FIXED PROPS */}
            <View style={styles.timerDigits}>
              <LEDDigit
                digit={tens}
                dotSize={digitDotSize}
                spacing={digitSpacing}
                color={ledColor}
              />
              <View style={{ width: 20 }} />
              <LEDDigit
                digit={ones}
                dotSize={digitDotSize}
                spacing={digitSpacing}
                color={ledColor}
              />
            </View>

            {/* CIRCLES */}
            <View style={styles.circlesContainer}>
              <View
                style={[
                  styles.circleBox,
                  { opacity: !cycleTrackingEnabled && !isGreenPhase ? 0 : 1 },
                ]}
              >
                {cycleTrackingEnabled ? (
                  <LEDCircleWithDigit
                    digit={Math.min(completedGreenReps + 1, parseInt(greenReps))}
                    color={colors?.quickStart?.primary || '#A8EC2C'}
                    size={circleDotSize}
                    spacing={circleSpacing}
                  />
                ) : (
                  <LEDCircle
                    color={colors?.quickStart?.primary || '#A8EC2C'}
                    size={circleDotSize}
                    spacing={circleSpacing}
                  />
                )}
              </View>

              <View
                style={[
                  styles.circleBox,
                  { opacity: !cycleTrackingEnabled && isGreenPhase ? 0 : 1 },
                ]}
              >
                {cycleTrackingEnabled ? (
                  <LEDCircleWithDigit
                    digit={Math.min(completedRedReps + 1, parseInt(redReps))}
                    color={colors?.quickStart?.secondary || '#FF6B6B'}
                    size={circleDotSize}
                    spacing={circleSpacing}
                  />
                ) : (
                  <LEDCircle
                    color={colors?.quickStart?.secondary || '#FF6B6B'}
                    size={circleDotSize}
                    spacing={circleSpacing}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* CONTROL PANEL */}
          <Animated.View
            style={[styles.appleControlPanel, { transform: [{ translateY: controlPanelY }] }]}
          >
            <View style={styles.homeIndicator} />
            <View style={styles.appleControlContent}>
              <View style={styles.appleTimerRow}>
                <LinearGradient
                  colors={['#122003', '#213705']}
                  style={styles.runningManContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image source={getWorkoutGif()} style={getGifStyle()} />
                </LinearGradient>

                <Text style={styles.appleTimerText}>{formatElapsedTime(totalElapsedTime)}</Text>

                <View style={styles.progressCircleContainer}>
                  <ProgressCircle
                    size={40}
                    strokeWidth={5}
                    progress={workoutProgress}
                    color="#FA114F"
                    borderColor="#3D1B25"
                  />
                </View>
              </View>

              <View style={styles.appleButtonsRow}>
                <TouchableOpacity style={styles.appleLapButton}>
                  <View style={styles.appleLapInnerCircle}>
                    <Text style={styles.appleLapNumber}>
                      {cycleTrackingEnabled ? currentLapNumber : '∞'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applePauseButton} onPress={handlePress}>
                  {isPaused || !workoutStarted ? (
                    <Feather name="rotate-cw" size={50} color="#FFFFFF" />
                  ) : (
                    <Feather name="pause" size={50} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.appleBackButton}
                  onPress={() => navigation.navigate('Main')}
                >
                  <Feather name="chevron-left" size={50} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>

        {showCountdown && (
          <View style={styles.countdownOverlay}>
            <View style={styles.countdownContainer}>
              {WorkoutIcon && (
                <LinearGradient
                  colors={['#122003', '#213705']}
                  style={styles.countdownTopIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <WorkoutIcon width={30} height={30} fill="#9DEC2C" />
                </LinearGradient>
              )}

              <View style={{ width: SCREEN_WIDTH * 0.8, height: SCREEN_WIDTH * 0.8, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width="100%" height="100%" viewBox="0 0 200 200" style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="rgba(100, 80, 20, 0.5)"
                    strokeWidth="14"
                  />
                  <AnimatedCircle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#FFD600"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={502.65}
                    strokeDashoffset={countdownProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [502.65, 0],
                    })}
                  />
                </Svg>

                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Animated.View style={{ opacity: countdownOpacity, transform: [{ scale: countdownScale }] }}>
                    <Text style={{ color: '#FFF', fontSize: 64, fontWeight: 'bold' }}>
                      {countdownStep === 'ready' ? 'Ready' : countdownStep}
                    </Text>
                  </Animated.View>
                </View>
              </View>

              <Text style={styles.countdownText}>{workoutName}</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  timerAndCirclesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
     paddingTop: 150,
  },
  timerDigits: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 50,
  },
  circleBox: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleControlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: POSITIONS.CONTROL_PANEL_HEIGHT,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  appleControlContent: {
    marginHorizontal: 16,
    marginBottom: 50,
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderRadius: 44,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  appleTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  runningManContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  runningManGif: {
    width: 38,
    height: 38,
  },
  appleTimerText: {
    fontSize: 46,
    fontWeight: '600',
    color: '#FFD60A',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  progressCircleContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
  },
  appleButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  appleLapButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  appleLapInnerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleLapNumber: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  applePauseButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  appleBackButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  countdownTopIcon: {
    width: 54,
    height: 54,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
    zIndex: 10,
  },
  countdownText: {
    color: '#FFF',
    fontSize: 29,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});
