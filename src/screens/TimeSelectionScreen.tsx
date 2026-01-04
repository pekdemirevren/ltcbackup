import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

import Theme from '../constants/theme';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';

type TimeSelectionScreenProps = StackScreenProps<RootStackParamList, 'TimeSelectionScreen'> & {
  route: {
    params: {
      isAddMode?: boolean;
    }
  }
};

export function TimeSelectionScreen({ route, navigation }: TimeSelectionScreenProps) {
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext) {
    throw new Error('TimeSelectionScreen must be used within a ThemeProvider');
  }

  if (!timerContext) {
    throw new Error('TimeSelectionScreen must be used within a TimerProvider');
  }

  const { colors } = themeContext;
  const { startTimerWithCurrentSettings, setGreenTime, setRedTime } = timerContext;
  
  const { workoutId, isAddMode, blockId, settings: blockSettings } = route.params || {};

  const [localGreenTime, setLocalGreenTime] = useState('30');
  const [localRedTime, setLocalRedTime] = useState('15');
  
  const styles = getCardButtonPickerStyles(false);

  // Load settings
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        if (blockSettings) {
             if (blockSettings.greenTime) setLocalGreenTime(blockSettings.greenTime.toString());
             if (blockSettings.restTime) setLocalRedTime(blockSettings.restTime.toString());
             return;
        }
        if (!workoutId) return;
        try {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const settings = await loadWorkoutSettings(workoutId);
          
          if (settings.greenTime) setLocalGreenTime(settings.greenTime.toString());
          if (settings.restTime) setLocalRedTime(settings.restTime.toString());
          
          // Update context
          if (settings.greenTime) setGreenTime(settings.greenTime.toString());
          if (settings.restTime) setRedTime(settings.restTime.toString());
        } catch (e) {
          console.error("Failed to load time settings:", e);
        }
      };
      loadSettings();
    }, [workoutId, setGreenTime, setRedTime, blockSettings])
  );

  // Save settings
  const saveSettings = async () => {
    if (!workoutId) return;
    try {
      const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
      const current = await loadWorkoutSettings(workoutId);
      await saveWorkoutSettings({
        ...current,
        greenTime: localGreenTime,
        restTime: localRedTime
      });
    } catch (e) {
      console.error("Failed to save time settings:", e);
    }
  };

  // Auto-save on change (ONLY if NOT in Add Mode)
  useEffect(() => {
    if (!isAddMode) {
        saveSettings();
        setGreenTime(localGreenTime);
        setRedTime(localRedTime);
    }
  }, [localGreenTime, localRedTime, workoutId, isAddMode]);

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
                        greenTime: localGreenTime,
                        restTime: localRedTime
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
                type: 'time',
                settings: {
                    greenTime: localGreenTime,
                    restTime: localRedTime
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
        <Text style={styles.headerTitle}>Time Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Time Card */}
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
          onPress={() => navigation.navigate('GreenTimeSettingsScreen', { workoutId, isAddMode, blockId })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib width={32} height={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Reps Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{localGreenTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Red Time Card */}
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
          onPress={() => navigation.navigate('RedTimeSettingsScreen', { workoutId, isAddMode, blockId })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib width={32} height={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Rest Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{localRedTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Start Workout Button (Only if NOT in Add Mode) */}
        {!isAddMode && (
          <TouchableOpacity
            onPress={() => {
              setGreenTime(localGreenTime);
              setRedTime(localRedTime);
              setTimeout(() => {
                startTimerWithCurrentSettings(true);
              }, 0);
            }}
            style={[styles.startButton, { backgroundColor: colors.time.primary }]}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}