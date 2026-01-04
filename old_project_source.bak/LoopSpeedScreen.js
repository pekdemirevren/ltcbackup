import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, UIManager, Platform, Easing, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import { TimerContext } from './TimerContext';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function LoopSpeedScreen({ route, navigation }) {
  const { workoutId, workoutName, onSave } = route.params || {};
  const { colors } = useContext(ThemeContext);
  const { startInfiniteLoopWithSpeed } = useContext(TimerContext);
  const [infiniteSpeed, setInfiniteSpeed] = useState('1'); // saniye cinsinden string
  const [infiniteTime, setInfiniteTime] = useState('30'); // LoopTimeScreen'den gelecek zaman
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const pickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(colors, isPickerVisible), [colors, isPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (!workoutId) return;
      try {
        const storedSpeed = await AsyncStorage.getItem('infiniteSpeed');
        const storedTime = await AsyncStorage.getItem('infiniteLoopTime');
        setInfiniteSpeed(storedSpeed || '1');
        setInfiniteTime(storedTime || '30');
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
        await AsyncStorage.setItem('infiniteSpeed', infiniteSpeed);
      } catch (e) {
        console.error("Failed to save settings for workoutId:", workoutId, e);
      }
    };
    saveSettings();
  }, [workoutId, infiniteSpeed]);

  const handlePickerValueChange = (newSpeed) => {
    setInfiniteSpeed(newSpeed);
    // Değer değiştiğinde LoopScreen'e geri bildir
    if (onSave) {
      onSave({
        infiniteLoopSpeed: newSpeed
      });
    }
  };

  const handleStart = () => {
    startInfiniteLoopWithSpeed({ time: infiniteTime, speed: parseFloat(infiniteSpeed) }, navigation);
  };

  const speedOptions = [];
  for (let i = 0.5; i <= 5; i += 0.5) {
    speedOptions.push(i.toString());
  }

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
        <Text style={styles.headerTitle}>Set Loop Speed</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Infinite Loop Speed Ayar Kartı */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 32, height: 32, color: colors.speed.primary })
            ) : null}
          </View>
          <Text style={styles.cardTitle}>Loop Speed</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{`${parseFloat(infiniteSpeed).toFixed(1)}sec`}</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight }]}>
          <Picker
            selectedValue={infiniteSpeed}
            onValueChange={(itemValue) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={infiniteSpeed}
          >
            {speedOptions.map(val => (
              <Picker.Item key={val} label={`${parseFloat(val).toFixed(1)} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Start Workout Butonu */}
        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.quickStart.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}