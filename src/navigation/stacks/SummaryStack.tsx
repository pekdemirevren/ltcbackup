import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SummaryScreen from '../../screens/SummaryScreen';
import DailySummaryDetailScreen from '../../screens/DailySummaryDetailScreen';
import CadenceScreen from '../../screens/CadenceScreen';
import IntensityScreen from '../../screens/IntensityScreen';
import DensityScreen from '../../screens/DensityScreen';
import SetCountScreen from '../../screens/SetCountScreen';
import RepsCountScreen from '../../screens/RepsCountScreen';
import AllSetsMetricsScreen from '../../screens/AllSetsMetricsScreen';
import AllWeightMetricsScreen from '../../screens/AllWeightMetricsScreen';
import AllCadenceMetricsScreen from '../../screens/AllCadenceMetricsScreen';
import AllIntensityMetricsScreen from '../../screens/AllIntensityMetricsScreen';
import AllDensityMetricsScreen from '../../screens/AllDensityMetricsScreen';
import { RootStackParamList } from '../RootNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const SummaryStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SummaryOverview" component={SummaryScreen} />
      <Stack.Screen name="DailySummaryDetail" component={DailySummaryDetailScreen} />
      <Stack.Screen name="Cadence" component={CadenceScreen} />
      <Stack.Screen name="Intensity" component={IntensityScreen} />
      <Stack.Screen name="Density" component={DensityScreen} />
      <Stack.Screen name="SetCount" component={SetCountScreen} />
      <Stack.Screen name="RepsCount" component={RepsCountScreen} />
      <Stack.Screen name="AllSetsMetrics" component={AllSetsMetricsScreen} />
      <Stack.Screen name="AllWeightMetrics" component={AllWeightMetricsScreen} />
      <Stack.Screen name="AllCadenceMetrics" component={AllCadenceMetricsScreen} />
      <Stack.Screen name="AllIntensityMetrics" component={AllIntensityMetricsScreen} />
      <Stack.Screen name="AllDensityMetrics" component={AllDensityMetricsScreen} />
    </Stack.Navigator>
  );
};

export default SummaryStack;
