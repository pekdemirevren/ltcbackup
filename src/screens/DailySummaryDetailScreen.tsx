import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, StatusBar, Modal, TouchableWithoutFeedback, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { calculateCalories } from '../utils/CalorieCalculator';
import { allWorkouts } from '../constants/workoutData';
import MetricColors from '../constants/MetricColors';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';

type DailySummaryDetailScreenProps = StackScreenProps<RootStackParamList, 'DailySummaryDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DailySummaryDetailScreen({ navigation }: DailySummaryDetailScreenProps) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000', text: '#FFF' };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(500);
  const [calorieData, setCalorieData] = useState<number[]>(new Array(24).fill(0));
  const [weekData, setWeekData] = useState<{ day: string, date: Date, progress: number, isSelected: boolean }[]>([]);

  // New State Variables
  const [totalSets, setTotalSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [dailyWorkouts, setDailyWorkouts] = useState<any[]>([]);

  const [showGoalMenu, setShowGoalMenu] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const buttonRef = useRef<View>(null);

  // Animation value for the menu
  const menuAnimation = useRef(new Animated.Value(0)).current;

  // Mock data for things we don't track yet
  const [steps, setSteps] = useState(387);
  const [distance, setDistance] = useState(0.32);
  const [flights, setFlights] = useState(1);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  useEffect(() => {
    if (showGoalMenu) {
      setIsModalVisible(true);
      Animated.spring(menuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start();
    } else {
      Animated.spring(menuAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 300,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [showGoalMenu]);

  const loadData = async () => {
    try {
      // Günlük hedefi (override veya schedule) çek
      let currentGoal = 500;
      const todayStr = selectedDate.toDateString();
      const storedOverride = await AsyncStorage.getItem('dailyMoveGoalOverride');
      if (storedOverride) {
        const override = JSON.parse(storedOverride);
        if (override.date === todayStr) {
          currentGoal = override.goal;
        } else {
          const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
          if (storedSchedule) {
            const schedule = JSON.parse(storedSchedule);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            const dayItem = schedule.find((s: any) => s.day === dayName);
            if (dayItem) currentGoal = dayItem.goal;
          }
        }
      } else {
        const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
        if (storedSchedule) {
          const schedule = JSON.parse(storedSchedule);
          const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
          const dayItem = schedule.find((s: any) => s.day === dayName);
          if (dayItem) currentGoal = dayItem.goal;
        }
      }
      setDailyGoal(currentGoal);

      const stored = await AsyncStorage.getItem('workoutSummaries');
      if (stored) {
        const allSummaries = JSON.parse(stored);

        // 1. Calculate Selected Date's Data
        const selectedSummaries = allSummaries.filter((s: any) => {
          const d = new Date(s.date);
          return d.getDate() === selectedDate.getDate() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getFullYear() === selectedDate.getFullYear();
        });

        let totalCals = 0;
        let tSets = 0;
        let tReps = 0;
        const cData = new Array(24).fill(0);

        selectedSummaries.forEach((item: any) => {
          const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;
          const cals = calculateCalories(item.workoutId, item.elapsedTime, weightVal, item.completedReps);
          totalCals += cals;

          tSets += (item.completedSets || 0);
          tReps += (item.completedReps || 0);

          const h = new Date(item.date).getHours();
          cData[h] += cals;
        });

        setDailyCalories(Math.round(totalCals));
        setCalorieData(cData);
        setTotalSets(tSets);
        setTotalReps(tReps);
        setWorkoutCount(selectedSummaries.length);
        setDailyWorkouts(selectedSummaries);

        // 2. Calculate Week Data (Mon-Sun) based on the selected date's week
        const currentDay = selectedDate.getDay(); // 0 is Sunday
        const diff = selectedDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(selectedDate);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const wData = [];
        const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);

          const daySummaries = allSummaries.filter((s: any) => {
            const sd = new Date(s.date);
            return sd.getDate() === d.getDate() &&
              sd.getMonth() === d.getMonth() &&
              sd.getFullYear() === d.getFullYear();
          });

          let dayCals = 0;
          daySummaries.forEach((item: any) => {
            const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;
            dayCals += calculateCalories(item.workoutId, item.elapsedTime, weightVal, item.completedReps);
          });

          wData.push({
            day: weekDays[i],
            date: new Date(d),
            progress: Math.min((dayCals / currentGoal) * 100, 100),
            isSelected: d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth()
          });
        }
        setWeekData(wData);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  const formatDate = () => {
    const today = new Date();
    const isToday = selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    const dateStr = `${selectedDate.getDate()} ${selectedDate.toLocaleString('en-US', { month: 'short' })} ${selectedDate.getFullYear()}`;
    return isToday ? `${dateStr} Today` : dateStr;
  };

  const handleOpenMenu = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ top: y - 90, right: 20 });
      setShowGoalMenu(true);
    });
  };

  const handleAdjustGoal = () => {
    setShowGoalMenu(false);
    navigation.navigate('AdjustMoveGoal');
  };

  const handleChangeSchedule = () => {
    setShowGoalMenu(false);
    navigation.navigate('MoveGoalSchedule');
  };

  const renderGraph = () => {
    const maxVal = Math.max(...calorieData, 10); // Minimum scale
    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphBars}>
          {/* Horizontal Grid Lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: '33%' }]} />
          <View style={[styles.gridLine, { top: '66%' }]} />
          <View style={[styles.gridLine, { bottom: 0, backgroundColor: MetricColors.energy }]} />

          {/* Total Label inside graph area, under top grid line */}
          <Text style={styles.graphTotalLabelAbsolute}>TOTAL {dailyCalories.toLocaleString()}KCAL</Text>

          {calorieData.map((val, i) => (
            <View key={i} style={styles.barContainer}>
              {val > 0 && (
                <View style={[styles.bar, { height: (val / maxVal) * 60 }]} />
              )}
            </View>
          ))}
          {/* Current Time Indicator Line (Mocked at 06:00 for visual match or dynamic) */}
          <View style={[styles.timeLine, { left: '25%' }]} />
        </View>
        <View style={styles.graphLabels}>
          <Text style={styles.graphLabel}>00:00</Text>
          <Text style={styles.graphLabel}>06:00</Text>
          <Text style={styles.graphLabel}>12:00</Text>
          <Text style={styles.graphLabel}>18:00</Text>
        </View>
      </View>
    );
  };

  const menuScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const buttonOpacity = menuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const buttonScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const buttonTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const menuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0],
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{formatDate()}</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="share" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Weekly Row */}
        <View style={styles.weekRow}>
          {weekData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.weekDayContainer}
              onPress={() => setSelectedDate(item.date)}
            >
              <View style={[styles.dayLabelContainer, item.isSelected && styles.selectedDayLabelContainer]}>
                <Text style={[styles.weekDayText, item.isSelected && styles.selectedDayText]}>{item.day}</Text>
              </View>
              <View style={styles.smallRingContainer}>
                <AnimatedCircularProgress
                  size={40}
                  width={7}
                  fill={item.progress}
                  tintColor="#FA114F"
                  backgroundColor="#2C050F"
                  rotation={0}
                  lineCap="round"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Ring */}
        <View style={styles.mainRingContainer}>
          <View style={{ width: 250, height: 250 }}>
            <AnimatedCircularProgress
              size={250}
              width={50}
              fill={(dailyCalories / dailyGoal) * 100}
              tintColor="#FA114F"
              backgroundColor="#2C050F"
              rotation={0}
              lineCap="round"
            />
            <View style={styles.arrowContainer}>
              <View style={styles.arrowCircle}>
                <Feather name="arrow-right" size={30} color="#000" />
              </View>
            </View>
          </View>
        </View>

        {/* Move Stats */}
        <View style={[styles.moveStatsContainer, { zIndex: 10 }]}>
          <View>
            <Text style={styles.moveLabel}>Move</Text>
            <Text style={styles.moveValue}>
              <Text style={[styles.moveCurrent, styles.moveValue]}>{dailyCalories}</Text>
              <Text style={[styles.moveGoal, styles.moveValue, { color: MetricColors.energy }]}>/{dailyGoal}</Text>
              <Text style={styles.kcalUnit}>KCAL</Text>
            </Text>
          </View>

          <Animated.View style={{ opacity: buttonOpacity, transform: [{ scale: buttonScale }, { translateX: buttonTranslateX }] }}>
            <TouchableOpacity
              ref={buttonRef}
              style={styles.goalButton}
              onPress={handleOpenMenu}
              disabled={showGoalMenu}
            >
              <View style={styles.goalButtonInner}>
                <Text style={styles.goalButtonText}>- +</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Graph */}
        <View style={styles.graphSection}>
          {renderGraph()}
        </View>

        {/* Secondary Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { flex: 0, marginRight: 40 }]}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Reps</Text>
            <Text style={styles.statValue}>{totalReps}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.listItem}>
          <View>
            <Text style={styles.statLabel}>Workout Cards</Text>
            <Text style={[styles.statValue, { marginTop: 4 }]}>{workoutCount}</Text>
          </View>
        </View>

        <View style={styles.divider} />



        {/* Workouts List */}
        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          {dailyWorkouts.map((item, index) => {
            const workoutDef = allWorkouts.find(w => w.workoutId === item.workoutId);
            const WorkoutIcon = workoutDef?.SvgIcon;
            const iconColor = '#9DEC2C';

            return (
              <View key={index} style={styles.workoutCard}>
                <View style={styles.workoutIconContainer}>
                  {WorkoutIcon ? (
                    <WorkoutIcon width={26} height={26} fill={iconColor} />
                  ) : (
                    <MaterialCommunityIcons name="dumbbell" size={26} color={iconColor} />
                  )}
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>{item.workoutName || 'Workout'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.workoutValue}>{item.completedSets || 0}</Text>
                    <Text style={styles.workoutValue}>x{item.completedReps || 0}</Text>
                    <Text style={styles.workoutUnit}>SETS</Text>
                  </View>
                </View>
                <Text style={styles.workoutDateLabel}>Today</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />

      </ScrollView>

      {/* Modal for Menu */}
      <Modal
        transparent
        visible={isModalVisible}
        animationType="none"
        onRequestClose={() => setShowGoalMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGoalMenu(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuAnimatedWrapper,
            {
              top: menuPosition.top,
              right: menuPosition.right,
              opacity: menuOpacity,
              transform: [
                { translateX: menuTranslateX },
                { translateY: menuTranslateY },
                { scale: menuScale }
              ],
            }
          ]}
          pointerEvents="auto"
        >
          <LiquidGlassCard borderRadius={28} width={260}>
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="circle-slice-8" size={20} color="#FFF" />}
              label="Adjust Goal for Today"
              onPress={handleAdjustGoal}
            />
            <LiquidGlassMenuItem
              icon={<MaterialCommunityIcons name="calendar-month" size={20} color="#FFF" />}
              label="Change Schedule"
              onPress={handleChangeSchedule}
            />
          </LiquidGlassCard>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  headerIcons: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 24,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  weekDayContainer: {
    alignItems: 'center',
  },
  dayLabelContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  selectedDayLabelContainer: {
    backgroundColor: '#FA114F',
  },
  weekDayText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  smallRingContainer: {
    alignItems: 'center',
  },
  mainRingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arrowCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: '#FA114F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  moveLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  moveValue: {
    fontSize: 36,
    fontWeight: '600',
    color: MetricColors.energy,
  },
  moveCurrent: {
    color: MetricColors.energy,
    fontSize: 36,
    fontWeight: '600',
  },
  moveGoal: {
    color: MetricColors.energy,
    fontSize: 36,
    fontWeight: '600',
  },
  kcalUnit: {
    color: MetricColors.energy,
    fontSize: 20,
    fontWeight: '600',
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E', // Lighter gray
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: MetricColors.energy, // Orange ring
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonText: {
    color: MetricColors.energy,
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuAnimatedWrapper: {
    position: 'absolute',
    zIndex: 100,
  },
  menuWrapper: {
    position: 'absolute',
    // top and right are set dynamically
    borderRadius: 36,
    overflow: 'hidden',
    width: 260,
    zIndex: 100, // Ensure it's on top
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  blurView: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 25,
    paddingLeft: 31,
  },
  menuIcon: {
    width: 20,
    marginRight: 12,
  },
  menuText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  graphSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  graphTotalLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 8,
  },
  graphTotalLabelAbsolute: {
    position: 'absolute',
    top: 4,
    left: 0,
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    zIndex: 10,
  },
  graphContainer: {
    height: 80,
    justifyContent: 'flex-end',
  },
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    justifyContent: 'space-between',
    marginBottom: 4,
    position: 'relative',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 2,
    backgroundColor: MetricColors.energy,
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  graphLabel: {
    color: '#8E8E93',
    fontSize: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
  },
  graphDottedLine: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#FA114F',
  },
  timeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: MetricColors.energy,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  statItem: {
    // flex: 1, // Removed to allow tighter spacing
  },
  statLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginLeft: 20,
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(157, 236, 44, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  workoutValue: {
    color: '#F9104F',
    fontSize: 22,
    fontWeight: 'bold',
  },
  workoutUnit: {
    color: '#F9104F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  workoutDateLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
});
