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
import { getStyles } from '../styles/MoveGoalScheduleScreen.styles';
import { MetricColors } from '../constants/MetricColors';

type Props = StackScreenProps<RootStackParamList, 'MoveGoalSchedule'>;

export default function MoveGoalScheduleScreen({ navigation }: Props) {
  const { colors, Icons } = useContext(ThemeContext)!;
  const [schedule, setSchedule] = useState([
    { day: 'Monday', weight: 100, reps: 5 },
    { day: 'Tuesday', weight: 100, reps: 5 },
    { day: 'Wednesday', weight: 100, reps: 5 },
    { day: 'Thursday', weight: 100, reps: 5 },
    { day: 'Friday', weight: 100, reps: 5 },
    { day: 'Saturday', weight: 100, reps: 5 },
    { day: 'Sunday', weight: 100, reps: 5 },
  ]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
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

  const styles = useMemo(() => getStyles(colors, expandedIndex !== null), [colors, expandedIndex]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule));
      }
    } catch (e) {
      console.error('Failed to load schedule', e);
    }
  };

  const saveSchedule = async () => {
    try {
      await AsyncStorage.setItem('moveGoalSchedule', JSON.stringify(schedule));
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  };

  const adjustWeight = (index: number, amount: number) => {
    setSchedule(prevSchedule => {
      const newSchedule = [...prevSchedule];
      newSchedule[index].weight = Math.max(5, (newSchedule[index].weight || 100) + amount);
      return newSchedule;
    });
  };

  const adjustReps = (index: number, amount: number) => {
    setSchedule(prevSchedule => {
      const newSchedule = [...prevSchedule];
      newSchedule[index].reps = Math.max(1, (newSchedule[index].reps || 5) + amount);
      return newSchedule;
    });
  };

  const togglePicker = (index: number) => {
    if (expandedIndex === index) {
      // Close current
      Animated.timing(pickerHeight, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setExpandedIndex(null));
    } else {
      // If another is open, close it first then open new one
      if (expandedIndex !== null) {
        Animated.timing(pickerHeight, {
          toValue: 0,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start(() => {
          setExpandedIndex(index);
          Animated.timing(pickerHeight, {
            toValue: 200,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: false,
          }).start();
        });
      } else {
        setExpandedIndex(index);
        Animated.timing(pickerHeight, {
          toValue: 200,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const renderBarChart = () => {
    const calculated1RMs = schedule.map(s => Math.round((s.weight || 0) * (1 + (s.reps || 0) / 30)));
    const max1RM = Math.max(...calculated1RMs, 1000);

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartArea}>
          <View style={[styles.guideLine, { top: 0 }]} />
          <View style={[styles.guideLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { bottom: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' }]} />

          <View style={styles.chartBars}>
            {schedule.map((item, index) => {
              const oneRM = (item.weight || 0) * (1 + (item.reps || 0) / 30);
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={[styles.bar, { height: (oneRM / max1RM) * 100 }]} />
                  <Text style={styles.barLabel}>{item.day.substring(0, 1)}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.chartAxis}>
          <Text style={styles.axisLabel}>1000</Text>
          <Text style={styles.axisLabel}>500</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
      </View>
    );
  };

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
            <Text style={styles.stickyHeaderTitle}>1RM Goal Schedule</Text>
          </Animated.View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdjustMoveGoal')}
              style={styles.iconButton}
            >
              <Feather name="calendar" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
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
            <Text style={styles.headerTitle}>1RM Goal Schedule</Text>
          </View>

          <View style={{ paddingHorizontal: 13, marginBottom: 20 }}>
            <Text style={styles.description}>
              Set a goal based on how strong you are, or how strong you'd like to be, each day.
            </Text>
          </View>

          {renderBarChart()}

          <View style={styles.listContainer}>
            {schedule.map((item, index) => (
              <View key={index} style={{ marginBottom: expandedIndex === index ? 0 : 10 }}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      borderBottomLeftRadius: expandedIndex === index ? 0 : 32,
                      borderBottomRightRadius: expandedIndex === index ? 0 : 32,
                      marginBottom: 0,
                    }
                  ]}
                  onPress={() => togglePicker(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <Text style={styles.calculatedText}>1RM: {Math.round((item.weight || 0) * (1 + (item.reps || 0) / 30))} KG</Text>
                  </View>
                  <View style={styles.valueContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={[styles.valueText, { color: expandedIndex === index ? MetricColors.weight : '#FFF' }]}>{item.weight}</Text>
                      <Text style={[styles.valueUnit, { color: expandedIndex === index ? MetricColors.weight : '#FFF', marginLeft: 1, marginRight: 6 }]}>KG</Text>
                      <Text style={[styles.valueText, { color: expandedIndex === index ? MetricColors.reps : '#FFF' }]}>{item.reps}</Text>
                      <Text style={[styles.valueUnit, { color: expandedIndex === index ? MetricColors.reps : '#FFF', marginLeft: 1 }]}>REPS</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {expandedIndex === index && (
                  <Animated.View style={[styles.expandedPickersRow, { height: pickerHeight }]}>
                    <View style={styles.pickerCol}>
                      <Text style={styles.pickerColLabel}>Weight</Text>
                      <View style={styles.recessedPickerWrapper}>
                        <Picker
                          selectedValue={item.weight}
                          onValueChange={(val) => adjustWeight(index, val - (item.weight || 100))}
                          style={styles.pickerControl}
                          itemStyle={styles.pickerItem}
                        >
                          {Array.from({ length: 100 }, (_, i) => (i + 1) * 5).map(v => (
                            <Picker.Item key={v} label={`${v}`} value={v} color={colors.text} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                    <View style={styles.pickerCol}>
                      <Text style={styles.pickerColLabel}>Reps</Text>
                      <View style={styles.recessedPickerWrapper}>
                        <Picker
                          selectedValue={item.reps}
                          onValueChange={(val) => adjustReps(index, val - (item.reps || 5))}
                          style={styles.pickerControl}
                          itemStyle={styles.pickerItem}
                        >
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(v => (
                            <Picker.Item key={v} label={`${v}`} value={v} color={colors.text} />
                          ))}
                        </Picker>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.06)', 'transparent']}
                          style={[styles.pickerGradient, { top: 0 }]}
                          pointerEvents="none"
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(255,255,255,0.06)']}
                          style={[styles.pickerGradient, { bottom: 0 }]}
                          pointerEvents="none"
                        />
                      </View>
                    </View>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>
        </Animated.ScrollView>

        <View style={styles.footer}>
          <LiquidGlassButton
            onPress={saveSchedule}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Change 1RM Goal Schedule</Text>
          </LiquidGlassButton>
        </View>
      </View>
    </View >
  );
}
