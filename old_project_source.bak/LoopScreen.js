import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Theme } from './Theme';
import { getStyles } from './LoopScreen.styles';
import { ThemeContext } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function LoopScreen({ route, navigation, onSave }) {
  const { workoutId, workoutName } = route.params || {};
  const { colors } = useContext(ThemeContext);
  const styles = getStyles(colors);

  const [selectedMode, setSelectedMode] = useState('infinite');
  const [infiniteTime, setInfiniteTime] = useState('15');
  const [infiniteSpeed, setInfiniteSpeed] = useState(1.0);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (!workoutId) return;
      try {
        const jsonValue = await AsyncStorage.getItem(`workout_${workoutId}_settings`);
        if (jsonValue != null) {
          const loadedSettings = JSON.parse(jsonValue);
          setInfiniteTime(loadedSettings.infiniteLoopTime || '15');
          setInfiniteSpeed(loadedSettings.infiniteSpeed || 1.0);
        }
      } catch (e) {
        console.error("Failed to load settings for workoutId:", workoutId, e);
      }
    };
    loadSettings();
  }, [workoutId]);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      if (!workoutId) return;
      try {
        const jsonValue = JSON.stringify({ 
          infiniteLoopTime: infiniteTime,
          infiniteSpeed: infiniteSpeed 
        });
        await AsyncStorage.setItem(`workout_${workoutId}_settings`, jsonValue);
      } catch (e) {
        console.error("Failed to save settings for workoutId:", workoutId, e);
      }
    };
    saveSettings();
  }, [workoutId, infiniteTime, infiniteSpeed]);

  const handleInfiniteStart = () => {
    // Bu kısım workout'a göre değişebilir, şimdilik basit bir navigation
    navigation.goBack();
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
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.navigate('LoopTime', { workoutId, workoutName, onSave })}
          activeOpacity={0.8}
        >
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
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.navigate('LoopSpeed', { workoutId, workoutName, onSave })}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 32, height: 32, color: colors.speed.primary })
            ) : null}
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