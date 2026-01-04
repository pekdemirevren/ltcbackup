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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import { TimerContext } from './TimerContext';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function GreenTimeSettingsScreen({ route, navigation }) {
  const { workoutId, workoutName, onSave, settings } = route.params || {};
  // Global tema context'ini kullan
  const { colors } = useContext(ThemeContext);
  const { startTimerWithCurrentSettings, setGreenTime: setGlobalGreenTime } = useContext(TimerContext);

  const [greenTime, setGreenTime] = useState(settings?.greenTime?.toString() || '30'); // saniye cinsinden

  const [isGreenPickerVisible, setIsGreenPickerVisible] = useState(false);
  const greenPickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(colors, isGreenPickerVisible), [colors, isGreenPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTime = await AsyncStorage.getItem('greenTime');
        if (storedTime) {
          setGreenTime(storedTime);
        }
      } catch (e) {
        console.error("Failed to load green time:", e);
      }
    };
    loadSettings();
  }, []);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('greenTime', greenTime);
      } catch (e) {
        console.error("Failed to save green time:", e);
      }
    };
    saveSettings();
  }, [greenTime]);

  // Picker'ı açıp kapatan fonksiyon
  const togglePicker = () => {
    const newIsVisible = !isGreenPickerVisible;
    setIsGreenPickerVisible(newIsVisible);
    const toValue = newIsVisible ? 300 : 0;
    Animated.timing(greenPickerHeight, {
      toValue,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  // Picker value change handler - local state'i güncelle ve onSave çağır
  const handleGreenTimeChange = (itemValue) => {
    setGreenTime(itemValue);
    // Değer değiştiğinde SettingsScreen'e geri bildir
    if (onSave) {
      onSave({
        ...settings,
        greenTime: itemValue
      });
    }
  };

  const handleStart = () => {
    // Start Workout'a basınca global state'i güncelle
    setGlobalGreenTime(greenTime);
    // Sonra timer'ı başlat
    startTimerWithCurrentSettings(navigation, true);
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
        <Text style={styles.headerTitle}>Workout Time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Loop Time Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Workout Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{greenTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Green Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: greenPickerHeight }]}>
          <Picker
            selectedValue={greenTime}
            onValueChange={handleGreenTimeChange}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={greenTime}
          >
            {Array.from({ length: 99 }, (_, i) => String(i + 1)).map(val => (
              <Picker.Item key={val} label={`${val} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Start Workout Butonu */}
        <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.time.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
