import 'react-native-gesture-handler'; // EN ÜSTE EKLENMELİ
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Dimensions, View, TouchableOpacity, StatusBar, Text, Animated, Easing } from 'react-native';
import { getStyles } from './AppStyles';
import { NavigationContainer, useNavigation, useNavigationContainerRef, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen } from './SettingsScreen';
import { LegPressSettingsScreen } from './LegPressSettingsScreen';
import { DumbbellSettingsScreen } from './DumbbellSettingsScreen';
import { ArmFlexSettingsScreen } from './ArmFlexSettingsScreen';
import { RunSettingsScreen } from './RunSettingsScreen';
import { WalkSettingsScreen } from './WalkSettingsScreen';
import { YogaSettingsScreen } from './YogaSettingsScreen';
import { KettlebellSettingsScreen } from './KettlebellSettingsScreen';
import { BicycleSettingsScreen } from './BicycleSettingsScreen';
import { HeartPulseSettingsScreen } from './HeartPulseSettingsScreen';
import { HandsUpSettingsScreen } from './HandsUpSettingsScreen';
import { WeightSettingsScreen } from './WeightSettingsScreen';
import { LoopSelectionScreen } from './LoopSelectionScreen';
import { LoopTimeScreen } from './LoopTimeScreen';
import { LoopSpeedScreen } from './LoopSpeedScreen';
import { WorkoutScreen } from './WorkoutScreen';
import { WorkoutSettingsScreen } from './WorkoutSettingsScreen';
import { TimeSelectionScreen } from './TimeSelectionScreen';
import { GreenTimeSettingsScreen } from './GreenTimeSettingsScreen';
import { RedTimeSettingsScreen } from './RedTimeSettingsScreen';
import { SpeedSelectionScreen } from './SpeedSelectionScreen';
import { GreenSpeedSettingsScreen } from './GreenSpeedSettingsScreen';
import { RedSpeedSettingsScreen } from './RedSpeedSettingsScreen';
import { LapSelectionScreen } from './LapSelectionScreen';
import { GreenLapSettingsScreen } from './GreenLapSettingsScreen';
import { RedLapSettingsScreen } from './RedLapSettingsScreen';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar from './BottomTabBar';
// TimerContext import already at the top, remove duplicate below
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Feather } from '@expo/vector-icons';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import { TimerContext } from './TimerContext';

const Stack = createStackNavigator();

// LED Dot Matrix Pattern - 7x13 grid için rakam desenleri
const LED_PATTERNS = {
  0: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  1: [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,0,0],
    [0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,1,1,1,1,1,1],
    [0,1,1,1,1,1,1],
  ],
  2: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0],
    [0,1,1,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
  ],
  3: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,0,0,1,1,0],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  4: [
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,1,0],
    [0,0,1,1,1,1,0],
    [0,1,1,0,1,1,0],
    [1,1,0,0,1,1,0],
    [1,1,0,0,1,1,0],
    [1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0],
  ],
  5: [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  6: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  7: [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0],
    [0,1,1,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
  ],
  8: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [0,1,1,1,1,1,0],
    [0,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  9: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,0],
  ],
};

const digitPatterns = {
    1: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    2: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    3: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    4: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,0,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    5: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    6: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    7: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,0,0,0,1,1,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    8: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    9: [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
};

// LED Daire Pattern - 12x12 grid
const LED_CIRCLE_PATTERN_BASE = [
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,0,0],
];
const LED_CIRCLE_PATTERN = LED_CIRCLE_PATTERN_BASE.slice(0, 12).map(row => row.slice(0, 12));

// Daire içinde rakam pattern'i oluştur
const getCircleWithDigitPattern = (digit) => {
  const digitPattern = digitPatterns[digit] || digitPatterns[1]; // default to 1 if not found
  return LED_CIRCLE_PATTERN_BASE.map((row, rowIndex) =>
    row.map((circlePixel, colIndex) => {
      const digitPixel = digitPattern[rowIndex][colIndex];
      // Eğer digit pixel 1 ise, digit'i göster, yoksa circle'ı göster
      return digitPixel === 1 ? 2 : circlePixel; // 2 for digit, 1 for circle
    })
  );
};

