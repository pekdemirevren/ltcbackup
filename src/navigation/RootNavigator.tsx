// src/navigation/RootNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import SummaryStack from './stacks/SummaryStack';
import WorkoutStack from './stacks/WorkoutStack';
import SharingStack from './stacks/SharingStack';
import { TimerScreen } from '../screens/TimerScreen';
import { WorkoutSummaryScreen } from '../screens/WorkoutSummaryScreen';
import AdjustMoveGoalScreen from '../screens/AdjustMoveGoalScreen';
import MoveGoalScheduleScreen from '../screens/MoveGoalScheduleScreen';
import DailyMoveGoalScreen from '../screens/DailyMoveGoalScreen';
import TrendsScreen from '../screens/TrendsScreen';
import EnergyTrendScreen from '../screens/EnergyTrendScreen';
import StrengthTrendScreen from '../screens/StrengthTrendScreen';
import SetsTrendScreen from '../screens/SetsTrendScreen';
import EnduranceTrendScreen from '../screens/EnduranceTrendScreen';
import MoveScreen from '../screens/MoveScreen';
import { WorkoutAnimationKey } from '../animations/workoutAnimations';
import ConsistencyTrendScreen from '../screens/ConsistencyTrendScreen';
import BalanceTrendScreen from '../screens/BalanceTrendScreen';
import CadenceTrendScreen from '../screens/CadenceTrendScreen';
import DensityTrendScreen from '../screens/DensityTrendScreen';
import IntensityTrendScreen from '../screens/IntensityTrendScreen';
import { GenericWorkoutSettingsScreen } from '../screens/GenericWorkoutSettingsScreen';
import { LoopSelectionScreen } from '../screens/LoopSelectionScreen';
import { LoopTimeScreen } from '../screens/LoopTimeScreen';
import { LoopSpeedScreen } from '../screens/LoopSpeedScreen';
import { TimeSelectionScreen } from '../screens/TimeSelectionScreen';
import { SpeedSelectionScreen } from '../screens/SpeedSelectionScreen';
import { LapSelectionScreen } from '../screens/LapSelectionScreen';
import { WeightSelectionScreen } from '../screens/WeightSelectionScreen';
import { GreenTimeSettingsScreen } from '../screens/GreenTimeSettingsScreen';
import { RedTimeSettingsScreen } from '../screens/RedTimeSettingsScreen';
import { GreenSpeedSettingsScreen } from '../screens/GreenSpeedSettingsScreen';
import { RedSpeedSettingsScreen } from '../screens/RedSpeedSettingsScreen';
import { GreenLapSettingsScreen } from '../screens/GreenLapSettingsScreen';
import { RedLapSettingsScreen } from '../screens/RedLapSettingsScreen';
import AllCategoriesScreen from '../screens/AllCategoriesScreen';
import SessionsScreen from '../screens/SessionsScreen';
import WorkoutCategoryDetailScreen from '../screens/WorkoutCategoryDetailScreen';
import DailyWorkoutDetailScreen from '../screens/DailyWorkoutDetailScreen';
import WorkoutCalendarScreen from '../screens/WorkoutCalendarScreen';
import WorkoutEventDetailScreen from '../screens/WorkoutEventDetailScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CreateWorkoutEventScreen from '../screens/CreateWorkoutEventScreen';
import PlanlamaEkrani from '../screens/PlanlamaEkrani';
import type { SharingWorkoutData } from '../types/sharing';

// TypeScript Types
export interface TimerScreenParams {
  workoutId?: string;
  workoutName?: string;
  animationKey?: WorkoutAnimationKey;
  settings?: {
    greenTime: string;
    restTime: string;
    greenReps: string;
    redReps: string;
    cycleTrackingEnabled: boolean;
  };
  modeType?: string;
  initialGreenTime?: string;
  initialRestTime?: string;
  initialGreenReps?: string;
  initialRedReps?: string;
  initialGreenCountdownSpeed?: number;
  initialRedCountdownSpeed?: number;
  initialInfiniteLoopTime?: string;
  initialInfiniteSpeed?: number;
  initialCycleTrackingEnabled?: boolean;
  initialIsPaused?: boolean;
  initialLoopPhase?: 'green' | 'red';
}

