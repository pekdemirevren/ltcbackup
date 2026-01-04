import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from '@react-native-community/blur';

import Theme from '../constants/theme';
import { getStyles } from '../styles/LoopScreen.styles';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import SpeedIcon from '../assets/icons/SpeedIcon';

type LoopScreenProps = StackScreenProps<RootStackParamList, 'LoopScreen'>;

export function LoopScreen({ route, navigation }: LoopScreenProps) {
  const { workoutId, workoutName } = route.params || {};
  const { colors } = useContext(ThemeContext) as { colors: any };
  const timerContext = useContext(TimerContext);

  if (!timerContext) {
    throw new Error('LoopScreen must be used within a TimerProvider');
  }

  const { startInfiniteLoopWithSpeed, setInfiniteLoopTime: setGlobalInfiniteLoopTime, setInfiniteSpeed: setGlobalInfiniteSpeed, infiniteSpeed: contextInfiniteSpeed, infiniteLoopTime: contextInfiniteTime } = timerContext;
  const styles = getStyles(colors) as any;

  const [selectedMode, setSelectedMode] = useState('infinite');
  const [infiniteTime, setInfiniteTime] = useState('15');
  const [infiniteSpeed, setInfiniteSpeed] = useState(1.0);

  // useFocusEffect ile ekran her odaklandığında ayarları yükle
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          if (workoutId) {
            const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
            const loadedSettings = await loadWorkoutSettings(workoutId);
            
            setInfiniteTime(loadedSettings.infiniteLoopTime || '15');
            // Settings store speed in ms, convert to seconds for UI/State
            const speedSec = loadedSettings.infiniteSpeed ? loadedSettings.infiniteSpeed / 1000 : 1.0;
            setInfiniteSpeed(speedSec);
          } else {
            // Global settings (Quick Start)
            const savedTime = await AsyncStorage.getItem('infiniteLoopTime');
            const savedSpeed = await AsyncStorage.getItem('infiniteLoopSpeed');
            
            if (savedTime) setInfiniteTime(savedTime);
            if (savedSpeed) setInfiniteSpeed(parseFloat(savedSpeed)); // Saved as seconds string usually? Let's check LoopSpeedScreen
          }
        } catch (e) {
          console.error("Failed to load settings:", e);
        }
      };
      loadSettings();
    }, [workoutId])
  );

  // Ayarlar değiştiğinde kaydet (useEffect yerine manuel kaydetme tercih edilebilir ama tutarlılık için bırakıyoruz)
  useEffect(() => {
    const saveSettings = async () => {
      if (!workoutId) return;
      try {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        
        await saveWorkoutSettings({
          ...currentSettings,
          infiniteLoopTime: infiniteTime,
          infiniteSpeed: infiniteSpeed * 1000 // Convert seconds to ms for storage
        });
      } catch (e) {
        console.error("Failed to save settings for workoutId:", workoutId, e);
      }
    };
    // Sadece değerler değiştiğinde kaydet
    saveSettings();
  }, [workoutId, infiniteTime, infiniteSpeed]);

  const handleInfiniteStart = async () => {
    // Update context first
    setGlobalInfiniteLoopTime(infiniteTime);
    setGlobalInfiniteSpeed(infiniteSpeed * 1000);

    try {
      let timeToUse = infiniteTime;
      let speedToUse = infiniteSpeed;

      if (workoutId) {
        const { loadWorkoutSettings, saveWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
        const currentSettings = await loadWorkoutSettings(workoutId);
        
        // Ensure current settings are saved/updated
        await saveWorkoutSettings({
          ...currentSettings,
          infiniteLoopTime: infiniteTime,
          infiniteSpeed: infiniteSpeed * 1000
        });

        // Use saved values to be sure, or fallback to state
        if (currentSettings.infiniteLoopTime) timeToUse = currentSettings.infiniteLoopTime;
        if (currentSettings.infiniteSpeed) speedToUse = currentSettings.infiniteSpeed / 1000;
      } else {
        // Fallback logic for no workoutId (Global settings)
        await AsyncStorage.setItem('infiniteLoopTime', infiniteTime);
        await AsyncStorage.setItem('infiniteLoopSpeed', String(infiniteSpeed));
        
        timeToUse = infiniteTime;
        speedToUse = infiniteSpeed;
      }

      // LoopTimeScreen referans alınarak startInfiniteLoopWithSpeed kullanılıyor
      startInfiniteLoopWithSpeed(
        { time: timeToUse, speed: speedToUse },
        { workoutId, workoutName }
      );
    } catch (e) {
      console.error("Failed to start infinite loop:", e);
      // Fallback
      startInfiniteLoopWithSpeed(
        { time: infiniteTime, speed: infiniteSpeed },
        { workoutId, workoutName }
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Infinite Loop</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Zaman Ayar Kartı */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: 'transparent', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}
          onPress={() => navigation.navigate('LoopTime', { workoutId, workoutName })}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <Theme.Icons.infinity.lib name={Theme.Icons.infinity.name} size={32} color={colors.quickStart.primary} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Loop Time</Text>
            <Text style={[styles.cardSubtitle, { color: colors.quickStart.primary }]}>{`${infiniteTime}sec`}</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={handleInfiniteStart}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Infinite Speed Kartı */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: 'transparent', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}
          onPress={() => navigation.navigate('LoopSpeed', { workoutId, workoutName })}
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
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Loop Speed</Text>
            <Text style={[styles.cardSubtitle, { color: colors.speed.primary }]}>{`${Number(infiniteSpeed).toFixed(1)}sec`}</Text>
          </View>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.speed.primary }]} onPress={handleInfiniteStart}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}