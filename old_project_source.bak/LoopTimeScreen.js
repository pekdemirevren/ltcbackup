import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, UIManager, Platform, Easing, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import { TimerContext } from './TimerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function LoopTimeScreen({ route, navigation }) {
  const { workoutId, workoutName, onSave } = route.params || {};
  const context = useContext(ThemeContext);
  const { startInfiniteLoopWithSpeed } = useContext(TimerContext);

  // context veya colors tanımsızsa, render etmeyi durdur.
  if (!context || !context.colors) {
    return null; // veya bir yükleme göstergesi
  }
  const { colors } = context;
  const [infiniteTime, setInfiniteTime] = useState('30');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
    const pickerHeight = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => getCardButtonPickerStyles(colors, isPickerVisible), [colors, isPickerVisible]);

  // AsyncStorage'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTime = await AsyncStorage.getItem('infiniteLoopTime');
        if (storedTime) {
          setInfiniteTime(storedTime);
        }
      } catch (e) {
        console.error("Failed to load infinite loop time:", e);
      }
    };
    loadSettings();
  }, []);

  // Ayarlar değiştiğinde AsyncStorage'e kaydet
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('infiniteLoopTime', infiniteTime);
      } catch (e) {
        console.error("Failed to save infinite loop time:", e);
      }
    };
    saveSettings();
  }, [infiniteTime]);

  // Picker'daki her değişiklikte state'i güncelle
  const handlePickerValueChange = (newTime) => {
    setInfiniteTime(newTime);
    // Değer değiştiğinde LoopScreen'e geri bildir
    if (onSave) {
      onSave({
        infiniteLoopTime: newTime
      });
    }
  };

  const handleStart = () => {
    startInfiniteLoopWithSpeed({ time: infiniteTime, speed: 1.0 }, navigation);
  };

  const timeOptions = Array.from({ length: 99 }, (_, i) => String(i + 1));
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
        <Text style={styles.headerTitle}>Set Loop Time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Infinite Loop Time Ayar Kartı */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={togglePicker}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
             <Theme.Icons.infinity.lib name={Theme.Icons.infinity.name} size={32} color={colors.quickStart.primary} />
          </View>
          <Text style={styles.cardTitle}>Loop Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground }]}>
            <Text style={styles.valueText}>{infiniteTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: pickerHeight }]}>
          <Picker
            selectedValue={infiniteTime}
            onValueChange={(itemValue) => handlePickerValueChange(itemValue)}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
            key={infiniteTime}
          >
            {timeOptions.map(val => (
              <Picker.Item key={val} label={`${val} sec`} value={val} />
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