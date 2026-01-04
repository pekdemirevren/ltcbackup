import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
// ...existing code...

export interface TimerContextType {
  timerKey: number;
  greenTime: string;
  setGreenTime: Dispatch<SetStateAction<string>>;
  redTime: string;
  setRedTime: Dispatch<SetStateAction<string>>;
  greenReps: string;
  setGreenReps: Dispatch<SetStateAction<string>>;
  redReps: string;
  setRedReps: Dispatch<SetStateAction<string>>;
  greenCountdownSpeed: number;
  setGreenCountdownSpeed: Dispatch<SetStateAction<number>>;
  redCountdownSpeed: number;
  setRedCountdownSpeed: Dispatch<SetStateAction<number>>;
  infiniteLoopTime: string;
  setInfiniteLoopTime: Dispatch<SetStateAction<string>>;
  infiniteSpeed: number;
  setInfiniteSpeed: Dispatch<SetStateAction<number>>;
  cycleTrackingEnabled: boolean;
  setCycleTrackingEnabled: Dispatch<SetStateAction<boolean>>;
  isPaused: boolean;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  totalGreenTime: number;
  setTotalGreenTime: Dispatch<SetStateAction<number>>;
  totalRedTime: number;
  setTotalRedTime: Dispatch<SetStateAction<number>>;
  totalElapsedTime: number;
  setTotalElapsedTime: Dispatch<SetStateAction<number>>;
  wallpaper: string;
  setWallpaper: Dispatch<SetStateAction<string>>;
  weight: string;
  setWeight: Dispatch<SetStateAction<string>>;
  startTimerWithWorkoutSettings: (
    workoutId: string,
    workoutName?: string,
  ) => Promise<void>;
  startTimerWithCurrentSettings: (
    isCustomWorkout?: boolean,
    loopConfig?: { time: string; speed: number } | null,
    customSpeeds?: { greenSpeed?: number; redSpeed?: number } | null,
  ) => void;
  handleQuickStart: () => void;
  handleQuickStartForCycleTracking: () => void;
  startInfiniteLoop: (config: { time: string; speed: number }, workoutInfo?: { workoutId?: string; workoutName?: string }) => void;
  startInfiniteLoopWithSpeed: (config: { time: string; speed: number }, workoutInfo?: { workoutId?: string; workoutName?: string }) => void;
  setGreenTimeWithStorage: (value: string) => void;
  setRedTimeWithStorage: (value: string) => void;
  setGreenRepsWithStorage: (value: string) => void;
  setRedRepsWithStorage: (value: string) => void;
  setGreenCountdownSpeedWithStorage: (value: number) => void;
  setRedCountdownSpeedWithStorage: (value: number) => void;
  setInfiniteLoopTimeWithStorage: (value: string) => void;
  setInfiniteSpeedWithStorage: (value: number) => void;
  setWallpaperWithStorage: (value: string) => void;
  handleSettingsSave: (settings: any) => void;
  resetGreenTime: () => void;
  resetRedTime: () => void;
  // Triple Tracking
  currentSet: number;
  setCurrentSet: Dispatch<SetStateAction<number>>;
  targetSets: number;
  setTargetSets: Dispatch<SetStateAction<number>>;
  currentRep: number; // For display only currently?
  setCurrentRep: Dispatch<SetStateAction<number>>;
  targetReps: number;
  setTargetReps: Dispatch<SetStateAction<number>>;
  isRecovery: boolean;
  setIsRecovery: Dispatch<SetStateAction<boolean>>;

  resetElapsedTime: () => void;
}

export const TimerContext = createContext<TimerContextType | undefined>(
  undefined,
);

interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const navigation = useNavigation<NavigationProp<any>>();

  const [greenTime, setGreenTime] = useState('30');
  const [redTime, setRedTime] = useState('15');
  const [greenReps, setGreenReps] = useState('3');
  const [redReps, setRedReps] = useState('3');
  const [greenCountdownSpeed, setGreenCountdownSpeed] = useState(1000);
  const [redCountdownSpeed, setRedCountdownSpeed] = useState(1000);
  const [infiniteLoopTime, setInfiniteLoopTime] = useState('30');
  const [infiniteSpeed, setInfiniteSpeed] = useState(1000);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const [totalGreenTime, setTotalGreenTime] = useState(0);
  const [totalRedTime, setTotalRedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [wallpaper, setWallpaper] = useState('default');
  const [weight, setWeight] = useState('75');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const gt = await AsyncStorage.getItem('greenTime');
        const rt = await AsyncStorage.getItem('redTime');
        const gr = await AsyncStorage.getItem('greenReps');
        const rr = await AsyncStorage.getItem('redReps');
        const gcs = await AsyncStorage.getItem('greenCountdownSpeed');
        const rcs = await AsyncStorage.getItem('redCountdownSpeed');
        const ilt = await AsyncStorage.getItem('infiniteLoopTime');
        const ispd = await AsyncStorage.getItem('infiniteSpeed');
        const wp = await AsyncStorage.getItem('wallpaper');
        const w = await AsyncStorage.getItem('weight');

        if (gt) setGreenTime(gt);
        if (rt) setRedTime(rt);
        if (gr) setGreenReps(gr);
        if (rr) setRedReps(rr);
        if (gcs) setGreenCountdownSpeed(parseInt(gcs));
        if (rcs) setRedCountdownSpeed(parseInt(rcs));
        if (ilt) {
          setInfiniteLoopTime(ilt);
          console.log(
            'TimerContext: Loaded infiniteLoopTime from storage:',
            ilt,
          );
        }
        if (ispd) setInfiniteSpeed(parseInt(ispd));
        if (wp) setWallpaper(wp);
        if (w) setWeight(w);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };
    loadSettings();
  }, []);

  const saveSettingsToStorage = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const setGreenTimeWithStorage = useCallback((value: string) => {
    setGreenTime(value);
    saveSettingsToStorage('greenTime', value);
  }, []);

  const setRedTimeWithStorage = useCallback((value: string) => {
    setRedTime(value);
    saveSettingsToStorage('redTime', value);
  }, []);

  const setGreenRepsWithStorage = useCallback((value: string) => {
    setGreenReps(value);
    saveSettingsToStorage('greenReps', value);
  }, []);

  const setRedRepsWithStorage = useCallback((value: string) => {
    setRedReps(value);
    saveSettingsToStorage('redReps', value);
  }, []);

  const setGreenCountdownSpeedWithStorage = useCallback((value: number) => {
    setGreenCountdownSpeed(value * 1000);
    saveSettingsToStorage('greenCountdownSpeed', (value * 1000).toString());
  }, []);

  const setRedCountdownSpeedWithStorage = useCallback((value: number) => {
    setRedCountdownSpeed(value * 1000);
    saveSettingsToStorage('redCountdownSpeed', (value * 1000).toString());
  }, []);

  const setInfiniteLoopTimeWithStorage = useCallback((value: string) => {
    setInfiniteLoopTime(value);
    saveSettingsToStorage('infiniteLoopTime', value);
  }, []);

  const setInfiniteSpeedWithStorage = useCallback((value: number) => {
    setInfiniteSpeed(value * 1000);
    saveSettingsToStorage('infiniteSpeed', (value * 1000).toString());
  }, []);

  // Triple Tracking State
  const [currentSet, setCurrentSet] = useState(1);
  const [targetSets, setTargetSets] = useState(3);
  const [currentRep, setCurrentRep] = useState(1); // Not really used for logic maybe, but for display
  const [targetReps, setTargetReps] = useState(6);
  const [isRecovery, setIsRecovery] = useState(false);

  // ... existing storage setters ...

  const setWallpaperWithStorage = useCallback((value: string) => {
    setWallpaper(value);
    saveSettingsToStorage('wallpaper', value);
  }, []);

  // ✅ GÜNCELLENMIŞ: startTimerWithWorkoutSettings
  const startTimerWithWorkoutSettings = useCallback(
    async (workoutId: string, workoutName?: string) => {
      try {
        console.log(
          '🔍 TimerContext: Loading settings for workoutId:',
          workoutId,
        );

        // Dynamic import to avoid circular dependencies if any, though likely safe
        const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const workoutSettings = await loadWorkoutSettings(workoutId);

        console.log('📦 TimerContext: Loaded settings from Manager:', workoutSettings);

        // Yeni: Workout adını ayarlardan veya parametreden al
        const finalWorkoutName =
          workoutName || workoutId; // loadWorkoutSettings doesn't return workoutName, generally passed in param

        console.log(
          '✅ TimerContext: Loaded settings for',
          workoutId,
          ':',
          workoutSettings,
        );
        console.log('📝 TimerContext: Workout name:', finalWorkoutName);

        setGreenTime(workoutSettings.greenTime);
        setRedTime(workoutSettings.restTime);
        setGreenReps(workoutSettings.greenReps);
        setRedReps(workoutSettings.redReps);
        setGreenCountdownSpeed(workoutSettings.greenCountdownSpeed);
        setRedCountdownSpeed(workoutSettings.redCountdownSpeed);
        if (workoutSettings.weight) {
            setWeight(workoutSettings.weight);
        }
        // Handle infinite loop stuff if it exists in workoutSettings
        if (workoutSettings.infiniteLoopTime) {
          setInfiniteLoopTime(workoutSettings.infiniteLoopTime);
        }
        if (workoutSettings.infiniteSpeed) {
          setInfiniteSpeed(workoutSettings.infiniteSpeed);
        }

        // Triple Tracking Initialization
        setTargetSets(parseInt(workoutSettings.targetSets || '3'));
        setTargetReps(parseInt(workoutSettings.targetReps || '6'));
        setCurrentSet(1);
        setIsRecovery(false);

        setCycleTrackingEnabled(true);
        setIsPaused(false);
        setTimerKey(prevKey => prevKey + 1);

        const navigationParams = {
          workoutId,
          workoutName: finalWorkoutName,
          settings: {
            ...workoutSettings,
            weight: workoutSettings.weight || weight,
          },
          initialGreenTime: workoutSettings.greenTime,
          initialRestTime: workoutSettings.restTime,
          initialGreenReps: workoutSettings.greenReps,
          initialRedReps: workoutSettings.redReps,
          initialGreenCountdownSpeed: workoutSettings.greenCountdownSpeed,
          initialRedCountdownSpeed: workoutSettings.redCountdownSpeed,
          initialCycleTrackingEnabled: true,
          initialIsPaused: false,
          initialInfiniteLoopTime: workoutSettings.infiniteLoopTime || infiniteLoopTime,
          initialInfiniteSpeed: workoutSettings.infiniteSpeed || infiniteSpeed,
        };

        console.log(
          '🚀 TimerContext: Navigating to Timer with params:',
          navigationParams,
        );
        navigation.navigate('Timer', navigationParams);
      } catch (e) {
        console.error(
          '❌ TimerContext: Failed to load settings and start timer for workout:',
          workoutId,
          e,
        );
      }
    },
    [navigation, infiniteLoopTime, infiniteSpeed],
  );

  // ✅ GÜNCELLENMIŞ: startTimerWithCurrentSettings
  const startTimerWithCurrentSettings = useCallback(
    (
      isCustomWorkout = false,
      loopConfig: { time: string; speed: number } | null = null,
      customSpeeds: { greenSpeed?: number; redSpeed?: number } | null = null,
      workoutInfo?: { workoutId?: string; workoutName?: string }
    ) => {
      if (isCustomWorkout) {
        setCycleTrackingEnabled(true);
      } else {
        setCycleTrackingEnabled(false);
      }

      setIsPaused(false);
      setTimerKey(prevKey => prevKey + 1);

      const paramsToPass = {
        workoutId: workoutInfo?.workoutId || `workout-${Date.now()}`, // Her zaman benzersiz bir ID oluştur
        workoutName: workoutInfo?.workoutName || 'Quick Workout',
        settings: {
          greenTime,
          restTime: redTime,
          greenReps,
          redReps,
          greenSpeed: (customSpeeds?.greenSpeed ?? greenCountdownSpeed) / 1000,
          redSpeed: (customSpeeds?.redSpeed ?? redCountdownSpeed) / 1000,
          weight,
        },
        initialGreenTime: greenTime,
        initialRestTime: redTime,
        initialGreenReps: greenReps,
        initialRedReps: redReps,
        initialGreenCountdownSpeed:
          customSpeeds?.greenSpeed ?? greenCountdownSpeed,
        initialRedCountdownSpeed: customSpeeds?.redSpeed ?? redCountdownSpeed,
        initialInfiniteLoopTime: loopConfig
          ? loopConfig.time
          : infiniteLoopTime,
        initialInfiniteSpeed: loopConfig
          ? loopConfig.speed * 1000
          : infiniteSpeed,
        initialCycleTrackingEnabled: isCustomWorkout,
        initialIsPaused: false,
        initialLoopPhase: 'green', // Her zaman yeşilden başla
      };

      console.log(
        '🚀 TimerContext: startTimerWithCurrentSettings - Navigating to Timer with:',
        paramsToPass,
      );
      navigation.navigate('Timer', paramsToPass);
    },
    [
      navigation,
      greenTime,
      redTime,
      greenReps,
      redReps,
      greenCountdownSpeed,
      redCountdownSpeed,
      infiniteLoopTime,
      infiniteSpeed,
    ],
  );

  const handleQuickStart = useCallback(() => {
    startTimerWithCurrentSettings(false);
  }, [startTimerWithCurrentSettings]);

  const handleQuickStartForCycleTracking = useCallback(() => {
    startTimerWithCurrentSettings(true);
  }, [startTimerWithCurrentSettings]);

  const startInfiniteLoop = useCallback(
    (config: { time: string; speed: number }, workoutInfo?: { workoutId?: string; workoutName?: string }) => {
      setInfiniteLoopTime(config.time);
      setInfiniteSpeed(config.speed * 1000);
      setCycleTrackingEnabled(false);
      setIsPaused(false);
      setTimerKey(prevKey => prevKey + 1);

      console.log(
        '🔄 TimerContext: startInfiniteLoop - Navigating to Timer with config:',
        config,
      );

      navigation.navigate('Timer', {
        workoutId: workoutInfo?.workoutId || `workout-${Date.now()}`,
        workoutName: workoutInfo?.workoutName || 'Quick Workout',
        settings: {
          greenTime: '30',
          restTime: '15',
          greenReps: greenReps,
          redReps: redReps,
          infiniteLoopTime: config.time,
          infiniteSpeed: config.speed,
          cycleTrackingEnabled: false,
        },
        initialInfiniteLoopTime: config.time,
        initialInfiniteSpeed: config.speed * 1000,
        initialCycleTrackingEnabled: false,
        initialIsPaused: false,
        initialLoopPhase: 'green',
        initialGreenTime: '30',
        initialRestTime: '15',
      });
    },
    [navigation],
  );

  const startInfiniteLoopWithSpeed = useCallback(
    (config: { time: string; speed: number }, workoutInfo?: { workoutId?: string; workoutName?: string }) => {
      setInfiniteLoopTime(config.time);
      setInfiniteSpeed(config.speed * 1000);
      setCycleTrackingEnabled(false);
      setIsPaused(false);
      setTimerKey(prevKey => prevKey + 1);

      console.log(
        '⚡ TimerContext: startInfiniteLoopWithSpeed - Navigating to Timer with config:',
        config,
      );

      const params = {
        workoutId: workoutInfo?.workoutId || `workout-${Date.now()}`,
        workoutName: workoutInfo?.workoutName || 'Quick Workout',
        settings: {
          greenTime: greenTime,
          restTime: redTime,
          greenReps: greenReps,
          redReps: redReps,
          infiniteLoopTime: config.time,
          infiniteSpeed: config.speed,
          cycleTrackingEnabled: false,
        },
        initialInfiniteLoopTime: config.time,
        initialInfiniteSpeed: config.speed * 1000,
        initialCycleTrackingEnabled: false,
        initialIsPaused: false,
        initialLoopPhase: 'green',
        initialGreenTime: greenTime,
        initialRestTime: redTime,
      };

      console.log(
        '📋 TimerContext: startInfiniteLoopWithSpeed - Params:',
        params,
      );
      navigation.navigate('Timer', params);
    },
    [navigation],
  );

  const resetGreenTime = useCallback(() => setTotalGreenTime(0), []);
  const resetRedTime = useCallback(() => setTotalRedTime(0), []);
  const resetElapsedTime = useCallback(() => setTotalElapsedTime(0), []);

  const handleSettingsSave = useCallback(
    (settings: any) => {
      if (settings.greenTime !== undefined)
        setGreenTimeWithStorage(settings.greenTime);
      if (settings.redTime !== undefined)
        setRedTimeWithStorage(settings.redTime);
      if (settings.greenReps !== undefined)
        setGreenRepsWithStorage(settings.greenReps);
      if (settings.redReps !== undefined)
        setRedRepsWithStorage(settings.redReps);
      if (settings.greenSpeed !== undefined)
        setGreenCountdownSpeedWithStorage(settings.greenSpeed);
      if (settings.redSpeed !== undefined)
        setRedCountdownSpeedWithStorage(settings.redSpeed);
      if (settings.infiniteLoopTime !== undefined)
        setInfiniteLoopTimeWithStorage(settings.infiniteLoopTime);
      if (settings.infiniteLoopSpeed !== undefined)
        setInfiniteSpeedWithStorage(settings.infiniteLoopSpeed);
      if (settings.wallpaper !== undefined)
        setWallpaperWithStorage(settings.wallpaper);
    },
    [
      setGreenTimeWithStorage,
      setRedTimeWithStorage,
      setGreenRepsWithStorage,
      setRedRepsWithStorage,
      setGreenCountdownSpeedWithStorage,
      setRedCountdownSpeedWithStorage,
      setInfiniteLoopTimeWithStorage,
      setInfiniteSpeedWithStorage,
      setWallpaperWithStorage,
    ],
  );

  const contextValue = useMemo(
    () => ({
      timerKey,
      greenTime,
      setGreenTime,
      redTime,
      setRedTime,
      greenReps,
      setGreenReps,
      redReps,
      setRedReps,
      greenCountdownSpeed,
      setGreenCountdownSpeed,
      redCountdownSpeed,
      setRedCountdownSpeed,
      infiniteLoopTime,
      setInfiniteLoopTime,
      infiniteSpeed,
      setInfiniteSpeed,
      cycleTrackingEnabled,
      setCycleTrackingEnabled,
      isPaused,
      setIsPaused,
      totalGreenTime,
      setTotalGreenTime,
      totalRedTime,
      setTotalRedTime,
      totalElapsedTime,
      setTotalElapsedTime,
      wallpaper,
      setWallpaper,
      weight,
      setWeight,
      startTimerWithWorkoutSettings,
      startTimerWithCurrentSettings,
      handleQuickStart,
      handleQuickStartForCycleTracking,
      startInfiniteLoop,
      startInfiniteLoopWithSpeed,
      setGreenTimeWithStorage,
      setRedTimeWithStorage,
      setGreenRepsWithStorage,
      setRedRepsWithStorage,
      setGreenCountdownSpeedWithStorage,
      setRedCountdownSpeedWithStorage,
      setInfiniteLoopTimeWithStorage,
      setInfiniteSpeedWithStorage,
      setWallpaperWithStorage,
      handleSettingsSave,
      resetGreenTime,
      resetRedTime,
      resetElapsedTime,
      currentSet,
      setCurrentSet,
      targetSets,
      setTargetSets,
      currentRep,
      setCurrentRep,
      targetReps,
      setTargetReps,
      isRecovery,
      setIsRecovery,
    }),
    [
      timerKey,
      greenTime,
      setGreenTime,
      redTime,
      setRedTime,
      greenReps,
      setGreenReps,
      redReps,
      setRedReps,
      greenCountdownSpeed,
      setGreenCountdownSpeed,
      redCountdownSpeed,
      setRedCountdownSpeed,
      infiniteLoopTime,
      setInfiniteLoopTime,
      infiniteSpeed,
      setInfiniteSpeed,
      cycleTrackingEnabled,
      setCycleTrackingEnabled,
      isPaused,
      setIsPaused,
      totalGreenTime,
      setTotalGreenTime,
      totalRedTime,
      setTotalRedTime,
      totalElapsedTime,
      setTotalElapsedTime,
      wallpaper,
      setWallpaper,
      weight,
      setWeight,
      startTimerWithWorkoutSettings,
      startTimerWithCurrentSettings,
      handleQuickStart,
      handleQuickStartForCycleTracking,
      startInfiniteLoop,
      startInfiniteLoopWithSpeed,
      setGreenTimeWithStorage,
      setRedTimeWithStorage,
      setGreenRepsWithStorage,
      setRedRepsWithStorage,
      setGreenCountdownSpeedWithStorage,
      setRedCountdownSpeedWithStorage,
      setInfiniteLoopTimeWithStorage,
      setInfiniteSpeedWithStorage,
      setWallpaperWithStorage,
      handleSettingsSave,
      resetGreenTime,
      resetRedTime,
      resetElapsedTime,
      currentSet,
      targetSets,
      currentRep,
      targetReps,
      isRecovery,
    ],
  );

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};
