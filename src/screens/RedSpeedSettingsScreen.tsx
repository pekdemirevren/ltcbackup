import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, UIManager, Platform, StatusBar, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpeedIcon from '../assets/icons/speed'; // Assuming speed.jsx is now speed.tsx
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SpeedSettings {
  greenSpeed?: number;
  redSpeed?: number;
}

type RedSpeedSettingsScreenProps = StackScreenProps<RootStackParamList, 'RedSpeedSettingsScreen'> & {
  route: {
    params: {
      isAddMode?: boolean;
    }
  }
};

export function RedSpeedSettingsScreen({ route, navigation }: RedSpeedSettingsScreenProps) {
  const { settings, workoutId, isAddMode, blockId } = route.params || {};
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext) {
    throw new Error('RedSpeedSettingsScreen must be used within a ThemeProvider');
  }

  if (!timerContext) {
    throw new Error('RedSpeedSettingsScreen must be used within a TimerProvider');
  }

  const { colors } = themeContext;
  const { startTimerWithCurrentSettings, setRedCountdownSpeed: setGlobalRedCountdownSpeed } = timerContext;

  const [redSpeed, setRedSpeed] = useState(settings?.redSpeed || 1.0);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const pickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(isPickerVisible), [isPickerVisible]); // Updated to use the new signature

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (blockId && workoutId) {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const loadedSettings = await loadWorkoutSettings(workoutId);
             const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
             if (block && block.settings.redCountdownSpeed) {
                 setRedSpeed(block.settings.redCountdownSpeed / 1000);
             }
             return;
        }
        if (workoutId) {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const loadedSettings = await loadWorkoutSettings(workoutId);
          setRedSpeed(loadedSettings.redCountdownSpeed / 1000);
        } else {
          const stored = await AsyncStorage.getItem('redSpeed');
          if (stored) {
            setRedSpeed(parseFloat(stored));
          }
        }
      } catch (e) {
        console.error("Failed to load red speed:", e);
      }
    };
    loadSettings();
  }, [workoutId, blockId]);

  // Save settings and update context
  useEffect(() => {
    if (blockId) return; // Don't auto-save if editing a block
    const saveSettings = async () => {
      try {
        if (workoutId) {
          const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const currentSettings = await loadWorkoutSettings(workoutId);
          await saveWorkoutSettings({
            ...currentSettings,
            redCountdownSpeed: redSpeed * 1000
          });
        } else {
          await AsyncStorage.setItem('redSpeed', redSpeed.toString());
        }
      } catch (e) {
        console.error("Failed to save red speed:", e);
      }
    };
    saveSettings();
    // Update context
    setGlobalRedCountdownSpeed(redSpeed * 1000);
  }, [redSpeed, setGlobalRedCountdownSpeed, workoutId, blockId]);

  const handleSpeedPickerValueChange = (newSpeed: number) => {
    setRedSpeed(newSpeed);
  };

  const handleStart = async () => {
    try {
      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...currentSettings,
          redCountdownSpeed: redSpeed * 1000
        });
      } else {
        await AsyncStorage.setItem('redSpeed', redSpeed.toString());
      }
    } catch (e) {
      console.error("Failed to save red speed before start:", e);
    }

    // Update global state
    setGlobalRedCountdownSpeed(redSpeed * 1000);
    // Then start the timer
    startTimerWithCurrentSettings(true);
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

  const speedOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 0.5);

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
                                    redCountdownSpeed: redSpeed * 1000
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
                            type: 'speed' as const,
                            settings: {
                                greenCountdownSpeed: 1000,
                                redCountdownSpeed: redSpeed * 1000
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
              backgroundColor: colors.speed.primary,
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
        <Text style={styles.headerTitle}>Break Speed</Text>
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
            <SpeedIcon width={32} height={32} color={colors.speed.primary} />
          </View>
          <Text style={styles.cardTitle}>Break Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 32 }]}>
            <Text style={styles.valueText}>{Number(redSpeed).toFixed(1)}sec</Text>
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
            selectedValue={redSpeed}
            onValueChange={(itemValue: number) => handleSpeedPickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 170 }}
          >
            {speedOptions.map(val => (
              <Picker.Item key={val} label={`${val.toFixed(1)} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.speed.primary, height: 50 }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}