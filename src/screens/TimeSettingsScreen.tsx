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
  StyleSheet,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Picker } from '@react-native-picker/picker';
import { StackScreenProps } from '@react-navigation/stack';

import Theme from '../constants/theme';
import LoopIcon from '../assets/icons/LoopIcon';
import TimeIcon from '../assets/icons/TimeIcon';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { getStyles } from '../styles/TimeSettingsScreen.styles';
import { RootStackParamList } from '../navigation/RootNavigator';

// Android'de LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define the type for TimeSettingsScreenProps using the imported RootStackParamList
type TimeSettingsScreenProps = StackScreenProps<RootStackParamList, 'TimeSettingsScreen'>;

// Assuming RootStackParamList is defined in '../navigation/RootNavigator' as follows:
// export type RootStackParamList = {
//   CreateWorkoutEvent: { date?: string; eventId?: string; editMode?: boolean; startTime?: string; endTime?: string };
//   PlanlamaEkrani: undefined;
//   WorkoutSelectionScreen: undefined;
//   CreateWorkoutScreen: undefined;
//   TimeSettingsScreen: { workoutId?: string; workoutName?: string; onSave?: (settings: { greenTime: string; redTime: string }) => void; settings?: { greenTime: string; redTime: string } };
// };

export function TimeSettingsScreen({ route, navigation }: TimeSettingsScreenProps) {
  const { workoutId, workoutName, onSave, settings } = route.params || {};
  const { colors, Icons } = useContext(ThemeContext)!;
  const { startTimerWithCurrentSettings, setGreenTime: setGlobalGreenTime, setRedTime: setGlobalRedTime } = useContext(TimerContext)!;

  const [greenTime, setGreenTime] = useState(settings?.greenTime?.toString() || '30');
  const [redTime, setRedTime] = useState(settings?.redTime?.toString() || '15');

  const [isGreenPickerVisible, setIsGreenPickerVisible] = useState(false);
  const [isRedPickerVisible, setIsRedPickerVisible] = useState(false);
  const greenPickerHeight = useRef(new Animated.Value(0)).current;
  const redPickerHeight = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => getStyles(colors, isGreenPickerVisible || isRedPickerVisible), [colors, isGreenPickerVisible, isRedPickerVisible]);

  // Call onSave when local greenTime or redTime changes
  useEffect(() => {
    if (onSave) {
      onSave({ greenTime, redTime });
    }
  }, [greenTime, redTime, onSave]);

  // Picker'ları açıp kapatan fonksiyon
  const togglePicker = (pickerName: 'greenTime' | 'redTime') => {
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
  const handleGreenTimeChange = (itemValue: string) => {
    setGreenTime(itemValue);
  };

  const handleRedTimeChange = (itemValue: string) => {
    setRedTime(itemValue);
  };

  const handleStart = () => {
    // Start Workout'a basınca global state'i güncelle
    setGlobalGreenTime(greenTime);
    setGlobalRedTime(redTime);
    // Sonra timer'ı başlat
    startTimerWithCurrentSettings(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          {Icons.back.lib && <Icons.back.lib name={Icons.back.name} size={32} color={colors.text} />}
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Time Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Loop Time Card */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: isGreenPickerVisible ? 42 : 42,
              borderBottomLeftRadius: isGreenPickerVisible ? 0 : 42,
              borderBottomRightRadius: isGreenPickerVisible ? 0 : 42,
              marginBottom: isGreenPickerVisible ? 0 : 12,
            }
          ]}
          onPress={() => togglePicker('greenTime')}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <LoopIcon width={32} height={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Workout Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={[styles.valueText, { color: isGreenPickerVisible ? colors.time.primary : colors.text }]}>{greenTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Green Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: greenPickerHeight, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 0, marginTop: -1, marginBottom: isGreenPickerVisible ? 12 : 0, borderRadius: 42, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <Picker
            selectedValue={greenTime}
            onValueChange={handleGreenTimeChange}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
          >
            {Array.from({ length: 99 }, (_, i) => String(i + 1)).map(val => (
              <Picker.Item key={val} label={`${val} sec`} value={val} />
            ))}
          </Picker>
        </Animated.View>

        {/* Red Loop Time Card */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              paddingVertical: 16,
              borderRadius: isRedPickerVisible ? 42 : 42,
              borderBottomLeftRadius: isRedPickerVisible ? 0 : 42,
              borderBottomRightRadius: isRedPickerVisible ? 0 : 42,
              marginBottom: isRedPickerVisible ? 0 : 12,
            }
          ]}
          onPress={() => togglePicker('redTime')}
          activeOpacity={0.8}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <View style={styles.iconContainer}>
            <TimeIcon width={32} height={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Break Time</Text>
          <View style={[styles.valueContainer, { backgroundColor: colors.valueBackground, borderRadius: 12 }]}>
            <Text style={[styles.valueText, { color: isRedPickerVisible ? colors.time.primary : colors.text }]}>{redTime}sec</Text>
          </View>
        </TouchableOpacity>

        {/* Açılır/Kapanır Red Picker Alanı */}
        <Animated.View style={[styles.pickerWrapper, { height: redPickerHeight, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 0, marginTop: -1, marginBottom: isRedPickerVisible ? 12 : 0, borderRadius: 42, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="thinMaterialDark"
            blurAmount={20}
            reducedTransparencyFallbackColor="black"
          />
          <Picker
            selectedValue={redTime}
            onValueChange={handleRedTimeChange}
            itemStyle={styles.pickerItem}
            style={{ height: 200 }}
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
