import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  UIManager,
  Platform,
  Easing,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Picker } from '@react-native-picker/picker';
import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimeIcon from '../assets/icons/TimeIcon';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GreenTimeSettings {
  greenTime?: string;
  redTime?: string;
  greenReps?: string;
  redReps?: string;
  greenSpeed?: number;
  redSpeed?: number;
}

type GreenTimeSettingsScreenProps = StackScreenProps<RootStackParamList, 'GreenTimeSettingsScreen'> & {
  route: {
    params: {
      isAddMode?: boolean;
    }
  }
};

export function GreenTimeSettingsScreen({ route, navigation }: GreenTimeSettingsScreenProps) {
  const { workoutId, settings, isAddMode, blockId } = route.params || {};
  // Global tema context'ini kullan
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext || !themeContext.colors || !timerContext) {
    throw new Error('GreenTimeSettingsScreen must be used within ThemeProvider and TimerProvider');
  }

  const { colors } = themeContext;
  const { startTimerWithCurrentSettings, setGreenTime: setGlobalGreenTime } = timerContext;

  const [greenTime, setGreenTime] = useState(settings?.greenTime?.toString() || '30'); // in seconds

  const [isGreenPickerVisible, setIsGreenPickerVisible] = useState(false);
  const greenPickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(isGreenPickerVisible), [isGreenPickerVisible]); // Updated to use the new signature

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (blockId && workoutId) {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const loadedSettings = await loadWorkoutSettings(workoutId);
             const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
             if (block && block.settings.greenTime) {
                 setGreenTime(block.settings.greenTime);
             }
             return;
        }
        if (workoutId) {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const loadedSettings = await loadWorkoutSettings(workoutId);
          setGreenTime(loadedSettings.greenTime);
        } else {
          // Fallback for global if needed, or just keep default
          const storedTime = await AsyncStorage.getItem('greenTime');
          if (storedTime) {
            setGreenTime(storedTime);
          }
        }
      } catch (e) {
        console.error("Failed to load green time:", e);
      }
    };
    loadSettings();
  }, [workoutId, blockId]);

  // Save settings to AsyncStorage when settings change
  useEffect(() => {
    if (blockId) return; // Don't auto-save if editing a block
    // Only update global context here, save to storage on explicit save/start or debounce?
    // Actually the design was to save on change or start.
    // Let's safe on change for now as in original code.
    const saveSettings = async () => {
      try {
        if (workoutId) {
          const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const currentSettings = await loadWorkoutSettings(workoutId);
          await saveWorkoutSettings({
            ...currentSettings,
            greenTime: greenTime
          });
        } else {
          await AsyncStorage.setItem('greenTime', greenTime);
        }
      } catch (e) {
        console.error("Failed to save green time:", e);
      }
    };
    saveSettings();
    // Update context
    setGlobalGreenTime(greenTime);
  }, [greenTime, setGlobalGreenTime, workoutId]);

  // Toggle picker visibility
  const togglePicker = () => {
    const newIsVisible = !isGreenPickerVisible;
    setIsGreenPickerVisible(newIsVisible);
    const toValue = newIsVisible ? 220 : 0;
    Animated.timing(greenPickerHeight, {
      toValue,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  // Picker value change handler - update local state and call onSave
  const handleGreenTimeChange = (itemValue: string) => {
    setGreenTime(itemValue);
  };

  const handleStart = async () => {
    // Save the current greenTime settings before starting
    try {
      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...currentSettings,
          greenTime: greenTime
        });
      } else {
        await AsyncStorage.setItem('greenTime', greenTime);
      }
    } catch (e) {
      console.error("Failed to save green time before start:", e);
    }
    // Update global state when Start Workout is pressed
    setGlobalGreenTime(greenTime);
    // Then start the timer
    startTimerWithCurrentSettings(true); // Assuming custom workout for cards
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

      {/* Top Check Button (Only in Add Mode OR Edit Mode) */}
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
                                    greenTime: greenTime
                                }
                            };
                            
                            await saveWorkoutSettings({
                                ...current,
                                customBlocks: [updatedBlock, ...otherBlocks]
                            });
                        }
                        navigation.pop(2);
                    } else {
                        const newBlock = {
                            id: Date.now().toString() + Math.random().toString(),
                            type: 'time' as const,
                            settings: {
                                greenTime: greenTime,
                                restTime: '15'
                            }
                        };
                        await saveWorkoutSettings({
                            ...current,
                            customBlocks: [newBlock, ...(current.customBlocks || [])]
                        });
                        navigation.pop(2);
                    }
                }
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.time.primary, // Use card icon color
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Loop Time Card */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: 24,
              borderBottomLeftRadius: isGreenPickerVisible ? 0 : 24,
              borderBottomRightRadius: isGreenPickerVisible ? 0 : 24
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
            <TimeIcon width={32} height={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Workout Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{greenTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Green Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: greenPickerHeight, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 0, marginTop: -1, marginBottom: isGreenPickerVisible ? 12 : 0 }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <Picker
            selectedValue={greenTime}
            onValueChange={(itemValue: string) => handleGreenTimeChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 170 }}
          >
            {Array.from({ length: 99 }, (_, i) => String(i + 1)).map(val => (
              <Picker.Item key={val} label={`${val} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Start Workout Butonu */}
        {!isAddMode && (
        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.time.primary, height: 50 }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}