import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, StatusBar, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TimerContext } from '../contexts/TimerContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LapSettings {
  greenReps?: string;
  redReps?: string;
}

type GreenLapSettingsScreenProps = StackScreenProps<RootStackParamList, 'GreenLapSettingsScreen'> & {
  route: {
    params: {
      isAddMode?: boolean;
    }
  }
};

export function GreenLapSettingsScreen({ route, navigation }: GreenLapSettingsScreenProps) {
  const { workoutId: paramWorkoutId, settings, isAddMode, blockId } = route.params || {};
  const workoutId = paramWorkoutId || 'default';
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext) {
    throw new Error('GreenLapSettingsScreen must be used within a ThemeProvider');
  }

  if (!timerContext) {
    throw new Error('GreenLapSettingsScreen must be used within a TimerProvider');
  }

  const { colors } = themeContext;
  const { startTimerWithCurrentSettings, setGreenRepsWithStorage } = timerContext;
  const [greenLaps, setGreenLaps] = useState('1');
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const pickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(isPickerVisible), [isPickerVisible]); // Updated to use the new signature

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (blockId && workoutId) {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const loadedSettings = await loadWorkoutSettings(workoutId);
             const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
             if (block && block.settings.greenReps) {
                 setGreenLaps(String(block.settings.greenReps));
             }
             return;
        }
        if (workoutId && workoutId !== 'default') {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const loadedSettings = await loadWorkoutSettings(workoutId);
          setGreenLaps(loadedSettings.greenReps);
        } else {
          const storedLaps = await AsyncStorage.getItem('greenLaps');
          setGreenLaps(storedLaps || '1');
        }
      } catch (e) {
        console.error("Failed to load green laps:", e);
      }
    };
    loadSettings();
  }, [workoutId, blockId]);

  // Save settings to AsyncStorage when settings change
  useEffect(() => {
    if (blockId) return; // Don't auto-save if editing a block
    const saveSettings = async () => {
      try {
        if (workoutId && workoutId !== 'default') {
          const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const currentSettings = await loadWorkoutSettings(workoutId);
          await saveWorkoutSettings({
            ...currentSettings,
            greenReps: greenLaps
          });
        } else {
          await AsyncStorage.setItem('greenLaps', greenLaps);
        }
      } catch (e) {
        console.error("Failed to save green laps:", e);
      }
    };
    saveSettings();
  }, [greenLaps, workoutId, blockId]);

  const handlePickerValueChange = (newLaps: string) => {
    setGreenLaps(newLaps);
  };

  const togglePicker = () => {
    const newIsVisible = !isPickerVisible;
    setIsPickerVisible(newIsVisible);
    const toValue = newIsVisible ? 220 : 0;
    Animated.timing(pickerHeight, {
      toValue,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const lapsOptions = Array.from({ length: 9 }, (_, i) => String(i + 1));

  const handleStart = async () => {
    try {
      if (workoutId && workoutId !== 'default') {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...currentSettings,
          greenReps: greenLaps
        });
      } else {
        await AsyncStorage.setItem('greenLaps', greenLaps);
      }
    } catch (e) {
      console.error("Failed to save green laps before start:", e);
    }
    // Update global state when Start Workout is pressed
    setGreenRepsWithStorage(greenLaps);
    // Then start the timer
    startTimerWithCurrentSettings(true); // Assuming custom workout for cards
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib width={32} height={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Top Check Button (Only in Add Mode) */}
      {(isAddMode || blockId) && (
        <View style={{ position: 'absolute', top: 50, right: 24, zIndex: 10 }}>
          <TouchableOpacity
            onPress={async () => {
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
                                    greenReps: parseInt(greenLaps, 10)
                                }
                            };
                            
                            await saveWorkoutSettings({
                                ...current,
                                customBlocks: [updatedBlock, ...otherBlocks]
                            });
                        }
                    } else {
                        // Create new block
                        const newBlock = {
                            id: Date.now().toString() + Math.random().toString(),
                            type: 'lap' as const,
                            settings: {
                                greenReps: parseInt(greenLaps, 10),
                                redReps: 3
                            }
                        };
                        await saveWorkoutSettings({
                            ...current,
                            customBlocks: [newBlock, ...(current.customBlocks || [])]
                        });
                    }
                    navigation.pop(2);
                }
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.lap.primary,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
          >
            <MaterialCommunityIcons name="check" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Laps</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: 32,
              borderBottomLeftRadius: isPickerVisible ? 0 : 32,
              borderBottomRightRadius: isPickerVisible ? 0 : 32
            }
          ]}
          onPress={togglePicker}
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
          <Text style={styles.cardTitle}>Workout Laps</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 32 }]}>
            <Text style={styles.valueText}>{greenLaps} {greenLaps === '1' ? 'time' : 'times'}</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 0, marginTop: -1, marginBottom: isPickerVisible ? 12 : 0 }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <Picker
            selectedValue={greenLaps}
            onValueChange={(itemValue: string) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 170 }}
          >
            {lapsOptions.map(val => (
              <Picker.Item key={val} label={`${val} ${val === '1' ? 'time' : 'times'}`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.lap.primary, height: 50 }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}