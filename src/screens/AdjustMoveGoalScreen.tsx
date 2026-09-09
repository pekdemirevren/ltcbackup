import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import { LiquidGlassButton } from '../components/LiquidGlass';
import { ThemeContext } from '../contexts/ThemeContext';
import { getStyles } from '../styles/AdjustMoveGoalScreen.styles';
import { parseStoredBodyWeight } from '../constants/bodyWeight';

type Props = StackScreenProps<RootStackParamList, 'AdjustMoveGoal'>;

export default function AdjustMoveGoalScreen({ navigation }: Props) {
  const { colors, Icons } = useContext(ThemeContext)!;
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(5);
  const [bodyWeight, setBodyWeight] = useState(75);
  const [expandedType, setExpandedType] = useState<'weight' | 'reps' | 'bodyWeight' | null>(null);

  const pickerHeight = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const stickyTitleTranslateY = scrollY.interpolate({
    inputRange: [40, 70],
    outputRange: [10, 0],
    extrapolate: 'clamp'
  });

  const styles = useMemo(() => getStyles(colors, expandedType !== null), [colors, expandedType]);

  useEffect(() => {
    loadTodayGoal();
  }, []);

  const loadTodayGoal = async () => {
    try {
      const todayStr = new Date().toDateString();
      const storedOverride = await AsyncStorage.getItem('dailyMoveGoalOverride');

      if (storedOverride) {
        const override = JSON.parse(storedOverride);
        if (override.date === todayStr) {
          setWeight(override.weight || 100);
          setReps(override.reps || 5);
          setBodyWeight(parseStoredBodyWeight(override.bodyWeight));
          return;
        }
      }

      const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
      if (storedSchedule) {
        const schedule = JSON.parse(storedSchedule);
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const dayItem = schedule.find((s: any) => s.day === dayName);
        if (dayItem) {
          setWeight(dayItem.weight || 100);
          setReps(dayItem.reps || 5);
          setBodyWeight(parseStoredBodyWeight(dayItem.bodyWeight));
        }
      }
    } catch (e) {
      console.error('Failed to load today goal', e);
    }
  };

  const saveTodayGoal = async () => {
    try {
      const todayStr = new Date().toDateString();
      const override = { date: todayStr, weight, reps, bodyWeight };
      await AsyncStorage.setItem('dailyMoveGoalOverride', JSON.stringify(override));
      await AsyncStorage.setItem('userBodyWeight', String(bodyWeight));

      // Sync to all days in the schedule
      const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
      if (storedSchedule) {
        const schedule = JSON.parse(storedSchedule);
        const updatedSchedule = schedule.map((day: any) => ({
          ...day,
          weight,
          reps,
          bodyWeight,
        }));
        await AsyncStorage.setItem('moveGoalSchedule', JSON.stringify(updatedSchedule));
      } else {
        // Create new schedule with all days
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const newSchedule = days.map(day => ({ day, weight, reps, bodyWeight }));
        await AsyncStorage.setItem('moveGoalSchedule', JSON.stringify(newSchedule));
      }

      navigation.goBack();
    } catch (e) {
      console.error('Failed to save today goal', e);
    }
  };

  const togglePicker = (type: 'weight' | 'reps' | 'bodyWeight') => {
    if (expandedType === type) {
      // Close
      Animated.timing(pickerHeight, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setExpandedType(null));
    } else {
      // Open
      if (expandedType !== null) {
        // Swap
        Animated.timing(pickerHeight, {
          toValue: 0,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start(() => {
          setExpandedType(type);
          Animated.timing(pickerHeight, {
            toValue: 200,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: false,
          }).start();
        });
      } else {
        setExpandedType(type);
        Animated.timing(pickerHeight, {
          toValue: 200,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const calculated1RM = Math.round(weight * (1 + reps / 30));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <View style={{ flex: 1 }}>

        {/* Header Buttons - Absolute Top */}
        <View style={styles.absoluteHeaderRow}>
          {/* Sticky Background */}
          <Animated.View style={[styles.stickyHeaderBackground, { opacity: stickyHeaderOpacity }]} pointerEvents="none">
            <LinearGradient
              colors={[colors.cardBackground, 'transparent']}
              locations={[0.6, 1]}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
          >
            <Feather name="x" size={28} color={colors.text} />
          </TouchableOpacity>

          <Animated.View style={{ opacity: stickyHeaderOpacity, transform: [{ translateY: stickyTitleTranslateY }] }}>
            <Text style={styles.stickyHeaderTitle}>Today's 1RM Goal</Text>
          </Animated.View>

          {/* Spacer to keep title centered */}
          <View style={{ width: 48 }} />
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Today's 1RM Goal</Text>
          </View>

          <View style={{ paddingHorizontal: 13, marginBottom: 20 }}>
            <Text style={styles.description}>
              Set a 1RM goal for today to track your progress and stay motivated.
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            {/* Weight Row */}
            <View style={styles.pickerSection}>
              <TouchableOpacity
                style={[
                  styles.pickerCard,
                  {
                    borderBottomLeftRadius: expandedType === 'weight' ? 0 : 32,
                    borderBottomRightRadius: expandedType === 'weight' ? 0 : 32,
                  }
                ]}
                onPress={() => togglePicker('weight')}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerCardLabel}>Weight</Text>
                <View style={styles.valueContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={[styles.valueText, { color: expandedType === 'weight' ? colors.time.primary : colors.text }]}>{weight}</Text>
                    <Text style={[styles.valueUnit, { color: expandedType === 'weight' ? colors.time.primary : colors.text }]}>KG</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {expandedType === 'weight' && (
                <Animated.View style={[styles.expandedPickerContainer, { height: pickerHeight }]}>
                  <Text style={styles.pickerColLabel}>Weight</Text>
                  <View style={styles.recessedPickerWrapper}>
                    <Picker
                      selectedValue={weight}
                      onValueChange={(itemValue) => setWeight(itemValue)}
                      style={styles.pickerControl}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 100 }, (_, i) => (i + 1) * 5).map(val => (
                        <Picker.Item key={val} label={String(val)} value={val} color={colors.text} />
                      ))}
                    </Picker>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Reps Row */}
            <View style={styles.pickerSection}>
              <TouchableOpacity
                style={[
                  styles.pickerCard,
                  {
                    borderBottomLeftRadius: expandedType === 'reps' ? 0 : 32,
                    borderBottomRightRadius: expandedType === 'reps' ? 0 : 32,
                  }
                ]}
                onPress={() => togglePicker('reps')}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerCardLabel}>Reps</Text>
                <View style={styles.valueContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={[styles.valueText, { color: expandedType === 'reps' ? colors.time.primary : colors.text }]}>{reps}</Text>
                    <Text style={[styles.valueUnit, { color: expandedType === 'reps' ? colors.time.primary : colors.text }]}>TIMES</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {expandedType === 'reps' && (
                <Animated.View style={[styles.expandedPickerContainer, { height: pickerHeight }]}>
                  <Text style={styles.pickerColLabel}>Reps</Text>
                  <View style={styles.recessedPickerWrapper}>
                    <Picker
                      selectedValue={reps}
                      onValueChange={(itemValue) => setReps(itemValue)}
                      style={styles.pickerControl}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(val => (
                        <Picker.Item key={val} label={String(val)} value={val} color={colors.text} />
                      ))}
                    </Picker>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Body Weight Row */}
            <View style={styles.pickerSection}>
              <TouchableOpacity
                style={[
                  styles.pickerCard,
                  {
                    borderBottomLeftRadius: expandedType === 'bodyWeight' ? 0 : 32,
                    borderBottomRightRadius: expandedType === 'bodyWeight' ? 0 : 32,
                  }
                ]}
                onPress={() => togglePicker('bodyWeight')}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerCardLabel}>Body Weight</Text>
                <View style={styles.valueContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={[styles.valueText, { color: expandedType === 'bodyWeight' ? colors.time.primary : colors.text }]}>{bodyWeight}</Text>
                    <Text style={[styles.valueUnit, { color: expandedType === 'bodyWeight' ? colors.time.primary : colors.text }]}>KG</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {expandedType === 'bodyWeight' && (
                <Animated.View style={[styles.expandedPickerContainer, { height: pickerHeight }]}>
                  <Text style={styles.pickerColLabel}>Body Weight</Text>
                  <View style={styles.recessedPickerWrapper}>
                    <Picker
                      selectedValue={bodyWeight}
                      onValueChange={(itemValue) => setBodyWeight(itemValue)}
                      style={styles.pickerControl}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 150 }, (_, i) => i + 30).map(val => (
                        <Picker.Item key={val} label={String(val)} value={val} color={colors.text} />
                      ))}
                    </Picker>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>

          <View style={styles.calculated1RMContainer}>
            <Text style={styles.calculated1RMLabel}>ESTIMATED 1RM</Text>
            <Text style={styles.calculated1RMValue}>{calculated1RM} KG</Text>
          </View>
        </Animated.ScrollView>

        <View style={styles.footer}>
          <LiquidGlassButton
            onPress={saveTodayGoal}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Change 1RM Goal for Today</Text>
          </LiquidGlassButton>
        </View>
      </View>
    </View >
  );
}
