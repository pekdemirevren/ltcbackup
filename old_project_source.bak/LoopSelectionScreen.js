import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { getStyles } from './LoopSelectionScreen.styles';
import { ThemeContext } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function LoopSelectionScreen({ route, navigation }) {
  const { workoutId, workoutName, onSave } = route.params || {};
  const { colors } = useContext(ThemeContext);
  const styles = getStyles(colors);

  const [infiniteLoopTime, setInfiniteLoopTime] = useState('15');
  const [infiniteSpeed, setInfiniteSpeed] = useState(1000);

  useEffect(() => {
    const loadSettings = async () => {
      if (!workoutId) return;
      try {
        const storedTime = await AsyncStorage.getItem('infiniteLoopTime');
        const storedSpeed = await AsyncStorage.getItem('infiniteSpeed');
        const timeValue = storedTime || '15';
        const speedValue = parseInt(storedSpeed) || 1000;
        setInfiniteLoopTime(timeValue);
        setInfiniteSpeed(speedValue);
        
        // İlk yükleme sırasında App.js'e değerleri bildir
        if (onSave) {
          onSave({
            infiniteLoopTime: timeValue,
            infiniteLoopSpeed: speedValue.toString()
          });
        }
      } catch (e) {
        console.error("Failed to load settings for workoutId:", workoutId, e);
      }
    };
    loadSettings();
  }, [workoutId, onSave]);

  // Callback fonksiyonları - alt ekranlardan gelen değişiklikleri yakala ve Settings'e ilet
  const handleTimeChange = (settings) => {
    if (settings.infiniteLoopTime) {
      setInfiniteLoopTime(settings.infiniteLoopTime);
      if (onSave) onSave(settings);
    }
  };

  const handleSpeedChange = (settings) => {
    if (settings.infiniteLoopSpeed) {
      setInfiniteSpeed(settings.infiniteLoopSpeed);
      if (onSave) onSave(settings);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Loop Type</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Infinite Loop Time Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: '#192A00' }]} onPress={() => navigation.navigate('LoopTime', { workoutId, workoutName, onSave: handleTimeChange })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.infinity.lib name={Theme.Icons.infinity.name} size={32} color={colors.quickStart.primary} />
          </View>
          <Text style={styles.cardTitle}>Infinite Loop Time</Text>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.quickStart.primary }]} onPress={() => navigation.goBack()}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Infinite Loop Speed Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: '#011E29' }]} onPress={() => navigation.navigate('LoopSpeed', { workoutId, workoutName, onSave: handleSpeedChange })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 32, height: 32, color: colors.speed.primary })
            ) : null}
          </View>
          <Text style={styles.cardTitle}>Infinite Loop Speed</Text>
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: colors.speed.primary }]} onPress={() => navigation.goBack()}>
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}