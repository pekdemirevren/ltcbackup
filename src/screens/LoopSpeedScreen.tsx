import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, UIManager, Platform, Easing, StatusBar, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import SpeedIcon from '../assets/icons/speed';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LoopSpeedScreenProps = StackScreenProps<RootStackParamList, 'LoopSpeed'>;

export function LoopSpeedScreen({ route, navigation }: LoopSpeedScreenProps) {
  const { workoutId, workoutName, infiniteTime, isAddMode, blockId } = route.params || {};
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  if (!themeContext) {
    throw new Error('LoopSpeedScreen must be used within a ThemeProvider');
  }

  if (!timerContext) {
    throw new Error('LoopSpeedScreen must be used within a TimerProvider');
  }

  const { colors } = themeContext;
  const { startInfiniteLoopWithSpeed, infiniteSpeed: contextInfiniteSpeed, infiniteLoopTime: contextInfiniteTime, setInfiniteSpeed } = timerContext;

  const [infiniteSpeed, setLocalInfiniteSpeed] = useState((contextInfiniteSpeed / 1000).toString()); // seconds as string
  const [localInfiniteTime, setLocalInfiniteTime] = useState(contextInfiniteTime || '30'); // time from context, with fallback
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const pickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(isPickerVisible), [isPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (blockId && workoutId) {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const loadedSettings = await loadWorkoutSettings(workoutId);
             const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
             if (block && block.settings.infiniteSpeed) {
                 setLocalInfiniteSpeed((block.settings.infiniteSpeed / 1000).toString());
             }
             return;
        }
        if (workoutId) {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const loadedSettings = await loadWorkoutSettings(workoutId);
          // infiniteSpeed is number (ms), we need seconds string
          const speedSec = loadedSettings.infiniteSpeed ? loadedSettings.infiniteSpeed / 1000 : 1.0;
          setLocalInfiniteSpeed(speedSec.toString());
        } else {
          const storedSpeed = await AsyncStorage.getItem('infiniteLoopSpeed');
          if (storedSpeed) {
            setInfiniteSpeed(parseFloat(storedSpeed) * 1000);
          }
        }
      } catch (e) {
        console.error("Failed to load infinite loop speed:", e);
      }
    };
    loadSettings();
  }, [workoutId, blockId]);

  const handlePickerValueChange = async (newSpeed: string) => {
    setLocalInfiniteSpeed(newSpeed);
    if (blockId) return; // Don't auto-save if editing a block
    try {
      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...currentSettings,
          infiniteSpeed: parseFloat(newSpeed) * 1000
        });
      } else {
        await AsyncStorage.setItem('infiniteLoopSpeed', newSpeed);
      }
    } catch (e) {
      console.error("Failed to save infinite loop speed:", e);
    }
    // Update context
    setInfiniteSpeed(parseFloat(newSpeed) * 1000);
  };

  const handleStart = async () => {
    const speedValue = parseFloat(infiniteSpeed);
    // Update context before start
    setInfiniteSpeed(speedValue * 1000);
    try {
      let timeToUse = localInfiniteTime;

      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);

        // Ensure current speed is saved
        await saveWorkoutSettings({
          ...currentSettings,
          infiniteSpeed: speedValue * 1000
        });

        // Use saved time or fallback
        timeToUse = currentSettings.infiniteLoopTime || contextInfiniteTime || '30';
      } else {
        // Always get the latest time from storage before starting for global
        const latestTime = await AsyncStorage.getItem('infiniteLoopTime');
        timeToUse = latestTime || localInfiniteTime;
      }

      startInfiniteLoopWithSpeed(
        { time: timeToUse, speed: speedValue },
        { workoutId, workoutName }
      );
    } catch (e) {
      console.error("Failed to read infinite loop time before start:", e);
      // Fallback to start with possibly stale time if storage fails
      startInfiniteLoopWithSpeed(
        { time: localInfiniteTime, speed: parseFloat(infiniteSpeed) },
        { workoutId, workoutName }
      );
    }
  };

  const speedOptions: string[] = [];
  for (let i = 0.5; i <= 5; i += 0.5) {
    speedOptions.push(i.toFixed(1)); // Ensure consistent formatting
  }

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
                                    infiniteSpeed: parseFloat(infiniteSpeed) * 1000
                                }
                            };
                            
                            await saveWorkoutSettings({
                                ...current,
                                customBlocks: [updatedBlock, ...otherBlocks]
                            });
                        }
                        navigation.navigate('GenericWorkoutSettingsScreen', { workoutId, workoutName: workoutName || '' });
                    } else {
                        const newBlock = {
                            id: Date.now().toString() + Math.random().toString(),
                            type: 'loop' as const,
                            settings: {
                                infiniteLoopTime: '15', // Default time
                                infiniteSpeed: parseFloat(infiniteSpeed) * 1000,
                            },
                            title: `Loop Speed ${infiniteSpeed}s`
                        };
                        
                        const updatedBlocks = [newBlock, ...(current.customBlocks || [])];
                        await saveWorkoutSettings({
                            ...current,
                            customBlocks: updatedBlocks
                        });
                        
                        navigation.navigate('GenericWorkoutSettingsScreen', { workoutId, workoutName: workoutName || '' });
                    }
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Loop Speed</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Infinite Loop Speed Ayar Kartı */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: 42,
              borderBottomLeftRadius: isPickerVisible ? 0 : 42,
              borderBottomRightRadius: isPickerVisible ? 0 : 42
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
          <Text style={styles.cardTitle}>Loop Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{`${parseFloat(infiniteSpeed).toFixed(1)}sec`}</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 0, marginTop: -1, marginBottom: isPickerVisible ? 12 : 0 }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <Picker
            selectedValue={infiniteSpeed}
            onValueChange={(itemValue: string) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 170 }}
          >
            {speedOptions.map(val => (
              <Picker.Item key={val} label={`${val} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Start Workout Butonu */}
        {!isAddMode && (
          <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.speed.primary }]} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}