export type RootStackParamList = {
  Main: undefined;
  Timer: TimerScreenParams;
  Summary: undefined;
  SummaryOverview: undefined;
  DailySummaryDetail: undefined;
  Cadence: undefined;
  Intensity: undefined;
  Density: undefined;
  SetCount: undefined;
  RepsCount: undefined;
  Trends: undefined;
  EnergyTrend: undefined;
  StrengthTrend: undefined;
  SetsTrend: undefined;
  EnduranceTrend: undefined;
  ConsistencyTrend: undefined;
  BalanceTrend: undefined;
  CadenceTrend: undefined;
  DensityTrend: undefined;
  IntensityTrend: undefined;
  MoveScreen: undefined;
  AdjustMoveGoal: undefined;
  MoveGoalSchedule: undefined;
  DailyMoveGoal: undefined;
  AllSetsMetrics: undefined;
  AllWeightMetrics: undefined;
  AllStepsMetrics: undefined;
  AllCadenceMetrics: undefined;
  AllIntensityMetrics: undefined;
  AllDensityMetrics: undefined;
  Workout: undefined;
  Sharing: undefined;
  SharingMain: undefined;
  CustomizeSharing: { workoutData: SharingWorkoutData; performedWorkouts: string };
  Settings: undefined;
  WorkoutSettings: undefined;
  WorkoutMain: undefined;
  WorkoutSummaryScreen: { workoutId: string; workoutName: string };
  GenericWorkoutSettingsScreen: { workoutId: string; workoutName: string };
  LoopSelection: { workoutId?: string; workoutName?: string; isAddMode?: boolean; blockId?: string };
  LoopScreen: { workoutId?: string; workoutName?: string };
  LoopTime: { workoutId?: string; workoutName?: string; isAddMode?: boolean; blockId?: string };
  LoopSpeed: { workoutId?: string; workoutName?: string; infiniteTime?: string; isAddMode?: boolean; blockId?: string };
  TimeSelectionScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  GreenTimeSettingsScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  RedTimeSettingsScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  SpeedSelectionScreen: { workoutId?: string; settings?: any; isAddMode?: boolean; blockId?: string };
  GreenSpeedSettingsScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  RedSpeedSettingsScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  LapSelectionScreen: { workoutId?: string; settings?: any; isAddMode?: boolean; blockId?: string };
  GreenLapSettingsScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  RedLapSettingsScreen: { settings?: any; workoutId?: string; isAddMode?: boolean; blockId?: string };
  WeightSelectionScreen: { workoutId: string; settings?: any; isAddMode?: boolean; blockId?: string };
  CreateWorkoutBlockScreen: { workoutId: string; type: 'loop' | 'time' | 'speed' | 'lap' };
  // New screens for Categories
  AllCategories: undefined;
  SessionsScreen: undefined;
  WorkoutCategoryDetail: { workoutId?: string; workoutName?: string; categoryId?: string; categoryTitle?: string; workoutIds?: string[]; focusMetric?: string };
  DailyWorkoutDetail: { workoutDay?: string; currentDay?: number; totalDays?: number; moveCount?: number; workoutIds?: string[]; dailyCalorieGoal?: number };
  // Calendar Screens
  WorkoutCalendar: { showMonthView?: boolean; timestamp?: number } | undefined;
  WorkoutEventDetail: { eventId: string; date: string };
  EventDetail: { eventId: string; date: string };
  CreateWorkoutEvent: { date?: string; eventId?: string; editMode?: boolean };
  PlanlamaEkrani: undefined;
};

const Tab = createNativeBottomTabNavigator<RootStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: 'rgba(36,43,55,0.8)',
    height: 85,
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabBarActiveTintColor: '#9DEC2C',
  tabBarInactiveTintColor: '#bbb',
  tabBarItemStyle: {
    paddingVertical: 5,
  },
  tabBarShowLabel: true,
};

const summaryScreenOptions = {
  tabBarLabel: 'Summary',
  tabBarIcon: {
    type: 'sfSymbol' as const,
    name: 'ring' as any,
    scale: 'small' as any,
  },
};

const workoutScreenOptions = {
  tabBarLabel: 'Workout',
  tabBarIcon: {
    type: 'sfSymbol' as const,
    name: 'figure.highintensity.intervaltraining' as any,
    scale: 'small' as any,
  },
};

const sharingScreenOptions = {
  tabBarLabel: 'Sharing',
  tabBarIcon: {
    type: 'sfSymbol' as const,
    name: 'person.2.fill' as any,
    scale: 'small' as any,
  },
};

