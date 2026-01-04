import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, StatusBar } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function GreenLapSettingsScreen({ route, navigation }) {
  const { workoutId: paramWorkoutId, onSave, settings } = route.params || {};
  const workoutId = paramWorkoutId || 'default';
  const { colors } = useContext(ThemeContext);
  const [greenLaps, setGreenLaps] = useState('1');
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const pickerHeight = useRef(new Animated.Value(0)).current; 

  const styles = useMemo(() => getCardButtonPickerStyles(colors, isPickerVisible), [colors, isPickerVisible]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedLaps = await AsyncStorage.getItem('greenLaps');
        setGreenLaps(storedLaps || '1');
      } catch (e) {
        console.error("Failed to load green laps:", e);
      }
    };
    loadSettings();
  }, []);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('greenLaps', greenLaps);
      } catch (e) {
        console.error("Failed to save green laps:", e);
      }
    };
    saveSettings();
  }, [greenLaps]);

  useEffect(() => {
    if (onSave) {
      onSave({
        ...(settings || {}),
        greenReps: greenLaps
      });
    }
  }, [greenLaps, onSave, settings]);

  const handlePickerValueChange = (newLaps) => {
    setGreenLaps(newLaps);
    if (onSave) {
      onSave({
        ...(settings || {}),
        greenReps: newLaps
      });
    }
  };

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

  const lapsOptions = Array.from({ length: 9 }, (_, i) => String(i + 1));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Laps</Text>
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
          <Text style={styles.cardTitle}>Workout Laps</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{greenLaps} {greenLaps === '1' ? 'time' : 'times'}</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight }]}>
          <Picker
            selectedValue={greenLaps}
            onValueChange={(itemValue) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={greenLaps}
          >
            {lapsOptions.map(val => (
              <Picker.Item key={val} label={`${val} ${val === '1' ? 'time' : 'times'}`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.startButton, { backgroundColor: colors.lap.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}
