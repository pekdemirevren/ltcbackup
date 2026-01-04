import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, UIManager, Platform, StatusBar } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function GreenSpeedSettingsScreen({ route, navigation }) {
  const { settings, workoutId, onSave } = route.params || {};
  const { colors } = useContext(ThemeContext);

  const [greenSpeed, setGreenSpeed] = useState(settings?.greenSpeed || 1.0);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const pickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(colors, isPickerVisible), [colors, isPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSpeed = await AsyncStorage.getItem('greenSpeed');
        setGreenSpeed(storedSpeed ? parseFloat(storedSpeed) : 1.0);
      } catch (e) {
        console.error("Failed to load green speed:", e);
      }
    };
    loadSettings();
  }, []);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('greenSpeed', greenSpeed.toString());
      } catch (e) {
        console.error("Failed to save green speed:", e);
      }
    };
    saveSettings();
  }, [greenSpeed]);

  useEffect(() => {
    if (onSave) {
      onSave({ ...settings, greenSpeed });
    }
  }, [greenSpeed, onSave, settings]);

  const handleSpeedPickerValueChange = (newSpeed) => {
    setGreenSpeed(newSpeed);
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

  const speedOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 0.5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Speed</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            {/* Use custom SpeedIcon SVG */}
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 32, height: 32, color: colors.speed.primary })
            ) : null}
          </View>
          <Text style={styles.cardTitle}>Workout Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{Number(greenSpeed).toFixed(1)}s</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight }]}>
          <Picker
            selectedValue={greenSpeed}
            onValueChange={(itemValue) => handleSpeedPickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={greenSpeed}
          >
            {speedOptions.map(val => (
              <Picker.Item key={val} label={`${val.toFixed(1)} s`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.startButton, { backgroundColor: colors.speed.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}
