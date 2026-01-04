import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, UIManager, Platform, Easing, StatusBar, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from '../styles/CardButtonPickerStyle';
import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LoopTimeScreenProps = StackScreenProps<RootStackParamList, 'LoopTime'> & {
  route: {
    params: {
      isAddMode?: boolean;
    }
  }
};

export function LoopTimeScreen({ route, navigation }: LoopTimeScreenProps) {
  const { workoutId, workoutName, isAddMode, blockId } = route.params || {};
  const themeContext = useContext(ThemeContext);
  const timerContext = useContext(TimerContext);

  // context veya colors tanımsızsa, render etmeyi durdur.
  if (!themeContext || !themeContext.colors || !timerContext) {
    return null; // veya bir yükleme göstergesi
  }
  const { colors } = themeContext;
  const { startInfiniteLoopWithSpeed, infiniteSpeed, setInfiniteLoopTime } = timerContext;

  const [infiniteTime, setInfiniteTime] = useState('30');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const pickerHeight = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => getCardButtonPickerStyles(isPickerVisible), [isPickerVisible]); // Updated to use the new signature

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (blockId && workoutId) {
             const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
             const loadedSettings = await loadWorkoutSettings(workoutId);
             const block = loadedSettings.customBlocks?.find((b: any) => b.id === blockId);
             if (block && block.settings.infiniteLoopTime) {
                 setInfiniteTime(block.settings.infiniteLoopTime);
             }
             return;
        }
        if (workoutId) {
          const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
          const loadedSettings = await loadWorkoutSettings(workoutId);
          setInfiniteTime(loadedSettings.infiniteLoopTime || '30');
        } else {
          const storedTime = await AsyncStorage.getItem('infiniteLoopTime');
          if (storedTime) {
            setInfiniteTime(storedTime);
          }
        }
      } catch (e) {
        console.error("Failed to load infinite loop time:", e);
      }
    };
    loadSettings();
  }, [workoutId, blockId]);


  // Picker'daki her değişiklikte state'i güncelle ve AsyncStorage'e kaydet
  const handlePickerValueChange = async (newTime: string) => {
    setInfiniteTime(newTime);
    if (blockId) return; // Don't auto-save if editing a block
    try {
      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        await saveWorkoutSettings({
          ...currentSettings,
          infiniteLoopTime: newTime
        });
      } else {
        await AsyncStorage.setItem('infiniteLoopTime', newTime);
      }
    } catch (e) {
      console.error("Failed to save infinite loop time:", e);
    }
    // Update context
    setInfiniteLoopTime(newTime);
  };

  const handleStart = async () => {
    // Update context before start
    setInfiniteLoopTime(infiniteTime);

    try {
      let speedInSeconds = 1.0;

      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);

        // Ensure current time is saved
        await saveWorkoutSettings({
          ...currentSettings,
          infiniteLoopTime: infiniteTime
        });

        // Use saved speed or context default
        const savedSpeed = currentSettings.infiniteSpeed;
        speedInSeconds = savedSpeed ? savedSpeed / 1000 : (infiniteSpeed ? infiniteSpeed / 1000 : 1.0);
      } else {
        // Fallback logic
        await AsyncStorage.setItem('infiniteLoopTime', infiniteTime);
        const storedSpeed = await AsyncStorage.getItem('infiniteLoopSpeed');
        speedInSeconds = storedSpeed
          ? parseFloat(storedSpeed)
          : (infiniteSpeed ? infiniteSpeed / 1000 : 1.0);
      }

      startInfiniteLoopWithSpeed(
        { time: infiniteTime, speed: speedInSeconds },
        { workoutId, workoutName }
      );
    } catch (e) {
      console.error("Failed to read infinite loop settings before start:", e);
      // Depolama okuma hatası olursa context'ten gelen değerle devam et
      const speedInSeconds = infiniteSpeed ? infiniteSpeed / 1000 : 1.0;
      startInfiniteLoopWithSpeed(
        { time: infiniteTime, speed: speedInSeconds },
        { workoutId, workoutName }
      );
    }
  };

  const timeOptions = Array.from({ length: 99 }, (_, i) => String(i + 1));
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
                                    infiniteLoopTime: infiniteTime
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
                                infiniteLoopTime: infiniteTime,
                                infiniteSpeed: 1000, // Default speed
                            },
                            title: `Loop ${infiniteTime}s`
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
              backgroundColor: colors.quickStart.primary,
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
        <Text style={styles.headerTitle}>Set Loop Time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Infinite Loop Time Ayar Kartı */}
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
            <Theme.Icons.infinity.lib width={32} height={32} color={colors.quickStart.primary} />
          </View>
          <Text style={styles.cardTitle}>Loop Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={styles.valueText}>{infiniteTime}sec</Text>
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
            selectedValue={infiniteTime}
            onValueChange={(itemValue: string) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 170 }}
          >
            {timeOptions.map(val => (
              <Picker.Item key={val} label={`${val} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Start Workout Butonu */}
        {!isAddMode && (
          <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.quickStart.primary }]} activeOpacity={0.9}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}