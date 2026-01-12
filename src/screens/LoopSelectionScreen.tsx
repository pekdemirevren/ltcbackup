import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';

import Theme from '../constants/theme';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import SpeedIcon from '../assets/icons/speed';

type LoopSelectionScreenProps = StackScreenProps<RootStackParamList, 'LoopSelection'> & {
  route: {
    params: {
      workoutId?: string;
      workoutName?: string;
      isAddMode?: boolean;
      blockId?: string;
      settings?: {
        infiniteLoopTime?: string;
        infiniteSpeed?: number;
      };
    }
  }
};

export function LoopSelectionScreen({ route, navigation }: LoopSelectionScreenProps) {
  const { workoutId, workoutName, isAddMode, blockId, settings: blockSettings } = route.params || {};
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!timerContext) {
    throw new Error('LoopSelectionScreen must be used within a TimerProvider');
  }

  if (!themeContext) {
    throw new Error('LoopSelectionScreen must be used within a ThemeProvider');
  }
  const { colors } = themeContext;

  const styles = getCardButtonPickerStyles(false);

  const { startInfiniteLoopWithSpeed, setInfiniteLoopTime, setInfiniteSpeed } = timerContext;

  const [infiniteLoopTime, setLocalInfiniteLoopTime] = useState('15');
  const [infiniteSpeed, setLocalInfiniteSpeed] = useState(1); // Stored as seconds, not milliseconds

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        if (blockSettings) {
          if (blockSettings.infiniteLoopTime) setLocalInfiniteLoopTime(blockSettings.infiniteLoopTime);
          if (blockSettings.infiniteSpeed) setLocalInfiniteSpeed(blockSettings.infiniteSpeed / 1000);
          return;
        }
        if (!workoutId) return;
        try {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const settings = await loadWorkoutSettings(workoutId);

          const timeValue = settings.infiniteLoopTime || '15';
          const speedValue = settings.infiniteSpeed ? settings.infiniteSpeed / 1000 : 1;

          setLocalInfiniteLoopTime(timeValue);
          setLocalInfiniteSpeed(speedValue);

          // Update context
          setInfiniteLoopTime(timeValue);
          setInfiniteSpeed(speedValue * 1000); // Store as ms in context
        } catch (e) {
          console.error("Failed to load settings for workoutId:", workoutId, e);
        }
      };
      loadSettings();
    }, [workoutId, setInfiniteLoopTime, setInfiniteSpeed, blockSettings])
  );

  // Save settings when local state changes
  useEffect(() => {
    if (isAddMode) return;

    const saveSettings = async () => {
      if (!workoutId) return;
      try {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const current = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...current,
          infiniteLoopTime: infiniteLoopTime,
          infiniteSpeed: infiniteSpeed * 1000
        });
      } catch (e) {
        console.error("Failed to save loop settings:", e);
      }
    };
    saveSettings();
  }, [infiniteLoopTime, infiniteSpeed, workoutId, isAddMode]);



  const handleStart = async () => {
    // Ensure settings are saved before start
    if (workoutId) {
      try {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const current = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...current,
          infiniteLoopTime: infiniteLoopTime,
          infiniteSpeed: infiniteSpeed * 1000
        });
      } catch (e) {
        console.error("Failed to save settings before start:", e);
      }
    }

    startInfiniteLoopWithSpeed(
      { time: infiniteLoopTime, speed: infiniteSpeed },
      { workoutId, workoutName }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib width={32} height={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loop Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Infinite Loop Time Card */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: 42
            }
          ]}
          onPress={() => navigation.navigate('LoopTime', { workoutId, workoutName, isAddMode, blockId })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <Theme.Icons.infinity.lib width={32} height={32} color={colors.quickStart.primary} />
          </View>
          <Text style={styles.cardTitle}>Infinite Loop Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{infiniteLoopTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Infinite Loop Speed Card */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: 42
            }
          ]}
          onPress={() => navigation.navigate('LoopSpeed', { workoutId, workoutName, infiniteTime: infiniteLoopTime, isAddMode, blockId })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <SpeedIcon width={32} height={32} color={colors.speed.primary} />
          </View>
          <Text style={styles.cardTitle}>Infinite Loop Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{infiniteSpeed.toFixed(1)}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Start Workout Button */}
        {!isAddMode && (
          <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.quickStart.primary }]} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}