// ✅ TAB NAVIGATOR - TAM VERSİYON
function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Summary"
        component={SummaryStack}
        options={summaryScreenOptions}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutStack}
        options={workoutScreenOptions}
      />
      <Tab.Screen
        name="Sharing"
        component={SharingStack}
        options={sharingScreenOptions}
      />
    </Tab.Navigator>
  );
}

// ✅ ROOT STACK NAVIGATOR - TAM VERSİYON
export default function RootNavigator() {
  const themeContext = React.useContext(ThemeContext);
  const timerContext = React.useContext(TimerContext);

  if (!themeContext || !timerContext) {
    throw new Error('AppContent must be used within ThemeProvider and TimerProvider');
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <RootStack.Screen name="Main" component={TabNavigator} />
      <RootStack.Screen
        name="Timer"
        component={TimerScreen}
        options={{
          gestureEnabled: false, // Timer ekranında geri swipe kapalı
        }}
      />
      <RootStack.Screen name="WorkoutSummaryScreen" component={WorkoutSummaryScreen} />
      <RootStack.Screen
        name="AdjustMoveGoal"
        component={AdjustMoveGoalScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="MoveGoalSchedule"
        component={MoveGoalScheduleScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="DailyMoveGoal"
        component={DailyMoveGoalScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen name="Trends" component={TrendsScreen} />
      <RootStack.Screen name="GenericWorkoutSettingsScreen" component={GenericWorkoutSettingsScreen} />
      <RootStack.Screen name="EnergyTrend" component={EnergyTrendScreen} />
      <RootStack.Screen name="StrengthTrend" component={StrengthTrendScreen} />
      <RootStack.Screen name="SetsTrend" component={SetsTrendScreen} />
      <RootStack.Screen name="EnduranceTrend" component={EnduranceTrendScreen} />
      <RootStack.Screen name="ConsistencyTrend" component={ConsistencyTrendScreen} />
      <RootStack.Screen name="BalanceTrend" component={BalanceTrendScreen} />
      <RootStack.Screen name="CadenceTrend" component={CadenceTrendScreen} />
      <RootStack.Screen name="DensityTrend" component={DensityTrendScreen} />
      <RootStack.Screen name="IntensityTrend" component={IntensityTrendScreen} />
      <RootStack.Screen name="MoveScreen" component={MoveScreen} />
      <RootStack.Screen name="LoopSelection" component={LoopSelectionScreen} />
      <RootStack.Screen name="LoopTime" component={LoopTimeScreen} />
      <RootStack.Screen name="LoopSpeed" component={LoopSpeedScreen} />
      <RootStack.Screen name="TimeSelectionScreen" component={TimeSelectionScreen} />
      <RootStack.Screen name="SpeedSelectionScreen" component={SpeedSelectionScreen} />
      <RootStack.Screen name="LapSelectionScreen" component={LapSelectionScreen} />
      <RootStack.Screen name="WeightSelectionScreen" component={WeightSelectionScreen} />
      <RootStack.Screen name="GreenTimeSettingsScreen" component={GreenTimeSettingsScreen} />
      <RootStack.Screen name="RedTimeSettingsScreen" component={RedTimeSettingsScreen} />
      <RootStack.Screen name="GreenSpeedSettingsScreen" component={GreenSpeedSettingsScreen} />
      <RootStack.Screen name="RedSpeedSettingsScreen" component={RedSpeedSettingsScreen} />
      <RootStack.Screen name="GreenLapSettingsScreen" component={GreenLapSettingsScreen} />
      <RootStack.Screen name="RedLapSettingsScreen" component={RedLapSettingsScreen} />
      
      {/* Categories Screens */}
      <RootStack.Screen name="AllCategories" component={AllCategoriesScreen} />
      <RootStack.Screen name="SessionsScreen" component={SessionsScreen} />
      <RootStack.Screen name="WorkoutCategoryDetail" component={WorkoutCategoryDetailScreen} />
      <RootStack.Screen name="DailyWorkoutDetail" component={DailyWorkoutDetailScreen} />
      
      {/* Calendar Screens */}
      <RootStack.Screen name="WorkoutCalendar" component={WorkoutCalendarScreen} />
      <RootStack.Screen name="WorkoutEventDetail" component={WorkoutEventDetailScreen} />
      <RootStack.Screen name="EventDetail" component={EventDetailScreen} />
      <RootStack.Screen 
        name="CreateWorkoutEvent" 
        component={CreateWorkoutEventScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen name="PlanlamaEkrani" component={PlanlamaEkrani} />
    </RootStack.Navigator>
  );
}
