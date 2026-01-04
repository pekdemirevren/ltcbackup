import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../navigation/RootNavigator';
import Theme from '../constants/theme';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { loadWorkoutSettings, saveWorkoutSettings } from '../utils/WorkoutSettingsManager';

type LapSelectionScreenProps = StackScreenProps<RootStackParamList, 'LapSelectionScreen'>;

export function LapSelectionScreen({ route, navigation }: LapSelectionScreenProps) {
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext) {
    throw new Error('LapSelectionScreen must be used within a ThemeProvider');
  }
  const { colors } = themeContext;

  if (!timerContext) {
    throw new Error('LapSelectionScreen must be used within a TimerProvider');
  }
  const { startTimerWithCurrentSettings, setGreenReps, setRedReps } = timerContext;

  const styles = getCardButtonPickerStyles(false);
  const { workoutId, isAddMode, blockId } = (route.params || {}) as { workoutId?: string; isAddMode?: boolean; blockId?: string };

  const [localGreenReps, setLocalGreenReps] = useState('3');
  const [localRedReps, setLocalRedReps] = useState('3');
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  // Animation refs
  const greenPickerHeight = useRef(new Animated.Value(0)).current;
  const redPickerHeight = useRef(new Animated.Value(0)).current;
  const [isGreenPickerVisible, setIsGreenPickerVisible] = useState(false);
  const [isRedPickerVisible, setIsRedPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          if (blockId && workoutId) {
             const settings = await loadWorkoutSettings(workoutId);
             const block = settings.customBlocks?.find((b: any) => b.id === blockId);
             if (block) {
                 if (block.settings.greenReps) setLocalGreenReps(String(block.settings.greenReps));
                 if (block.settings.redReps) setLocalRedReps(String(block.settings.redReps));
             }
             return;
          }
          if (workoutId && workoutId !== 'default') {
             const settings = await loadWorkoutSettings(workoutId);
             if (settings) {
                setCurrentSettings(settings);
                setLocalGreenReps(String(settings.greenReps || '3'));
                setLocalRedReps(String(settings.redReps || '3'));
             }
          } else {
             const storedGreen = await AsyncStorage.getItem('greenLaps');
             const storedRed = await AsyncStorage.getItem('redLaps');
             setLocalGreenReps(storedGreen || '3');
             setLocalRedReps(storedRed || '3');
          }
        } catch (e) {
          console.error("Failed to load lap settings", e);
        }
      };
      loadSettings();
    }, [workoutId])
  );

  const saveSettings = async () => {
    const updatedSettings = {
      ...(currentSettings || {}),
      greenReps: parseInt(localGreenReps, 10),
      redReps: parseInt(localRedReps, 10),
    };

    // Update Context
    setGreenReps(localGreenReps);
    setRedReps(localRedReps);

    if (workoutId && workoutId !== 'default') {
      updatedSettings.workoutId = workoutId;
      await saveWorkoutSettings(updatedSettings);
    } else {
      await AsyncStorage.setItem('greenLaps', localGreenReps);
      await AsyncStorage.setItem('redLaps', localRedReps);
    }
    return updatedSettings;
  };

  const handleCheckPress = async () => {
    if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const current = await loadWorkoutSettings(workoutId);

        if (blockId) {
             // Update existing block and move to top
            const otherBlocks = current.customBlocks?.filter((b: any) => b.id !== blockId) || [];
            const existingBlock = current.customBlocks?.find((b: any) => b.id === blockId);
            
            if (existingBlock) {
                const updatedBlock = {
                    ...existingBlock,
                    settings: {
                        ...existingBlock.settings,
                        greenReps: parseInt(localGreenReps, 10),
                        redReps: parseInt(localRedReps, 10)
                    }
                };
                
                await saveWorkoutSettings({
                    ...current,
                    customBlocks: [updatedBlock, ...otherBlocks]
                });
            }
        } else if (isAddMode) {
            // Create new block
            const newBlock: any = {
                id: Date.now().toString() + Math.random().toString(),
                type: 'lap',
                settings: {
                    greenReps: parseInt(localGreenReps, 10),
                    redReps: parseInt(localRedReps, 10)
                }
            };
            
            const updatedBlocks = [newBlock, ...(current.customBlocks || [])];
            
            await saveWorkoutSettings({
                ...current,
                customBlocks: updatedBlocks
            });
        } else {
            await saveSettings();
        }
    }
    navigation.goBack();
  };

  const handleStartWorkout = async () => {
    await saveSettings();
    startTimerWithCurrentSettings(true);
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
        <Text style={styles.headerTitle}>Set/Rep Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Reps Card */}
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
          onPress={() => navigation.navigate('GreenLapSettingsScreen', { workoutId, isAddMode, blockId })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib width={32} height={32} color={colors.lap.primary} />
          </View>
          <Text style={styles.cardTitle}>Workout Sets</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 42 }]}>
            <Text style={styles.valueText}>{localGreenReps} {localGreenReps === '1' ? 'time' : 'times'}</Text>
          </View>
        </TouchableOpacity>

        {/* Red Reps Card */}
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
          onPress={() => navigation.navigate('RedLapSettingsScreen', { workoutId, isAddMode, blockId })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib width={32} height={32} color={colors.lap.primary} />
          </View>
          <Text style={styles.cardTitle}>Reps</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 42 }]}>
            <Text style={styles.valueText}>{localRedReps} {localRedReps === '1' ? 'time' : 'times'}</Text>
          </View>
        </TouchableOpacity>

        {/* Start Workout Butonu (Only if NOT in Add Mode) */}
        {!isAddMode && (
          <TouchableOpacity onPress={handleStartWorkout} style={[styles.startButton, { backgroundColor: colors.lap.primary }]} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}