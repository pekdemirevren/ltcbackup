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
import { getStyles } from './TimeSettingsScreen.styles';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function TimeSettingsScreen({ route, navigation }) {
  const { workoutId, workoutName, onSave, settings } = route.params || {};
  // Global tema context'ini kullan
  const { colors } = useContext(ThemeContext);
  const { startTimerWithCurrentSettings, setGreenTime: setGlobalGreenTime, setRestTime: setGlobalRestTime } = useContext(TimerContext);
  
  const [greenTime, setGreenTime] = useState(settings?.greenTime?.toString() || '30'); // saniye cinsinden
  const [redTime, setRedTime] = useState(settings?.restTime?.toString() || '15'); // saniye cinsinden
  
  const [isGreenPickerVisible, setIsGreenPickerVisible] = useState(false);
  const [isRedPickerVisible, setIsRedPickerVisible] = useState(false);
  const greenPickerHeight = useRef(new Animated.Value(0)).current;
  const redPickerHeight = useRef(new Animated.Value(0)).current;
  
  const styles = useMemo(() => getStyles(colors, isGreenPickerVisible || isRedPickerVisible), [colors, isGreenPickerVisible, isRedPickerVisible]);

  // useEffect'leri kaldır - sadece Start Workout'ta global state güncelle

  // Picker'ları açıp kapatan fonksiyon
  const togglePicker = (pickerName) => {
    if (pickerName === 'greenTime') {
      const newIsVisible = !isGreenPickerVisible;
      setIsGreenPickerVisible(newIsVisible);
      const toValue = newIsVisible ? 300 : 0;
      Animated.timing(greenPickerHeight, {
        toValue,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    } else if (pickerName === 'redTime') {
      const newIsVisible = !isRedPickerVisible;
      setIsRedPickerVisible(newIsVisible);
      const toValue = newIsVisible ? 300 : 0;
      Animated.timing(redPickerHeight, {
        toValue,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };

  // Picker value change handlers - sadece local state'i güncelle
  const handleGreenTimeChange = (itemValue) => {
    setGreenTime(itemValue);
  };

  const handleRedTimeChange = (itemValue) => {
    setRedTime(itemValue);
  };

  const handleStart = () => {
    // Start Workout'a basınca global state'i güncelle
    setGlobalGreenTime(greenTime);
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
        <Text style={styles.headerTitle}>Time Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Loop Time Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => togglePicker('greenTime')}
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

        {/* Red Loop Time Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => togglePicker('redTime')}
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
      </ScrollView>

      {/* Start Workout Butonu */}
      <TouchableOpacity onPress={handleStart} style={[styles.startButton, { backgroundColor: colors.time.primary }]} activeOpacity={0.9}>
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
  );
}