// LED Dot bileşeni
const LEDDot = React.memo(({ isOn, size, color, styles }) => {
  return (
    <View
      style={[
        styles.ledDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOn ? color : 'transparent',
        }
      ]}
    />
  );
});

// LED Digit bileşeni - tek rakam için
const LEDDigit = React.memo(({ digit, dotSize, spacing, color, styles }) => { // styles prop'u eklendi
  const pattern = LED_PATTERNS[digit];

  return (
    <View style={styles.digitContainer}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => ( // styles.ledDot is used inside LEDDot
            <View key={colIndex} style={{ margin: spacing / 2 }}> 
              <LEDDot isOn={pixel === 1} size={dotSize} color={color} styles={styles} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

// LED Circle bileşeni - daire için
const LEDCircle = React.memo(({ dotSize, spacing, color, styles }) => { // styles prop'u eklendi
  return (
    <View style={styles.digitContainer}>
      {LED_CIRCLE_PATTERN.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => (
            <View key={colIndex} style={{ margin: spacing / 2 }}>
              <LEDDot isOn={pixel === 1} size={dotSize} color={color} styles={styles} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});
// LED Circle with Digit bileşeni - daire içinde rakam
const LEDCircleWithDigit = React.memo(({ digit, dotSize, spacing, circleColor, styles }) => {
  const pattern = getCircleWithDigitPattern(digit);
  return (
    <View style={styles.digitContainer}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((pixel, colIndex) => (
            <View key={colIndex} style={{ margin: spacing / 2 }}>
              <LEDDot 
                isOn={pixel !== 0} 
                size={dotSize} 
                color={pixel === 2 ? 'white' : circleColor} 
                styles={styles} 
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});
// App ana componenti
const TimerScreenComponent = (props) => {
  const { navigation } = props;
  const colors = Theme.dark;
  const styles = getStyles(colors);

  // State for timer
  const initialCount = props.initialCycleTrackingEnabled 
    ? parseInt(props.initialGreenTime || "30") 
    : parseInt(props.initialInfiniteLoopTime || "30");
  const [count, setCount] = useState(initialCount);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(props.initialCycleTrackingEnabled || false);
  const [isPaused, setIsPaused] = useState(props.initialIsPaused || true);
  const [isGreenPhase, setIsGreenPhase] = useState(true);
  const [completedGreenReps, setCompletedGreenReps] = useState(0);
  const [completedRedReps, setCompletedRedReps] = useState(0);
  const [cycleComplete, setCycleComplete] = useState(false);

  const isGreenPhaseRef = useRef(true);

  const updateGreenPhase = useCallback((phase) => {
    setIsGreenPhase(phase);
    isGreenPhaseRef.current = phase;
  }, []);

  const greenTime = props.initialGreenTime || "30";
  const restTime = props.initialRestTime || "15";
  const greenReps = props.initialGreenReps || "3";
  const redReps = props.initialRedReps || "3";
  const greenCountdownSpeed = props.initialGreenCountdownSpeed || 1000;
  const redCountdownSpeed = props.initialRedCountdownSpeed || 1000;
  const infiniteSpeed = props.initialInfiniteSpeed || 1000;
  const infiniteLoopTime = props.initialInfiniteLoopTime || "30";
  const startTime = cycleTrackingEnabled ? greenTime : infiniteLoopTime;

  // Timer logic
  useEffect(() => {
    if (isPaused) return;
    const intervalCallback = () => {
      setCount(prevCount => {
        if (prevCount === 1) {
          if (cycleTrackingEnabled) {
            if (isGreenPhaseRef.current) {
              const currentGreenCompleted = completedGreenReps + 1;
              setCompletedGreenReps(currentGreenCompleted);
              if (currentGreenCompleted < parseInt(greenReps)) {
                return parseInt(greenTime);
              } else {
                setCompletedRedReps(0);
                updateGreenPhase(false);
                return parseInt(restTime);
              }
            } else {
              const currentRedCompleted = completedRedReps + 1;
              setCompletedRedReps(currentRedCompleted);
              if (currentRedCompleted < parseInt(redReps)) {
                return parseInt(restTime);
              } else {
                setIsPaused(true);
                updateGreenPhase(true);
                return parseInt(startTime);
              }
            }
          } else {
            setCycleComplete(prev => !prev);
            return parseInt(startTime);
          }
        }
        return prevCount - 1;
      });
    };
    const currentSpeed = cycleTrackingEnabled 
      ? (isGreenPhaseRef.current ? greenCountdownSpeed : redCountdownSpeed)
      : infiniteSpeed;
    const interval = setInterval(intervalCallback, currentSpeed);
    return () => clearInterval(interval);
  }, [isPaused, startTime, cycleTrackingEnabled, greenTime, greenReps, redReps, restTime, updateGreenPhase, greenCountdownSpeed, redCountdownSpeed, infiniteSpeed, completedGreenReps, completedRedReps]);

  // Dokunma ile duraklat/devam
  const handlePress = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  // Remove internal handleSaveSettings, handleInfiniteStart, handleQuickStart, handleTimeChange
  // These are now managed by App.js and triggered by key change.

  // Ensure count is always a number for Math.floor and %
  const currentCount = parseInt(count);
  const tens = Math.floor(currentCount / 10);
  const ones = currentCount % 10;

  // LED rengi hesapla - son 10 saniyede kırmızıya geçiş (This logic is not used, ledColor is from theme)
  // const getLEDColor = () => { ... };
  const ledColor = colors.led.white; // Temadan rengi al

  // Geçen süreyi formatla (MM:SS)
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Ekran boyutuna göre LED boyutunu hesapla
  const calculateDotSize = () => {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
    const totalDotsWidth = 7 + 7; // 7x13 matrix - 2 digit
    const totalDotsHeight = 13;

    const availableWidth = SCREEN_WIDTH * 0.85;
    const availableHeight = SCREEN_HEIGHT * 0.7;

    const dotSizeByWidth = availableWidth / (totalDotsWidth * 1.5);
    const dotSizeByHeight = availableHeight / (totalDotsHeight * 1.2);

    return Math.min(dotSizeByWidth, dotSizeByHeight, 30);
  };

  const dotSize = calculateDotSize();
  const spacing = dotSize * 0.3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Ana Sayaç Alanı */}
      <TouchableOpacity 
        style={styles.countdownArea} 
        activeOpacity={1}
        onPress={handlePress}
      >
        <View style={styles.countdownContainer}>
          <LEDDigit digit={tens} dotSize={dotSize} spacing={spacing} color={ledColor} styles={styles} />
          <View style={{ width: dotSize * 2 }} />
          <LEDDigit digit={ones} dotSize={dotSize} spacing={spacing} color={ledColor} styles={styles} />
        </View>
      </TouchableOpacity>

      {/* Döngü Gösterge Daireleri - LED daireler + içinde beyaz rakamlar (birleşik) */}
      <View style={styles.cycleIndicatorContainer}>
        {/* Yeşil Daire - SOL - Yeşil fazda görünsün */}
        {cycleTrackingEnabled && isGreenPhase && (
          <View style={styles.cycleLEDContainer}>
            <LEDCircleWithDigit 
              digit={Math.min(completedGreenReps + 1, greenReps)} 
              dotSize={dotSize * 0.46} 
              spacing={dotSize * 0.138} 
              circleColor={colors.led.green} 
              styles={styles}
            />
          </View>
        )}
        
        {/* Boş alan - Yeşil görünmediğinde */}
        {cycleTrackingEnabled && !isGreenPhase && (
          <View style={styles.cycleLEDContainer} />
        )}
        
        {/* Kırmızı Daire - SAĞ - Sadece kırmızı fazda görünsün */}
        {cycleTrackingEnabled && !isGreenPhase && (
          <View style={styles.cycleLEDContainer}>
            <LEDCircleWithDigit 
              digit={Math.min(completedRedReps + 1, redReps)}
              dotSize={dotSize * 0.46} 
              spacing={dotSize * 0.138} 
              circleColor={colors.led.red} 
              styles={styles}
            />
          </View>
        )}
        
        {/* Boş alan - Kırmızı görünmediğinde */}
        {cycleTrackingEnabled && isGreenPhase && (
          <View style={styles.cycleLEDContainer} />
        )}
        
        {/* Normal mod için döngü göstergeleri - sadece LED daireler */}
        {!cycleTrackingEnabled && cycleComplete && (
          <>
            <View style={styles.cycleLEDContainer}>
              <LEDCircle 
                dotSize={dotSize * 0.46} 
                spacing={dotSize * 0.138} 
                color={colors.led.green} 
                styles={styles}
              />
            </View>
            <View style={styles.cycleLEDContainer} />
          </>
        )}
        
        {!cycleTrackingEnabled && !cycleComplete && (
          <>
            <View style={styles.cycleLEDContainer} />
            <View style={styles.cycleLEDContainer}>
              <LEDCircle 
                dotSize={dotSize * 0.46} 
                spacing={dotSize * 0.138} 
                color={colors.led.red} 
                styles={styles}
              />
            </View>
          </>
        )}
      </View>

      {/* Ayarlar Butonu */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Workout')}
      >
        <LinearGradient colors={colors.settingsIconGradient} style={styles.settingsIconGradient}>
          <Feather name="settings" size={28} color={colors.text} />
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
};

export default function App() {
  // Tema değiştirme özelliği kaldırıldığı için sadece darkColors kullanıyoruz.
  const currentColors = Theme.dark;

  // Tüm ayarların state'leri burada, en üst seviyede tutulacak.
  const [greenTime, setGreenTime] = useState("30");
  const [restTime, setRestTime] = useState("15");
  const [greenReps, setGreenReps] = useState("3");
  const [redReps, setRedReps] = useState("3");
  const [greenCountdownSpeed, setGreenCountdownSpeed] = useState(1000);
  const [redCountdownSpeed, setRedCountdownSpeed] = useState(1000);
  const [infiniteLoopTime, setInfiniteLoopTime] = useState("30");
  const [infiniteSpeed, setInfiniteSpeed] = useState(1000);
  const [cycleTrackingEnabled, setCycleTrackingEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [timerKey, setTimerKey] = useState(0); // TimerScreenComponent'i yeniden başlatmak için
  
  const [totalGreenTime, setTotalGreenTime] = useState(0);
  const [totalRedTime, setTotalRedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  
  const navigationRef = useNavigationContainerRef();

  // BottomTabBar için state
  const [activeTab, setActiveTab] = useState('workout');

  const startTimerWithWorkoutSettings = useCallback(async (workoutId, navigation) => {
    try {
      const allSettingsStr = await AsyncStorage.getItem('all_workout_settings');
      const allSettings = allSettingsStr ? JSON.parse(allSettingsStr) : {};
      const workoutSettings = allSettings[workoutId] || {
        greenTime: '30',
        restTime: '15',
        greenReps: '3',
        redReps: '3',
        greenSpeed: 1,
        redSpeed: 1,
      };

      // Apply the loaded settings to the main state
      setGreenTime(workoutSettings.greenTime);
      setRestTime(workoutSettings.restTime);
      setGreenReps(workoutSettings.greenReps);
      setRedReps(workoutSettings.redReps);
      setGreenCountdownSpeed(workoutSettings.greenSpeed * 1000);
      setRedCountdownSpeed(workoutSettings.redSpeed * 1000);
      
      // Start the timer
      setCycleTrackingEnabled(true);
      setIsPaused(false);
      setTimerKey(prevKey => prevKey + 1);
      navigation.navigate('Timer');
    } catch (e) {
      console.error("Failed to load settings and start timer for workout:", workoutId, e);
    }
  }, []);

  // Zamanlayıcıyı mevcut ayarlarla başlatmak için kullanılır.
  const startTimerWithCurrentSettings = useCallback((navigation, isCustomWorkout = false) => { // navigation'ı parametre olarak al
    if (isCustomWorkout) {
      setCycleTrackingEnabled(true); // Özel antrenman modunu etkinleştir
    } else {
      setCycleTrackingEnabled(false); // Infinite loop veya Quick Start için
    }
    setIsPaused(false); // Zamanlayıcıyı hemen başlat
    setTimerKey(prevKey => prevKey + 1); // Ayarların uygulanması için TimerScreenComponent'i yeniden başlat
    navigation.navigate('Timer'); // Timer ekranına git
  }, []);

  // SettingsScreen'den gelen QuickStart isteğini işler (sadece başlatır ve geri döner).
  const handleQuickStart = useCallback((navigation) => { // navigation'ı parametre olarak al
    startTimerWithCurrentSettings(navigation, false); // Quick Start, özel döngü değildir.
  }, [startTimerWithCurrentSettings]);

  // Cycle tracking modunda QuickStart için
  const handleQuickStartForCycleTracking = useCallback((navigation) => {
    startTimerWithCurrentSettings(navigation, true); // Cycle tracking ile başlat
  }, [startTimerWithCurrentSettings]);

  // InfiniteLoop screen'inden gelen infinite loop başlatma isteğini işler
  const startInfiniteLoop = useCallback((config, navigation = navigationRef.current) => {
    // Infinite loop için özel zamanı ayarla
    setInfiniteLoopTime(config.time);
    setInfiniteSpeed(config.speed * 1000); // speed saniye cinsinden geldiği için milisaniyeye çevir
    // State güncellemelerinin uygulanması için kısa bir gecikme
    setTimeout(() => {
      setCycleTrackingEnabled(false); // Infinite loop modu
      setIsPaused(false); // Zamanlayıcıyı hemen başlat
      setTimerKey(prevKey => prevKey + 1); // TimerScreenComponent'i yeniden başlat
      navigation.navigate('Timer'); // Timer ekranına git
    }, 0);
  }, []);

  // InfiniteSpeedScreen'den gelen infinite loop başlatma isteğini işler (time ve speed ile)
  const startInfiniteLoopWithSpeed = useCallback((config, navigation = navigationRef.current) => {
    setInfiniteLoopTime(config.time);
    setInfiniteSpeed(config.speed * 1000); // speed saniye cinsinden geldiği için milisaniyeye çevir
    // Timer'ı başlat
    startTimerWithCurrentSettings(navigation, false);
  }, [startTimerWithCurrentSettings]);

  // Reset functions for settings
  const resetGreenTime = useCallback(() => setTotalGreenTime(0), []);
  const resetRedTime = useCallback(() => setTotalRedTime(0), []);
  const resetElapsedTime = useCallback(() => setTotalElapsedTime(0), []);

  // BottomTabBar için tab değiştirme
  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    // Tab değiştiğinde yapılacak işlemler
    if (tabId === 'workout') {
      navigationRef.current?.navigate('Workout');
    } else if (tabId === 'summary') {
      // Summary ekranına git
    } else if (tabId === 'sharing') {
      // Sharing ekranına git
    }
  };

  // Load all settings from AsyncStorage on app start
  useEffect(() => {
    const loadSettingsFromStorage = async () => {
      try {
        const storedGreenTime = await AsyncStorage.getItem('greenTime');
        const storedRestTime = await AsyncStorage.getItem('restTime');
        const storedGreenReps = await AsyncStorage.getItem('greenReps');
        const storedRedReps = await AsyncStorage.getItem('redReps');
        const storedGreenCountdownSpeed = await AsyncStorage.getItem('greenCountdownSpeed');
        const storedRedCountdownSpeed = await AsyncStorage.getItem('redCountdownSpeed');
        const storedInfiniteLoopTime = await AsyncStorage.getItem('infiniteLoopTime');
        const storedInfiniteSpeed = await AsyncStorage.getItem('infiniteSpeed');

        if (storedGreenTime) setGreenTime(storedGreenTime);
        if (storedRestTime) setRestTime(storedRestTime);
        if (storedGreenReps) setGreenReps(storedGreenReps);
        if (storedRedReps) setRedReps(storedRedReps);
        if (storedGreenCountdownSpeed) setGreenCountdownSpeed(parseInt(storedGreenCountdownSpeed));
        if (storedRedCountdownSpeed) setRedCountdownSpeed(parseInt(storedRedCountdownSpeed));
        if (storedInfiniteLoopTime) setInfiniteLoopTime(storedInfiniteLoopTime);
        if (storedInfiniteSpeed) setInfiniteSpeed(parseInt(storedInfiniteSpeed));
      } catch (error) {
        console.error('Failed to load settings from storage:', error);
      }
    };

    loadSettingsFromStorage();
  }, []);

  const saveSettingsToStorage = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
    }
  };

  // Custom setters that save to AsyncStorage
  const setGreenTimeWithStorage = (value) => {
    setGreenTime(value);
    saveSettingsToStorage('greenTime', value);
  };

  const setRestTimeWithStorage = (value) => {
    setRestTime(value);
    saveSettingsToStorage('restTime', value);
  };

  const setGreenRepsWithStorage = (value) => {
    setGreenReps(value);
    saveSettingsToStorage('greenReps', value);
  };

  const setRedRepsWithStorage = (value) => {
    setRedReps(value);
    saveSettingsToStorage('redReps', value);
  };

  const setGreenCountdownSpeedWithStorage = (value) => {
    setGreenCountdownSpeed(value * 1000); // saniyeden milisaniyeye çevir
    saveSettingsToStorage('greenCountdownSpeed', (value * 1000).toString());
  };

  const setRedCountdownSpeedWithStorage = (value) => {
    setRedCountdownSpeed(value * 1000); // saniyeden milisaniyeye çevir
    saveSettingsToStorage('redCountdownSpeed', (value * 1000).toString());
  };

  const setInfiniteLoopTimeWithStorage = (value) => {
    setInfiniteLoopTime(value);
    saveSettingsToStorage('infiniteLoopTime', value);
  };

  // SettingsScreen için onSave callback - selection screen'lerden gelen değerleri kaydeder
  const handleSettingsSave = (settings) => {
    if (settings.greenTime !== undefined) setGreenTimeWithStorage(settings.greenTime);
    if (settings.redTime !== undefined) setRestTimeWithStorage(settings.redTime);
    if (settings.greenReps !== undefined) setGreenRepsWithStorage(settings.greenReps);
    if (settings.redReps !== undefined) setRedRepsWithStorage(settings.redReps);
    if (settings.greenSpeed !== undefined) setGreenCountdownSpeedWithStorage(settings.greenSpeed);
    if (settings.redSpeed !== undefined) setRedCountdownSpeedWithStorage(settings.redSpeed);
    if (settings.infiniteLoopTime !== undefined) setInfiniteLoopTimeWithStorage(settings.infiniteLoopTime);
    if (settings.infiniteLoopSpeed !== undefined) setInfiniteSpeedWithStorage(settings.infiniteLoopSpeed);
  };

  const setInfiniteSpeedWithStorage = (value) => {
    setInfiniteSpeed(value);
    saveSettingsToStorage('infiniteSpeed', value.toString());
  };

  const TimerStack = () => {
    const { 
      timerKey, greenTime, restTime, greenReps, redReps, 
      greenCountdownSpeed, redCountdownSpeed, infiniteLoopTime, 
      infiniteSpeed, cycleTrackingEnabled, isPaused, setIsPaused,
      startTimerWithWorkoutSettings, startTimerWithCurrentSettings, handleQuickStart, handleQuickStartForCycleTracking, startInfiniteLoop, 
      startInfiniteLoopWithSpeed, setInfiniteLoopTime, setInfiniteSpeed,
      setGreenTime, setRestTime, setGreenCountdownSpeed, 
      setRedCountdownSpeed, setGreenRepsWithStorage, setRedRepsWithStorage,
      setGreenTimeWithStorage, setRestTimeWithStorage, setGreenCountdownSpeedWithStorage,
      setRedCountdownSpeedWithStorage, setInfiniteLoopTimeWithStorage, setInfiniteSpeedWithStorage,
      totalGreenTime, totalRedTime, totalElapsedTime,
      resetGreenTime, resetRedTime, resetElapsedTime
    } = useContext(TimerContext);

    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          contentStyle: { backgroundColor: 'transparent' },
        }}
        initialRouteName="Workout"
      >
        <Stack.Screen name="Timer">
          {props => (
            <TimerScreenComponent
              {...props}
              key={timerKey}
              initialGreenTime={greenTime}
              initialRestTime={restTime}
              initialGreenReps={greenReps}
              initialRedReps={redReps}
              initialGreenCountdownSpeed={greenCountdownSpeed}
              initialRedCountdownSpeed={redCountdownSpeed}
              initialInfiniteLoopTime={infiniteLoopTime}
              initialInfiniteSpeed={infiniteSpeed}
              initialCycleTrackingEnabled={cycleTrackingEnabled}
              initialIsPaused={isPaused}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {({ navigation }) => (
            <SettingsScreen
              navigation={navigation}
              onBack={() => navigation.goBack()}
              onSave={handleSettingsSave}
              onQuickStart={handleQuickStart}
              startTimerWithCurrentSettings={startTimerWithCurrentSettings}
              totalGreenTime={totalGreenTime}
              totalRedTime={totalRedTime}
              totalElapsedTime={totalElapsedTime}
              currentGreenCountdownSpeed={greenCountdownSpeed}
              currentRedCountdownSpeed={redCountdownSpeed}
              currentGreenReps={greenReps}
              currentRedReps={redReps}
              currentGreenTime={greenTime}
              currentRedTime={restTime}
              currentInfiniteLoopTime={infiniteLoopTime}
              currentInfiniteSpeed={infiniteSpeed}
              onResetGreenTime={resetGreenTime}
              onGreenTimeChange={setGreenTimeWithStorage}
              onRedTimeChange={setRestTimeWithStorage}
              onGreenSpeedChange={setGreenCountdownSpeedWithStorage}
              onRedSpeedChange={setRedCountdownSpeedWithStorage}
              onGreenRepsChange={setGreenRepsWithStorage}
              onRedRepsChange={setRedRepsWithStorage}
              onResetRedTime={resetRedTime}
              onResetElapsedTime={resetElapsedTime}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="WorkoutSettings">
          {({ route, navigation }) => (
            <WorkoutSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Workout">
          {({ navigation }) => (
            <WorkoutScreen
              navigation={navigation}
              startTimerWithSettings={startTimerWithCurrentSettings}
              onSave={() => {}} // Placeholder onSave callback
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="LoopSelection">
          {({ route, navigation }) => (
            <LoopSelectionScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="LoopTime">
          {({ route, navigation }) => (
            <LoopTimeScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="LoopSpeed">
          {({ route, navigation }) => (
            <LoopSpeedScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="TimeSelectionScreen">
          {({ route, navigation }) => (
            <TimeSelectionScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="GreenTimeSettingsScreen">
          {({ route, navigation }) => (
            <GreenTimeSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="RedTimeSettingsScreen">
          {({ route, navigation }) => (
            <RedTimeSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="SpeedSelectionScreen">
          {({ route, navigation }) => (
            <SpeedSelectionScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="GreenSpeedSettingsScreen">
          {({ route, navigation }) => (
            <GreenSpeedSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="RedSpeedSettingsScreen">
          {({ route, navigation }) => (
            <RedSpeedSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="LapSelectionScreen">
          {({ route, navigation }) => (
            <LapSelectionScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="GreenLapSettingsScreen">
          {({ route, navigation }) => (
            <GreenLapSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="RedLapSettingsScreen">
          {({ route, navigation }) => (
            <RedLapSettingsScreen
              route={route}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
          <Stack.Screen name="LegPressSettingsScreen">
            {({ route, navigation }) => (
              <LegPressSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="DumbbellSettingsScreen">
            {({ route, navigation }) => (
              <DumbbellSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="ArmFlexSettingsScreen">
            {({ route, navigation }) => (
              <ArmFlexSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="RunSettingsScreen">
            {({ route, navigation }) => (
              <RunSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="WalkSettingsScreen">
            {({ route, navigation }) => (
              <WalkSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="YogaSettingsScreen">
            {({ route, navigation }) => (
              <YogaSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="KettlebellSettingsScreen">
            {({ route, navigation }) => (
              <KettlebellSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="BicycleSettingsScreen">
            {({ route, navigation }) => (
              <BicycleSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="HeartPulseSettingsScreen">
            {({ route, navigation }) => (
              <HeartPulseSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="HandsUpSettingsScreen">
            {({ route, navigation }) => (
              <HandsUpSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
          <Stack.Screen name="WeightSettingsScreen">
            {({ route, navigation }) => (
              <WeightSettingsScreen navigation={navigation} onBack={() => navigation.goBack()} workoutId={route.params?.workoutId} />
            )}
          </Stack.Screen>
      </Stack.Navigator>
    );
  };

  const AppContent = () => {
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);
    const { colors } = useContext(ThemeContext);

    return (
      <>
        <TimerStack />
        {currentRoute !== 'Timer' && (
          <BottomTabBar 
            activeTab={activeTab} 
            onTabPress={handleTabPress}
          />
        )}
      </>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeContext.Provider value={{ colors: Theme.dark }}>
        <TimerContext.Provider value={{
          timerKey, greenTime, restTime, greenReps, redReps, 
          greenCountdownSpeed, redCountdownSpeed, infiniteLoopTime, 
          infiniteSpeed, cycleTrackingEnabled, isPaused, setIsPaused,
          startTimerWithWorkoutSettings, startTimerWithCurrentSettings, handleQuickStart, handleQuickStartForCycleTracking, startInfiniteLoop, 
          startInfiniteLoopWithSpeed, setInfiniteLoopTime, setInfiniteSpeed,
          setGreenTime, setRestTime, setGreenCountdownSpeed, 
          setRedCountdownSpeed, setGreenRepsWithStorage, setRedRepsWithStorage,
          setGreenTimeWithStorage, setRestTimeWithStorage, setGreenCountdownSpeedWithStorage,
          setRedCountdownSpeedWithStorage, setInfiniteLoopTimeWithStorage, setInfiniteSpeedWithStorage,
          totalGreenTime, totalRedTime, totalElapsedTime,
          resetGreenTime, resetRedTime, resetElapsedTime
        }}>
          <NavigationContainer ref={navigationRef}>
            <AppContent />
          </NavigationContainer>
        </TimerContext.Provider>
      </ThemeContext.Provider>
    </GestureHandlerRootView>
  );
}