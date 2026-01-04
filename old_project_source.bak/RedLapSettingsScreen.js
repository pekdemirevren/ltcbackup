import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, StatusBar } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import { TimerContext } from './TimerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function RedLapSettingsScreen({ route, navigation }) {
  const { workoutId: paramWorkoutId, workoutName } = route.params || {};
  const workoutId = paramWorkoutId || 'default';
  const { colors } = useContext(ThemeContext);
  const { startTimerWithCurrentSettings, setRedRepsWithStorage } = useContext(TimerContext);
  const [redLaps, setRedLaps] = useState('1');
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const pickerHeight = useRef(new Animated.Value(0)).current; 

  const styles = useMemo(() => getCardButtonPickerStyles(colors, isPickerVisible), [colors, isPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedLaps = await AsyncStorage.getItem('redLaps');
        setRedLaps(storedLaps || '1');
      } catch (e) {
        console.error("Failed to load red laps:", e);
      }
    };
    loadSettings();
  }, []);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('redLaps', redLaps);
      } catch (e) {
        console.error("Failed to save red laps:", e);
      }
    };
    saveSettings();
  }, [redLaps]);

  const handlePickerValueChange = (newLaps) => {
    setRedLaps(newLaps);
  };

  const lapsOptions = Array.from({ length: 9 }, (_, i) => String(i + 1));

  const togglePicker = () => {
    const newIsVisible = !isPickerVisible;
    setIsPickerVisible(newIsVisible);
    const toValue = newIsVisible ? 300 : 0;
    Animated.timing(pickerHeight, {
      toValue,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const handleStart = () => {
    // Start Workout'a basınca global state'i güncelle
    setRedRepsWithStorage(redLaps);
    // Sonra timer'ı başlat
    startTimerWithCurrentSettings(navigation, true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Break Laps</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib name={Theme.Icons.lap.name} size={32} color={colors.lap.primary} />
          </View>
          <Text style={styles.cardTitle}>Break Laps</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{redLaps} {redLaps === '1' ? 'time' : 'times'}</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight }]}>
          <Picker
            selectedValue={redLaps}
            onValueChange={(itemValue) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={redLaps}
          >
            {lapsOptions.map(val => (
              <Picker.Item key={val} label={`${val} ${val === '1' ? 'time' : 'times'}`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Start Workout Butonu */}
        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.lap.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
