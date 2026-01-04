// src/navigation/stacks/WorkoutStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WorkoutScreen } from '../../screens/WorkoutScreen';
import { LoopSelectionScreen } from '../../screens/LoopSelectionScreen';
import { LoopScreen } from '../../screens/LoopScreen';
import { LoopTimeScreen } from '../../screens/LoopTimeScreen';
import { LoopSpeedScreen } from '../../screens/LoopSpeedScreen';
import { TimeSelectionScreen } from '../../screens/TimeSelectionScreen';
import { GreenTimeSettingsScreen } from '../../screens/GreenTimeSettingsScreen';
import { RedTimeSettingsScreen } from '../../screens/RedTimeSettingsScreen';
import { SpeedSelectionScreen } from '../../screens/SpeedSelectionScreen';
import { GreenSpeedSettingsScreen } from '../../screens/GreenSpeedSettingsScreen';
import { RedSpeedSettingsScreen } from '../../screens/RedSpeedSettingsScreen';
import { LapSelectionScreen } from '../../screens/LapSelectionScreen';
import { GreenLapSettingsScreen } from '../../screens/GreenLapSettingsScreen';
import { RedLapSettingsScreen } from '../../screens/RedLapSettingsScreen';
import { WeightSelectionScreen } from '../../screens/WeightSelectionScreen';
import { CreateWorkoutBlockScreen } from '../../screens/CreateWorkoutBlockScreen';
import { RootStackParamList } from '../RootNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const WorkoutStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutMain" component={WorkoutScreen} />


      {/* Loop/Time/Speed/Lap screens - kept for backward compatibility */}
      <Stack.Screen name="LoopSelection" component={LoopSelectionScreen} />
      <Stack.Screen name="LoopScreen" component={LoopScreen} />
      <Stack.Screen name="LoopTime" component={LoopTimeScreen} />
      <Stack.Screen name="LoopSpeed" component={LoopSpeedScreen} />
      <Stack.Screen name="TimeSelectionScreen" component={TimeSelectionScreen} />
      <Stack.Screen name="GreenTimeSettingsScreen" component={GreenTimeSettingsScreen} />
      <Stack.Screen name="RedTimeSettingsScreen" component={RedTimeSettingsScreen} />
      <Stack.Screen name="SpeedSelectionScreen" component={SpeedSelectionScreen} />
      <Stack.Screen name="GreenSpeedSettingsScreen" component={GreenSpeedSettingsScreen} />
      <Stack.Screen name="RedSpeedSettingsScreen" component={RedSpeedSettingsScreen} />
      <Stack.Screen name="LapSelectionScreen" component={LapSelectionScreen} />
      <Stack.Screen name="GreenLapSettingsScreen" component={GreenLapSettingsScreen} />
      <Stack.Screen name="RedLapSettingsScreen" component={RedLapSettingsScreen} />
      <Stack.Screen name="WeightSelectionScreen" component={WeightSelectionScreen} />
      <Stack.Screen name="CreateWorkoutBlockScreen" component={CreateWorkoutBlockScreen} />
    </Stack.Navigator>
  );
};

export default WorkoutStack;
