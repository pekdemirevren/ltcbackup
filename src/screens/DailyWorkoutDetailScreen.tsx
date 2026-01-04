import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import { LiquidGlassCard, LiquidGlassMenuItem } from '../components/LiquidGlass';
import MetricColors from '../constants/MetricColors';
import { ThemeContext } from '../contexts/ThemeContext';
import { WorkoutDayType, WORKOUT_DAY_COLORS, loadWorkoutDayCards } from '../utils/WorkoutDayManager';
import { allWorkouts, Workout } from '../constants/workoutData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Display name mapping for workout days
const WORKOUT_DAY_DISPLAY_NAMES: Record<string, string> = {
  'LEG DAY': 'Leg day',
  'CHEST DAY': 'Chest day',
  'SHOULDER DAY': 'Shoulder day',
  'BACK DAY': 'Back day',
  'ABS DAY': 'Abs day',
  'BICEPS-TRICEPS DAY': 'Arms day',
};

type DailyWorkoutDetailRouteProp = RouteProp<RootStackParamList, 'DailyWorkoutDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const DailyWorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DailyWorkoutDetailRouteProp>();
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { background: '#000' };
  const { workoutDay, currentDay, totalDays } = route.params || {};

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState('30 minutes before');
  const [secondAlert, setSecondAlert] = useState('None');
  
  // Animation values for the +/- button and menu
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Get workout day info
  const workoutDayType = workoutDay as WorkoutDayType;
  const workoutColor = WORKOUT_DAY_COLORS[workoutDayType] || MetricColors.energy;
  const workoutTitle = WORKOUT_DAY_DISPLAY_NAMES[workoutDayType] || workoutDay || 'Workout Day';
  
  // Format current date
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = today.getDate();
  const monthName = today.toLocaleDateString('en-US', { month: 'short' });
  const year = today.getFullYear();
  const fullDateString = `${dayNumber} ${monthName} ${year} ${dayName}`;
  
  // Time (17:15 - 18:15)
  const startHour = 17;
  const startMinute = 15;
  const endHour = 18;
  const endMinute = 15;
  const timeString = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} – ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

  useEffect(() => {
    loadWorkoutData();
  }, [workoutDay]);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      const cardIds = await loadWorkoutDayCards(workoutDayType);
      if (cardIds && cardIds.length > 0) {
        const dayWorkouts = allWorkouts.filter((w: Workout) => 
          cardIds.includes(w.workoutId)
        ).slice(0, 4);
        setWorkouts(dayWorkouts.length > 0 ? dayWorkouts : allWorkouts.slice(0, 4));
      } else {
        setWorkouts(allWorkouts.slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading workout cards:', error);
      setWorkouts(allWorkouts.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    const toValue = menuVisible ? 0 : 1;
    setMenuVisible(!menuVisible);
    Animated.spring(menuAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleMenuOption = (option: string) => {
    toggleMenu();
    if (option === 'adjustCards') {
      Alert.alert('Adjust Cards', 'Adjust cards for today feature coming soon');
    } else if (option === 'changeSchedule') {
      Alert.alert('Change Schedule', 'Change schedule feature coming soon');
    }
  };

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout day?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    Alert.alert('Edit', 'Edit workout feature coming soon');
  };

  const handleWorkoutPress = (workout: Workout) => {
    navigation.navigate('GenericWorkoutSettingsScreen', {
      workoutId: workout.workoutId,
      workoutName: workout.name,
    });
  };

  // Animation interpolations
  const buttonOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  const buttonScale = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  // Timeline hours
  const timelineHours = [startHour - 1, startHour, startHour + 1];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with pill buttons */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerPill}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={18} color="#007AFF" />
            <Text style={styles.headerPillText}>{monthName} {dayNumber}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerPill}
            onPress={handleEdit}
          >
            <Text style={styles.headerPillText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Large Title with color dot */}
        <View style={styles.titleSection}>
          <View style={[styles.colorDot, { backgroundColor: workoutColor }]} />
          <Text style={styles.largeTitle}>{workoutTitle}</Text>
        </View>

        {/* Date and Time */}
        <View style={styles.dateTimeSection}>
          <Text style={styles.dateText}>{fullDateString}</Text>
          <Text style={styles.timeText}>{timeString}</Text>
        </View>

        {/* Timeline Block */}
        <View style={styles.timelineContainer}>
          {timelineHours.map((hour, index) => {
            const isEventSlot = hour === startHour;
            const timeLabel = `${String(hour).padStart(2, '0')}:00`;
            
            return (
              <View key={hour} style={styles.timeSlot}>
                <Text style={styles.timeLabel}>{timeLabel}</Text>
                <View style={styles.timeSlotContent}>
                  {isEventSlot && (
                    <View style={[styles.eventBlock, { backgroundColor: workoutColor }]}>
                      <Text style={styles.eventBlockTitle}>{workoutTitle}</Text>
                      <View style={styles.eventBlockTimeRow}>
                        <Feather name="clock" size={12} color="#FFF" />
                        <Text style={styles.eventBlockTime}>{timeString}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Calendar Row */}
        <TouchableOpacity style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <View style={[styles.settingsIcon, { backgroundColor: '#FF3B30' }]}>
              <Feather name="calendar" size={16} color="#FFF" />
            </View>
            <Text style={styles.settingsLabel}>Calendar</Text>
          </View>
          <View style={styles.settingsRowRight}>
            <View style={[styles.calendarDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.settingsValue}>kurtarltc@gmail.com</Text>
            <Feather name="chevron-down" size={16} color="#8E8E93" />
          </View>
        </TouchableOpacity>

        {/* Alert Row */}
        <TouchableOpacity style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <View style={[styles.settingsIcon, { backgroundColor: '#8E8E93' }]}>
              <Feather name="bell" size={16} color="#FFF" />
            </View>
            <Text style={styles.settingsLabel}>Alert</Text>
          </View>
          <View style={styles.settingsRowRight}>
            <Text style={styles.settingsValue}>{selectedAlert}</Text>
            <Feather name="chevron-down" size={16} color="#8E8E93" />
          </View>
        </TouchableOpacity>

        {/* Second Alert Row */}
        <TouchableOpacity style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <View style={[styles.settingsIcon, { backgroundColor: '#8E8E93' }]}>
              <Feather name="bell" size={16} color="#FFF" />
            </View>
            <Text style={styles.settingsLabel}>Second Alert</Text>
          </View>
          <View style={styles.settingsRowRight}>
            <Text style={styles.settingsValue}>{secondAlert}</Text>
            <Feather name="chevron-down" size={16} color="#8E8E93" />
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Workout Section */}
        <View style={styles.workoutSection}>
          <View style={styles.workoutHeader}>
            <Text style={styles.sectionTitle}>Workout</Text>
            
            {/* Floating Menu Button */}
            <Animated.View style={{ 
              opacity: buttonOpacity, 
              transform: [{ scale: buttonScale }] 
            }}>
              <TouchableOpacity
                style={[styles.goalButton, { backgroundColor: workoutColor }]}
                onPress={toggleMenu}
              >
                <View style={styles.goalButtonInner}>
                  <Text style={styles.goalButtonText}>−  +</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading workouts...</Text>
            </View>
          ) : (
            <View style={styles.workoutGrid}>
              {workouts.slice(0, 4).map((workout) => {
                const SvgIcon = workout.SvgIcon;
                return (
                  <TouchableOpacity
                    key={workout.id}
                    style={styles.workoutCard}
                    onPress={() => handleWorkoutPress(workout)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.cardIconContainer, { backgroundColor: workoutColor + '30' }]}>
                      {SvgIcon && <SvgIcon width={40} height={40} fill={workoutColor} />}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{workout.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteEvent}
        >
          <Text style={styles.deleteButtonText}>Delete Workout Day</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Menu */}
      <Animated.View 
        style={[
          styles.floatingMenu,
          {
            opacity: menuOpacity,
            transform: [{ translateX: menuTranslateX }],
          }
        ]}
        pointerEvents={menuVisible ? 'auto' : 'none'}
      >
        <LiquidGlassCard style={styles.menuCard}>
          <LiquidGlassMenuItem
            icon={<Feather name="sliders" size={18} color="#FFF" />}
            label="Adjust Cards for Today"
            onPress={() => handleMenuOption('adjustCards')}
          />
          <View style={styles.menuDivider} />
          <LiquidGlassMenuItem
            icon={<Feather name="calendar" size={18} color="#FFF" />}
            label="Change Schedule"
            onPress={() => handleMenuOption('changeSchedule')}
          />
        </LiquidGlassCard>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  headerPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  dateTimeSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFF',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  timelineContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeLabel: {
    width: 50,
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    paddingTop: 4,
  },
  timeSlotContent: {
    flex: 1,
    minHeight: 50,
  },
  eventBlock: {
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  eventBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  eventBlockTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventBlockTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFF',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFF',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  settingsValue: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  divider: {
    height: 32,
  },
  workoutSection: {
    paddingHorizontal: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  goalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goalButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 120,
  },
  floatingMenu: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  menuCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export default DailyWorkoutDetailScreen;
