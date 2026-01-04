import React, { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Picker } from '@react-native-picker/picker';

import Theme from '../constants/theme';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import SpeedIcon from '../assets/icons/speed';

type SpeedSelectionScreenProps = StackScreenProps<RootStackParamList, 'SpeedSelectionScreen'> & {
  route: {
    params: {
      isAddMode?: boolean;
    }
  }
};

export function SpeedSelectionScreen({ route, navigation }: SpeedSelectionScreenProps) {
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext) {
    throw new Error('SpeedSelectionScreen must be used within a ThemeProvider');
  }

  if (!timerContext) {
    throw new Error('SpeedSelectionScreen must be used within a TimerProvider');
  }

  const { colors } = themeContext;
  const { startTimerWithCurrentSettings, setGreenCountdownSpeed, setRedCountdownSpeed } = timerContext;
  const styles = getCardButtonPickerStyles(false);

  const { workoutId, isAddMode, blockId } = route.params || {};

  const [localGreenSpeed, setLocalGreenSpeed] = useState(1);
  const [localRedSpeed, setLocalRedSpeed] = useState(1);

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          if (blockId && workoutId) {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const loadedSettings = await loadWorkoutSettings(workoutId);
             const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
             if (block) {
                 if (block.settings.greenCountdownSpeed) setLocalGreenSpeed(block.settings.greenCountdownSpeed / 1000);
                 if (block.settings.redCountdownSpeed) setLocalRedSpeed(block.settings.redCountdownSpeed / 1000);
             }
             return;
          }
          if (workoutId && workoutId !== 'default') {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const settings = await loadWorkoutSettings(workoutId);
             const g = settings.greenCountdownSpeed || 1000;
             const r = settings.redCountdownSpeed || 1000;
             setLocalGreenSpeed(g / 1000);
             setLocalRedSpeed(r / 1000);
             setGreenCountdownSpeed(g);
             setRedCountdownSpeed(r);
          } else {
             const storedGreen = await AsyncStorage.getItem('greenSpeed');
             const storedRed = await AsyncStorage.getItem('redSpeed');
             const g = storedGreen ? parseInt(storedGreen) : 1000;
             const r = storedRed ? parseInt(storedRed) : 1000;
             setLocalGreenSpeed(g / 1000);
             setLocalRedSpeed(r / 1000);
             setGreenCountdownSpeed(g);
             setRedCountdownSpeed(r);
          }
        } catch (e) {
          console.error("Failed to load speed settings", e);
        }
      };
      loadSettings();
    }, [workoutId, setGreenCountdownSpeed, setRedCountdownSpeed])
  );

  const saveSettings = async () => {
    try {
        if (workoutId && workoutId !== 'default') {
            const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
            const current = await loadWorkoutSettings(workoutId);
            await saveWorkoutSettings({
                ...current,
                greenCountdownSpeed: localGreenSpeed * 1000,
                redCountdownSpeed: localRedSpeed * 1000
            });
        } else {
            await AsyncStorage.setItem('greenSpeed', (localGreenSpeed * 1000).toString());
            await AsyncStorage.setItem('redSpeed', (localRedSpeed * 1000).toString());
        }
    } catch (e) {
        console.error("Failed to save speed settings:", e);
    }
  };

  useEffect(() => {
      if (!isAddMode) {
          saveSettings();
          setGreenCountdownSpeed(localGreenSpeed * 1000);
          setRedCountdownSpeed(localRedSpeed * 1000);
      }
  }, [localGreenSpeed, localRedSpeed, workoutId, isAddMode]);

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
                        greenCountdownSpeed: localGreenSpeed * 1000,
                        redCountdownSpeed: localRedSpeed * 1000
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
                type: 'speed',
                settings: {
                    greenCountdownSpeed: localGreenSpeed * 1000,
                    redCountdownSpeed: localRedSpeed * 1000
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
        <Text style={styles.headerTitle}>Speed Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Speed Card */}
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
          onPress={() => navigation.navigate('GreenSpeedSettingsScreen', { workoutId, isAddMode, blockId })}
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
          <Text style={styles.cardTitle}>Reps Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{localGreenSpeed.toFixed(1)}s</Text>
          </View>
        </TouchableOpacity>

        {/* Red Speed Card */}
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
          onPress={() => navigation.navigate('RedSpeedSettingsScreen', { workoutId, isAddMode, blockId })}
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
          <Text style={styles.cardTitle}>Rest Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{localRedSpeed.toFixed(1)}s</Text>
          </View>
        </TouchableOpacity>

        {/* Start Workout Button (Only if NOT in Add Mode) */}
        {!isAddMode && (
            <TouchableOpacity onPress={() => startTimerWithCurrentSettings(true)} style={[styles.startButton, { backgroundColor: colors.speed.primary }]} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}