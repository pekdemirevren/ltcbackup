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

export function RedTimeSettingsScreen({ route, navigation }) {
  const { workoutId, workoutName, onSave, settings } = route.params || {};
  // Global tema context'ini kullan
  const { colors } = useContext(ThemeContext);
  const { startTimerWithCurrentSettings, setRestTime: setGlobalRestTime } = useContext(TimerContext);

  const [redTime, setRedTime] = useState(settings?.redTime?.toString() || '15'); // saniye cinsinden

  const [isRedPickerVisible, setIsRedPickerVisible] = useState(false);
  const redPickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getCardButtonPickerStyles(colors, isRedPickerVisible), [colors, isRedPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTime = await AsyncStorage.getItem('redTime');
        if (storedTime) {
          setRedTime(storedTime);
        }
      } catch (e) {
        console.error("Failed to load red time:", e);
      }
    };
    loadSettings();
  }, []);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('redTime', redTime);
      } catch (e) {
        console.error("Failed to save red time:", e);
      }
    };
    saveSettings();
  }, [redTime]);

  // Picker'ı açıp kapatan fonksiyon
  const togglePicker = () => {
    const newIsVisible = !isRedPickerVisible;
    setIsRedPickerVisible(newIsVisible);
    const toValue = newIsVisible ? 300 : 0;
    Animated.timing(redPickerHeight, {
      toValue,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  // Picker value change handler - local state'i güncelle ve onSave çağır
  const handleRedTimeChange = (itemValue) => {
    setRedTime(itemValue);
    // Değer değiştiğinde SettingsScreen'e geri bildir
    if (onSave) {
      onSave({
        ...settings,
        redTime: itemValue
      });
    }
  };

  const handleStart = () => {
    // Start Workout'a basınca global state'i güncelle
    setGlobalRestTime(redTime);
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
        <Text style={styles.headerTitle}>Break Time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Red Loop Time Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Break Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{redTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Red Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: redPickerHeight }]}>
          <Picker
            selectedValue={redTime}
            onValueChange={handleRedTimeChange}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={redTime}
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
