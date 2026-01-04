import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './SettingsScreen.styles'; // Reuse existing styles
import { Theme } from './Theme';
import { Feather } from '@expo/vector-icons';
import SpeedIcon from './assets/icons/speed.jsx'; // Import SpeedIcon

const ALL_SETTINGS_KEY = 'all_workout_settings';

// Default settings for any new workout
const defaultSettings = {
  greenTime: '30',
  restTime: '15',
  greenReps: '3',
  redReps: '3',
  greenSpeed: 1, // in seconds
  redSpeed: 1, // in seconds
};

export function WorkoutSettingsScreen({ route, navigation }) {
  const { workoutId, workoutName } = route.params;
  const colors = Theme.dark;
  const styles = getStyles(colors);

  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings for this specific workout from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const allSettingsStr = await AsyncStorage.getItem(ALL_SETTINGS_KEY);
        const allSettings = allSettingsStr ? JSON.parse(allSettingsStr) : {};
        const workoutSettings = allSettings[workoutId] || defaultSettings;
        setSettings(workoutSettings);
      } catch (e) {
        console.error("Failed to load settings for workout:", workoutId, e);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [workoutId]);

  // Function to save settings for this specific workout
  const saveSetting = useCallback(async (key, value) => {
    try {
      const newWorkoutSettings = { ...settings, [key]: value };
      setSettings(newWorkoutSettings); // Update local state immediately

      const allSettingsStr = await AsyncStorage.getItem(ALL_SETTINGS_KEY);
      const allSettings = allSettingsStr ? JSON.parse(allSettingsStr) : {};
      allSettings[workoutId] = newWorkoutSettings;

      await AsyncStorage.setItem(ALL_SETTINGS_KEY, JSON.stringify(allSettings));
    } catch (e) {
      console.error("Failed to save setting for workout:", workoutId, e);
    }
  }, [settings, workoutId]);

  // This function will be passed to child screens to update the settings
  const updateSetting = (key, value) => {
    saveSetting(key, value);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Feather name="arrow-left" size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{workoutName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.time.card }]} onPress={() => navigation.navigate('TimeSelectionScreen', { workoutId: workoutId, settings: settings, onSave: updateSetting })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Time</Text>
            <Text style={[styles.cardSubtitle, { color: colors.time.primary }]}>{`${settings.greenTime}sec`}</Text>
          </View>
        </TouchableOpacity>

        {/* Speed Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: '#011E29' }]} onPress={() => navigation.navigate('SpeedSelectionScreen', { workoutId: workoutId, settings: settings, onSave: updateSetting })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <SpeedIcon width={36} height={36} color={colors.speed.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Speed</Text>
            <Text style={[styles.cardSubtitle, { color: colors.speed.primary }]}>{`${settings.greenSpeed.toFixed(1)}sec`}</Text>
          </View>
        </TouchableOpacity>

        {/* Lap Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.lap.card }]} onPress={() => navigation.navigate('LapSelectionScreen', { workoutId: workoutId, settings: settings, onSave: updateSetting })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib name={Theme.Icons.lap.name} size={32} color={colors.lap.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: '#e5e5e5' }]}>Lap</Text>
            <Text style={[styles.cardSubtitle, { color: colors.lap.primary }]}>{`${settings.greenReps}times`}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}