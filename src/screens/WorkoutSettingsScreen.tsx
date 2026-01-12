import React, { useState, useCallback, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SettingsScreenStyles as styles } from '../styles/SettingsScreenStyles';
import Theme from '../constants/theme';
import TimeIcon from '../assets/icons/TimeIcon';
import Feather from 'react-native-vector-icons/Feather';
import SpeedIcon from '../assets/icons/speed';
import { ThemeContext } from '../contexts/ThemeContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { loadWorkoutSettings, WorkoutSettings, DEFAULT_WORKOUT_SETTINGS } from '../utils/WorkoutSettingsManager';

type WorkoutSettingsScreenProps = StackScreenProps<RootStackParamList, 'WorkoutSettings'>;

export function WorkoutSettingsScreen({ route, navigation }: WorkoutSettingsScreenProps) {
  const { workoutId, workoutName } = route.params || { workoutId: '', workoutName: '' };
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error('WorkoutSettingsScreen must be used within a ThemeProvider');
  }
  const { colors } = themeContext;
  const [settings, setSettings] = useState<WorkoutSettings>({ workoutId, ...DEFAULT_WORKOUT_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const load = async () => {
        try {
          const loadedSettings = await loadWorkoutSettings(workoutId);
          if (isMounted) {
            setSettings(loadedSettings);
          }
        } catch (e) {
          console.error("Failed to load settings for workout:", workoutId, e);
          if (isMounted) {
            setSettings({ workoutId, ...DEFAULT_WORKOUT_SETTINGS });
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
      load();

      return () => {
        isMounted = false;
      };
    }, [workoutId])
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
        <Feather name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>{workoutName}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Card - MODE: 'time' */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TimeSelectionScreen', { workoutId, workoutName })}
          activeOpacity={0.8}
          style={[styles.settingCard, { backgroundColor: colors.cardBackground }]}
        >
          <TimeIcon size={40} color={colors.primary} />
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Time</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {`${settings.greenTime}sec`}
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Speed Card - MODE: 'speed' */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SpeedSelectionScreen', { workoutId, workoutName })}
          activeOpacity={0.8}
          style={[styles.settingCard, { backgroundColor: colors.cardBackground }]}
        >
          <SpeedIcon size={40} color={colors.primary} />
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Speed</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {`${(settings.greenCountdownSpeed / 1000).toFixed(1)}sec`}
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Lap Card - MODE: 'lap' */}
        <TouchableOpacity
          onPress={() => navigation.navigate('LapSelectionScreen', { workoutId, workoutName })}
          activeOpacity={0.8}
          style={[styles.settingCard, { backgroundColor: colors.cardBackground }]}
        >
          <Feather name="repeat" size={40} color={colors.primary} />
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Lap</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {`${settings.greenReps}times`}
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
