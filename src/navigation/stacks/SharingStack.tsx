import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SharingScreen from '../../screens/SharingScreen';
import CustomizeSharingScreen from '../../screens/CustomizeSharingScreen';
import { RootStackParamList } from '../RootNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const SharingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SharingMain" component={SharingScreen} />
      <Stack.Screen name="CustomizeSharing" component={CustomizeSharingScreen} />
    </Stack.Navigator>
  );
};

export default SharingStack;
